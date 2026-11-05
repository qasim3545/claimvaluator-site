<?php
/**
 * /leads-admin/: sign in, read and sort leads, mark them handled, delete, and export CSV.
 * The first visit asks for the setup code (in cv-data/config.php) and a new password.
 */

declare(strict_types=1);
require __DIR__ . '/../cv-data/lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

session_set_cookie_params(['lifetime' => 0, 'path' => '/leads-admin/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Strict']);
session_name('cv_admin');
session_start();

$admin = cv_admin();
$error = '';
$notice = '';
$csrf = $_SESSION['csrf'] ??= bin2hex(random_bytes(16));
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$action = $post ? (string) ($_POST['action'] ?? '') : (string) ($_GET['action'] ?? '');

if ($post && !hash_equals($csrf, (string) ($_POST['csrf'] ?? ''))) {
    http_response_code(400);
    exit('This form expired. Go back, reload the page and try again.');
}

try {
    // First run: set the password with the setup code.
    if (!$admin) {
        if ($post && $action === 'setup') {
            if (cv_rate_limited('setup', 5, 900)) {
                $error = 'Too many tries. Wait 15 minutes.';
            } elseif (!hash_equals(cv_config()['setup_code'], trim((string) ($_POST['code'] ?? '')))) {
                $error = 'That setup code is not right. It is in cv-data/config.php.';
            } elseif (strlen((string) ($_POST['password'] ?? '')) < 10) {
                $error = 'Use a password of at least 10 characters.';
            } elseif ($_POST['password'] !== ($_POST['password2'] ?? '')) {
                $error = 'The two passwords do not match.';
            } else {
                $admin = ['hash' => password_hash((string) $_POST['password'], PASSWORD_DEFAULT), 'created' => gmdate('c')];
                cv_save_admin($admin);
                session_regenerate_id(true);
                $_SESSION['ok'] = true;
                header('Location: ./');
                exit;
            }
        }
        page_setup($csrf, $error);
        exit;
    }

    if ($post && $action === 'login') {
        if (cv_rate_limited('login', 6, 900, false)) {
            $error = 'Too many wrong passwords. Wait 15 minutes.';
        } elseif (password_verify((string) ($_POST['password'] ?? ''), $admin['hash'])) {
            session_regenerate_id(true);
            $_SESSION['ok'] = true;
            header('Location: ./');
            exit;
        } else {
            cv_rate_limited('login', 6, 900);
            $error = 'Wrong password.';
        }
    }
    if ($action === 'logout' && $post) {
        $_SESSION = [];
        session_destroy();
        header('Location: ./');
        exit;
    }
    if (empty($_SESSION['ok'])) {
        page_login($csrf, $error);
        exit;
    }

    $db = cv_db();
    if ($post && $action === 'toggle') {
        $db->prepare('UPDATE leads SET handled = 1 - handled WHERE id = ?')->execute([(int) $_POST['id']]);
        header('Location: ./?' . http_build_query(array_intersect_key($_GET, ['kind' => 1, 'status' => 1, 'q' => 1])));
        exit;
    }
    if ($post && $action === 'delete') {
        $db->prepare('DELETE FROM leads WHERE id = ?')->execute([(int) $_POST['id']]);
        $notice = 'Lead deleted.';
    }
    if ($post && $action === 'password') {
        if (!password_verify((string) ($_POST['current'] ?? ''), $admin['hash'])) {
            $error = 'Your current password is not right.';
        } elseif (strlen((string) ($_POST['password'] ?? '')) < 10) {
            $error = 'Use a new password of at least 10 characters.';
        } else {
            $admin['hash'] = password_hash((string) $_POST['password'], PASSWORD_DEFAULT);
            cv_save_admin($admin);
            $notice = 'Password changed.';
        }
    }

    // Filters
    $kind = (string) ($_GET['kind'] ?? '');
    $status = (string) ($_GET['status'] ?? '');
    $q = trim((string) ($_GET['q'] ?? ''));
    $where = [];
    $args = [];
    if (isset(CV_KINDS[$kind])) {
        $where[] = 'kind = ?';
        $args[] = $kind;
    }
    if ($status === 'open' || $status === 'handled') {
        $where[] = 'handled = ?';
        $args[] = $status === 'handled' ? 1 : 0;
    }
    if ($q !== '') {
        $where[] = '(name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ? OR state LIKE ?)';
        array_push($args, ...array_fill(0, 5, '%' . $q . '%'));
    }
    $sql = 'SELECT * FROM leads' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC';
    $stmt = $db->prepare($sql);
    $stmt->execute($args);
    $rows = $stmt->fetchAll();

    if ($action === 'export') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="claimvaluator-leads-' . gmdate('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['ID', 'Date (UTC)', 'Type', 'Name', 'Email', 'Phone', 'State', 'Message', 'Page', 'Consent', 'Handled', 'Email sent']);
        foreach ($rows as $r) {
            // A leading = + - @ would run as a formula in Excel, so it is prefixed.
            $safe = array_map(static fn ($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, [
                $r['id'], $r['created_at'], CV_KINDS[$r['kind']] ?? $r['kind'], $r['name'], $r['email'], $r['phone'], $r['state'], $r['message'], $r['page'],
                $r['consent'] ? 'yes' : 'no', $r['handled'] ? 'yes' : 'no', $r['emailed'] ? 'yes' : 'no',
            ]);
            fputcsv($out, $safe);
        }
        exit;
    }

    $counts = $db->query('SELECT COUNT(*) AS total, SUM(handled = 0) AS open FROM leads')->fetch();
    page_dashboard($csrf, $rows, $counts, $kind, $status, $q, $error, $notice);
} catch (Throwable $e) {
    error_log('[claimvaluator admin] ' . $e->getMessage());
    shell('Problem', '<p class="msg msg--bad">' . cv_h($e->getMessage()) . '</p>');
}

