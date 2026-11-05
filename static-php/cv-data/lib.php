<?php
/**
 * ClaimValuator lead backend for plain PHP hosting (Hostinger public_html).
 * Leads are kept in a SQLite file in this folder, which .htaccess keeps private.
 */

declare(strict_types=1);

const CV_DATA = __DIR__;

function cv_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require CV_DATA . '/config.php';
    }
    return $config;
}

function cv_db(): PDO
{
    static $db = null;
    if ($db) {
        return $db;
    }
    if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
        throw new RuntimeException('This server is missing PHP SQLite (pdo_sqlite). Turn it on in hPanel → Advanced → PHP Configuration → PHP extensions.');
    }
    $db = new PDO('sqlite:' . CV_DATA . '/leads.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('PRAGMA journal_mode = WAL');
    $db->exec('CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        state TEXT,
        message TEXT NOT NULL,
        page TEXT,
        consent INTEGER NOT NULL DEFAULT 0,
        handled INTEGER NOT NULL DEFAULT 0,
        emailed INTEGER NOT NULL DEFAULT 0,
        ip_hash TEXT
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS hits (ip_hash TEXT NOT NULL, action TEXT NOT NULL, at INTEGER NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS hits_ip ON hits (ip_hash, action, at)');
    return $db;
}

/** A visitor's IP is never stored, only a salted hash used for rate limits. */
function cv_ip_hash(): string
{
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    $ip = trim(explode(',', $ip)[0]);
    return hash('sha256', cv_config()['salt'] . '|' . $ip);
}

/** True when this visitor has done $action $max times within $seconds. Records the attempt. */
function cv_rate_limited(string $action, int $max, int $seconds, bool $record = true): bool
{
    $db = cv_db();
    $ip = cv_ip_hash();
    $since = time() - $seconds;
    $db->prepare('DELETE FROM hits WHERE at < ?')->execute([time() - 86400 * 2]);
    $q = $db->prepare('SELECT COUNT(*) FROM hits WHERE ip_hash = ? AND action = ? AND at >= ?');
    $q->execute([$ip, $action, $since]);
    $limited = (int) $q->fetchColumn() >= $max;
    if ($record && !$limited) {
        $db->prepare('INSERT INTO hits (ip_hash, action, at) VALUES (?, ?, ?)')->execute([$ip, $action, time()]);
    }
    return $limited;
}

function cv_admin_file(): string
{
    return CV_DATA . '/admin.json';
}

function cv_admin(): ?array
{
    $f = cv_admin_file();
    return is_file($f) ? json_decode((string) file_get_contents($f), true) : null;
}

function cv_save_admin(array $admin): void
{
    file_put_contents(cv_admin_file(), json_encode($admin, JSON_PRETTY_PRINT), LOCK_EX);
    @chmod(cv_admin_file(), 0600);
}

function cv_h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

const CV_KINDS = [
    'case-review' => 'Case review',
    'contact' => 'Contact',
    'attorney-partner' => 'Attorney partner',
    'listing-update' => 'Listing request',
];

/** Sends the new-lead alert. Uses the server's mail() with the site's own address as sender. */
function cv_notify(array $lead): bool
{
    $cfg = cv_config();
    $to = $cfg['lead_email'];
    if (!$to) {
        return false;
    }
    $kind = CV_KINDS[$lead['kind']] ?? $lead['kind'];
    $subject = 'New ' . strtolower($kind) . ': ' . $lead['name'] . ($lead['state'] ? ' (' . $lead['state'] . ')' : '');
    $lines = [
        "A new {$kind} request came in on ClaimValuator.",
        '',
        'Name: ' . $lead['name'],
        'Email: ' . $lead['email'],
        'Phone: ' . ($lead['phone'] ?: '-'),
        'State: ' . ($lead['state'] ?: '-'),
        'Page: ' . ($lead['page'] ?: '-'),
        'Consent given: ' . ($lead['consent'] ? 'yes' : 'no'),
        '',
        'Message:',
        $lead['message'],
        '',
        'All leads: https://' . ($_SERVER['HTTP_HOST'] ?? 'claimvaluator.com') . '/leads-admin/',
    ];
    $headers = [
        'From: ClaimValuator <' . $cfg['mail_from'] . '>',
        'Reply-To: ' . $lead['email'],
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: ClaimValuator',
    ];
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return @mail($to, $encodedSubject, implode("\r\n", $lines), implode("\r\n", $headers), '-f' . $cfg['mail_from']);
}
