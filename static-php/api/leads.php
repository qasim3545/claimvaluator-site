<?php
/**
 * POST /api/leads: the site's forms (case review, contact, attorney partner, listing request).
 * Answers in the same shape the forms already expect: 201 on success, 400 with errors[0].message.
 */

declare(strict_types=1);
require __DIR__ . '/../cv-data/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function cv_fail(string $message, int $status = 400): never
{
    http_response_code($status);
    echo json_encode(['errors' => [['message' => $message]]]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cv_fail('Send the form to submit a request.', 405);
}

// Only this site's own pages may send the form.
$host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '');
if ($origin === '' || strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
    cv_fail('The form could not be sent. Reload the page and try again.', 403);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$in = json_decode((string) $raw, true);
if (!is_array($in)) {
    cv_fail('The form could not be read. Reload the page and try again.');
}

$str = static fn (string $k, int $max): string => mb_substr(trim((string) ($in[$k] ?? '')), 0, $max);

// Spam trap: people never see this field, bots fill it. Look successful, keep nothing.
if ($str('website', 200) !== '') {
    http_response_code(201);
    echo json_encode(['ok' => true]);
    exit;
}

try {
    // Typos don't count: only sent requests are counted, checked here and recorded after saving.
    if (cv_rate_limited('lead', 5, 3600, false) || cv_rate_limited('lead-day', 12, 86400, false)) {
        cv_fail('Too many requests from this connection. Try again in an hour, or email us directly.', 429);
    }

    $kind = $str('kind', 40);
    if (!isset(CV_KINDS[$kind])) {
        $kind = 'contact';
    }
    $lead = [
        'kind' => $kind,
        'name' => $str('name', 120),
        'email' => $str('email', 200),
        'phone' => $str('phone', 40),
        'state' => $str('state', 60),
        'message' => $str('message', 4000),
        'page' => $str('page', 300),
        'consent' => !empty($in['consent']) ? 1 : 0,
    ];

    foreach (['name', 'email', 'phone', 'state'] as $k) {
        if (preg_match('/[\r\n]/', $lead[$k])) {
            cv_fail('Remove line breaks from ' . $k . '.');
        }
    }
    if (mb_strlen($lead['name']) < 2) {
        cv_fail('Enter your name.');
    }
    if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) {
        cv_fail('Enter a valid email address.');
    }
    if ($lead['phone'] !== '' && !preg_match('/^[0-9 +().\-]{7,40}$/', $lead['phone'])) {
        cv_fail('Enter the phone number using digits only, or leave it blank.');
    }
    if ($lead['state'] !== '' && !preg_match('/^[a-z-]{2,40}$/', $lead['state'])) {
        cv_fail('Choose your state from the list.');
    }
    if ($kind === 'case-review' && $lead['state'] === '') {
        cv_fail('Choose the state where it happened.');
    }
    if (mb_strlen($lead['message']) < 10) {
        cv_fail('Tell us a little more in the message.');
    }
    if (preg_match_all('#https?://#i', $lead['message']) > 3) {
        cv_fail('Remove the links from your message and try again.');
    }
    if (!$lead['consent']) {
        cv_fail('Tick the consent box to send your request.');
    }

    $db = cv_db();
    $db->prepare('INSERT INTO leads (created_at, kind, name, email, phone, state, message, page, consent, ip_hash)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([gmdate('c'), $kind, $lead['name'], $lead['email'], $lead['phone'], $lead['state'], $lead['message'], $lead['page'], $lead['consent'], cv_ip_hash()]);
    $id = (int) $db->lastInsertId();
    cv_rate_limited('lead', 5, 3600);
    cv_rate_limited('lead-day', 12, 86400);

    if (cv_notify($lead)) {
        $db->prepare('UPDATE leads SET emailed = 1 WHERE id = ?')->execute([$id]);
    }

    http_response_code(201);
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    error_log('[claimvaluator leads] ' . $e->getMessage());
    cv_fail('The form could not be sent right now. Please try again in a few minutes.', 500);
}
