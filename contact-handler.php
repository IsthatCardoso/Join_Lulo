<?php
declare(strict_types=1);

// Handles the contact form and sends one formatted message through Simply.com SMTP.
header('Content-Type: text/html; charset=UTF-8');

function showResult(int $statusCode, string $title, string $message): void
{
    http_response_code($statusCode);
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!doctype html><html lang="da"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
    echo '<title>' . $safeTitle . ' | LULO</title><link rel="stylesheet" href="css/style.css">';
    echo '<main class="sec story-content"><h1>' . $safeTitle . '</h1><p class="lead">' . $safeMessage . '</p>';
    echo '<a class="btn" href="contact.html">Tilbage til kontaktsiden</a></main></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    showResult(405, 'Ugyldig forespørgsel', 'Åbn kontaktsiden og send formularen derfra.');
}

// Quietly ignore automated submissions that fill the hidden honeypot.
if (trim((string) ($_POST['_honey'] ?? '')) !== '') {
    showResult(200, 'Tak for din besked', 'Din besked er modtaget.');
}

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$description = trim((string) ($_POST['description'] ?? ''));

if ($name === '' || $email === '' || $description === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    showResult(422, 'Tjek formularen', 'Udfyld navn, en gyldig e-mailadresse og beskrivelse, og prøv igen.');
}

if (strlen($name) > 600 || strlen($phone) > 320 || strlen($email) > 254 || strlen($description) > 40000) {
    showResult(422, 'Beskeden er for lang', 'Kontrollér felterne, og prøv igen.');
}

$configPath = __DIR__ . '/private/mail-config.php';
if (!is_file($configPath)) {
    showResult(503, 'Formularen er ikke sat op endnu', 'E-mailafsendelsen skal først konfigureres på webhotellet. Kontakt info@joinlulo.dk.');
}

$mailConfig = require $configPath;
$smtpHost = (string) ($mailConfig['smtp_host'] ?? 'websmtp.simply.com');
$smtpPort = (int) ($mailConfig['smtp_port'] ?? 587);
$smtpUsername = (string) ($mailConfig['smtp_username'] ?? '');
$smtpPassword = (string) ($mailConfig['smtp_password'] ?? '');
$recipient = (string) ($mailConfig['recipient'] ?? 'info@joinlulo.dk');

if ($smtpUsername === '' || $smtpPassword === '' || $smtpPassword === 'ADD_THE_MAILBOX_PASSWORD_HERE' || !filter_var($smtpUsername, FILTER_VALIDATE_EMAIL) || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    showResult(503, 'Formularen er ikke sat op endnu', 'SMTP-kontoen skal konfigureres sikkert på webhotellet. Kontakt info@joinlulo.dk.');
}

function smtpRead($socket, array $expectedCodes): string
{
    $response = '';
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (strlen($line) < 4 || $line[3] === ' ') {
            break;
        }
    }

    if ($response === '' || !in_array((int) substr($response, 0, 3), $expectedCodes, true)) {
        throw new RuntimeException('SMTP server returned an unexpected response.');
    }

    return $response;
}

function smtpCommand($socket, string $command, array $expectedCodes): string
{
    if (fwrite($socket, $command . "\r\n") === false) {
        throw new RuntimeException('Could not write to SMTP server.');
    }
    return smtpRead($socket, $expectedCodes);
}

function encodeHeader(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

try {
    $socket = stream_socket_client(
        'tcp://' . $smtpHost . ':' . $smtpPort,
        $errorNumber,
        $errorMessage,
        15,
        STREAM_CLIENT_CONNECT
    );

    if ($socket === false) {
        throw new RuntimeException('Could not connect to SMTP server.');
    }

    stream_set_timeout($socket, 15);
    smtpRead($socket, [220]);
    smtpCommand($socket, 'EHLO joinlulo.dk', [250]);
    smtpCommand($socket, 'STARTTLS', [220]);

    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        throw new RuntimeException('Could not establish encrypted SMTP connection.');
    }

    smtpCommand($socket, 'EHLO joinlulo.dk', [250]);
    smtpCommand($socket, 'AUTH LOGIN', [334]);
    smtpCommand($socket, base64_encode($smtpUsername), [334]);
    smtpCommand($socket, base64_encode($smtpPassword), [235]);
    smtpCommand($socket, 'MAIL FROM:<' . $smtpUsername . '>', [250]);
    smtpCommand($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
    smtpCommand($socket, 'DATA', [354]);

    $fields = [
        'Navn' => $name,
        'Telefon' => $phone !== '' ? $phone : 'Ikke oplyst',
        'E-mail' => $email,
        'Beskrivelse' => $description,
    ];
    $rows = '';
    foreach ($fields as $label => $value) {
        $rows .= '<tr><th style="padding:10px;border:1px solid #ddd;text-align:left">'
            . htmlspecialchars($label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
            . '</th><td style="padding:10px;border:1px solid #ddd">'
            . nl2br(htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'))
            . '</td></tr>';
    }

    $htmlBody = '<!doctype html><html><body><h2>Ny kontaktbesked fra LULO</h2>'
        . '<table style="border-collapse:collapse;width:100%">' . $rows . '</table></body></html>';
    $headers = [
        'From: LULO website <' . $smtpUsername . '>',
        'To: <' . $recipient . '>',
        'Reply-To: ' . $email,
        'Subject: ' . encodeHeader('Ny besked fra LULOs kontaktside'),
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ];
    $message = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($htmlBody));
    $message = preg_replace('/(^|\r\n)\./', '$1..', $message) ?? $message;
    fwrite($socket, $message . "\r\n.\r\n");
    smtpRead($socket, [250]);
    smtpCommand($socket, 'QUIT', [221]);
    fclose($socket);
} catch (Throwable $error) {
    if (isset($socket) && is_resource($socket)) {
        fclose($socket);
    }
    error_log('LULO contact form SMTP error: ' . $error->getMessage());
    showResult(502, 'Beskeden kunne ikke sendes', 'E-mailserveren svarede ikke. Prøv igen senere, eller skriv direkte til info@joinlulo.dk.');
}

showResult(200, 'Tak for din besked', 'Din besked er sendt til LULO.');
