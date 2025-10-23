<?php
/**
 * Debug script to check bot configuration
 *
 * Add this to WordPress root and visit: yoursite.com/debug-bot-config.php
 * DELETE AFTER USE - contains sensitive info!
 */

require_once('wp-load.php');

header('Content-Type: text/plain');

echo "=== SYNOFEX CHATBOT DEBUG ===\n\n";

$auth_token = get_option('synofex_auth_token', '');
$bot_config = get_option('synofex_bot_config', []);
$token_valid = get_option('synofex_token_valid', false);

echo "Token Valid: " . ($token_valid ? 'YES' : 'NO') . "\n\n";

if ($auth_token) {
    $parts = explode(':', $auth_token);
    if (count($parts) === 3) {
        echo "Token Format: userId:botId:secret\n";
        echo "User ID: " . $parts[0] . "\n";
        echo "Bot ID from token: " . $parts[1] . "\n";
        echo "Secret: " . substr($parts[2], 0, 8) . "...\n\n";
    }
}

echo "Bot Config:\n";
echo "- bot_id: " . ($bot_config['bot_id'] ?? 'NOT SET') . "\n";
echo "- id: " . ($bot_config['id'] ?? 'NOT SET') . "\n";
echo "- name: " . ($bot_config['name'] ?? 'NOT SET') . "\n";
echo "- welcome_message: " . ($bot_config['welcome_message'] ?? 'NOT SET') . "\n";
echo "- welcomeMessage: " . ($bot_config['welcomeMessage'] ?? 'NOT SET') . "\n";
echo "\nFull Config:\n";
print_r($bot_config);