function shell(string $title, string $body): void
{
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="robots" content="noindex,nofollow"><title>' . cv_h($title) . ' | ClaimValuator leads</title><link rel="icon" href="/favicon.svg">'
        . '<style>' . css() . '</style></head><body><header class="top"><a class="brand" href="./">ClaimValuator <span>Leads</span></a></header><main class="wrap">'
        . $body . '</main></body></html>';
}

function css(): string
{
    return ':root{--navy:#0b1f3a;--navy2:#173a63;--brass:#c39a4b;--ink:#0f1a2a;--ink2:#55627a;--rule:#d5dde7;--panel:#f2f5f9;--red:#b3261e;--green:#1d6b45}'
        . '*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--panel)}'
        . '.top{background:var(--navy);padding:14px 20px;border-bottom:3px solid var(--brass)}.brand{color:#fff;text-decoration:none;font:700 20px Georgia,serif}.brand span{color:var(--brass);font:600 14px system-ui;margin-left:6px}'
        . '.wrap{max-width:1200px;margin:0 auto;padding:24px 16px}h1{font:400 28px Georgia,serif;margin:0 0 6px}.sub{color:var(--ink2);margin:0 0 20px}'
        . '.card{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:20px;max-width:420px}label{display:block;font-weight:600;margin:14px 0 4px}'
        . 'input,select{font:inherit;width:100%;padding:9px 10px;border:1px solid #9fb0c6;border-radius:4px;background:#fff}button,.btn{font:inherit;font-weight:700;cursor:pointer;border:0;border-radius:4px;padding:9px 16px;background:var(--navy);color:#fff;text-decoration:none;display:inline-block}'
        . '.btn--brass{background:var(--brass);color:var(--navy)}.btn--ghost{background:transparent;color:var(--navy);border:1px solid var(--rule)}.btn--small{padding:5px 10px;font-size:13px}.danger{background:transparent;color:var(--red);border:1px solid #e8b9b5}'
        . '.msg{padding:10px 12px;border-radius:4px;margin:12px 0}.msg--bad{background:#fbebe9;color:var(--red)}.msg--ok{background:#e7f3ec;color:var(--green)}'
        . '.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:0 0 16px}.bar>div{min-width:150px}.bar label{margin-top:0}.stats{display:flex;gap:24px;margin:0 0 16px;color:var(--ink2)}.stats b{color:var(--ink);font-size:20px;display:block}'
        . '.lead{background:#fff;border:1px solid var(--rule);border-left:4px solid var(--brass);border-radius:8px;padding:14px 16px;margin:0 0 12px}.lead.is-done{border-left-color:var(--rule);opacity:.75}'
        . '.lead__top{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline}.lead__name{font-weight:700;font-size:16px}.tag{font-size:12px;font-weight:600;padding:2px 8px;border-radius:99px;background:var(--panel);color:var(--navy2)}'
        . '.lead__meta{color:var(--ink2);font-size:13px}.lead__msg{white-space:pre-wrap;margin:8px 0;max-width:80ch}.lead__act{display:flex;gap:8px;flex-wrap:wrap}.lead__act form{margin:0}'
        . 'details{margin-top:28px}summary{cursor:pointer;font-weight:700}a{color:#1d4e89}';
}

function hidden(string $csrf, string $action, array $extra = []): string
{
    $h = '<input type="hidden" name="csrf" value="' . cv_h($csrf) . '"><input type="hidden" name="action" value="' . cv_h($action) . '">';
    foreach ($extra as $k => $v) {
        $h .= '<input type="hidden" name="' . cv_h($k) . '" value="' . cv_h((string) $v) . '">';
    }
    return $h;
}

function page_setup(string $csrf, string $error): void
{
    shell('Set up', '<h1>Set up the leads inbox</h1><p class="sub">Enter the setup code and choose the password you will use to sign in.</p>'
        . ($error ? '<p class="msg msg--bad">' . cv_h($error) . '</p>' : '')
        . '<form class="card" method="post">' . hidden($csrf, 'setup')
        . '<label for="code">Setup code</label><input id="code" name="code" required autocomplete="off">'
        . '<label for="p1">New password</label><input id="p1" name="password" type="password" minlength="10" required autocomplete="new-password">'
        . '<label for="p2">Repeat password</label><input id="p2" name="password2" type="password" minlength="10" required autocomplete="new-password">'
        . '<p><button type="submit">Save password</button></p></form>');
}

function page_login(string $csrf, string $error): void
{
    shell('Sign in', '<h1>Sign in</h1><p class="sub">The leads inbox for ClaimValuator.</p>'
        . ($error ? '<p class="msg msg--bad">' . cv_h($error) . '</p>' : '')
        . '<form class="card" method="post">' . hidden($csrf, 'login')
        . '<label for="pw">Password</label><input id="pw" name="password" type="password" required autocomplete="current-password" autofocus>'
        . '<p><button type="submit">Sign in</button></p></form>');
}

function page_dashboard(string $csrf, array $rows, array $counts, string $kind, string $status, string $q, string $error, string $notice): void
{
    $qs = static fn (array $extra = []) => http_build_query(array_filter(['kind' => $kind, 'status' => $status, 'q' => $q] + $extra, static fn ($v) => $v !== ''));
    $opt = static fn (array $list, string $cur) => implode('', array_map(static fn ($k, $v) => '<option value="' . cv_h($k) . '"' . ($k === $cur ? ' selected' : '') . '>' . cv_h($v) . '</option>', array_keys($list), $list));
    $html = '<div class="lead__top" style="justify-content:space-between"><div><h1>Leads</h1><p class="sub">Every form sent from the site, newest first.</p></div>'
        . '<form method="post">' . hidden($csrf, 'logout') . '<button class="btn--ghost btn" type="submit">Sign out</button></form></div>';
    if ($error) {
        $html .= '<p class="msg msg--bad">' . cv_h($error) . '</p>';
    }
    if ($notice) {
        $html .= '<p class="msg msg--ok">' . cv_h($notice) . '</p>';
    }
    $html .= '<div class="stats"><div><b>' . (int) $counts['total'] . '</b>leads in total</div><div><b>' . (int) $counts['open'] . '</b>not handled yet</div></div>';
    $html .= '<form class="bar" method="get"><div><label for="k">Type</label><select id="k" name="kind"><option value="">All types</option>' . $opt(CV_KINDS, $kind) . '</select></div>'
        . '<div><label for="s">Status</label><select id="s" name="status">' . $opt(['' => 'All', 'open' => 'Not handled', 'handled' => 'Handled'], $status) . '</select></div>'
        . '<div style="flex:1;min-width:200px"><label for="q">Search</label><input id="q" name="q" value="' . cv_h($q) . '" placeholder="Name, email, phone, state or message"></div>'
        . '<div><button type="submit">Show</button></div><div><a class="btn btn--brass" href="?' . $qs(['action' => 'export']) . '">Export CSV</a></div></form>';
    if (!$rows) {
        $html .= '<p class="card" style="max-width:none">No leads match. New requests from the case review, contact and lawyer forms appear here.</p>';
    }
    foreach ($rows as $r) {
        $date = date('M j, Y g:i a', strtotime($r['created_at'])) . ' UTC';
        $html .= '<article class="lead' . ($r['handled'] ? ' is-done' : '') . '"><div class="lead__top"><span class="lead__name">' . cv_h($r['name']) . '</span>'
            . '<span class="tag">' . cv_h(CV_KINDS[$r['kind']] ?? $r['kind']) . '</span>' . ($r['state'] ? '<span class="tag">' . cv_h(ucwords(str_replace('-', ' ', $r['state']))) . '</span>' : '')
            . '<span class="lead__meta">' . cv_h($date) . '</span></div>'
            . '<div class="lead__meta"><a href="mailto:' . cv_h($r['email']) . '">' . cv_h($r['email']) . '</a>' . ($r['phone'] ? ' &nbsp; <a href="tel:' . cv_h($r['phone']) . '">' . cv_h($r['phone']) . '</a>' : '')
            . ' &nbsp; from ' . cv_h($r['page'] ?: '-') . ($r['emailed'] ? '' : ' &nbsp; (email alert not sent)') . '</div>'
            . '<p class="lead__msg">' . cv_h($r['message']) . '</p><div class="lead__act">'
            . '<form method="post" action="?' . $qs() . '">' . hidden($csrf, 'toggle', ['id' => $r['id']]) . '<button class="btn btn--small" type="submit">' . ($r['handled'] ? 'Mark not handled' : 'Mark handled') . '</button></form>'
            . '<form method="post" action="?' . $qs() . '">' . hidden($csrf, 'delete', ['id' => $r['id']]) . '<button class="btn btn--small danger" type="submit">Delete</button></form>'
            . '</div></article>';
    }
    $html .= '<details><summary>Change password</summary><form class="card" method="post">' . hidden($csrf, 'password')
        . '<label for="cur">Current password</label><input id="cur" name="current" type="password" required autocomplete="current-password">'
        . '<label for="np">New password</label><input id="np" name="password" type="password" minlength="10" required autocomplete="new-password">'
        . '<p><button type="submit">Change password</button></p></form></details>';
    shell('Leads', $html);
}
