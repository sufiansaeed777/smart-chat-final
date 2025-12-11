<?php
/**
 * Synofex AJAX Handler
 *
 * Handles AJAX requests from the chat widget frontend
 *
 * TODO: Future Non-WordPress Support
 * - Create REST API endpoints for JavaScript widget
 * - Add CORS headers for cross-domain requests
 * - Support WebSocket connections for real-time chat
 */

if (!defined('ABSPATH')) {
    exit;
}

class Synofex_AJAX_Handler {

    /**
     * API Client instance
     */
    private $api_client;

    /**
     * Constructor
     */
    public function __construct() {
        // Setup AJAX hooks for logged-in and guest users
        add_action('wp_ajax_synofex_send_message', [$this, 'handle_send_message']);
        add_action('wp_ajax_nopriv_synofex_send_message', [$this, 'handle_send_message']);

        add_action('wp_ajax_synofex_check_connection', [$this, 'handle_check_connection']);
        add_action('wp_ajax_nopriv_synofex_check_connection', [$this, 'handle_check_connection']);

        add_action('wp_ajax_synofex_report_issue', [$this, 'handle_report_issue']);
        add_action('wp_ajax_nopriv_synofex_report_issue', [$this, 'handle_report_issue']);

        add_action('wp_ajax_synofex_request_human', [$this, 'handle_request_human']);
        add_action('wp_ajax_nopriv_synofex_request_human', [$this, 'handle_request_human']);

        add_action('wp_ajax_synofex_download_transcript', [$this, 'handle_download_transcript']);
        add_action('wp_ajax_nopriv_synofex_download_transcript', [$this, 'handle_download_transcript']);
    }

    /**
     * Initialize API client
     */
    private function init_api_client() {
        if (!$this->api_client) {
            $auth_token = get_option('synofex_auth_token');
            if (!$auth_token) {
                wp_send_json_error(['message' => 'Authentication token not configured']);
                exit;
            }

            // CRITICAL: Check if token is expired - block completely
            if (get_option('synofex_token_expired', false)) {
                wp_send_json_error([
                    'message' => 'Your authentication token has expired. Please contact the site administrator.',
                    'expired' => true,
                    'code' => 'TOKEN_EXPIRED'
                ]);
                exit;
            }

            // Check if token is valid
            if (!get_option('synofex_token_valid', false)) {
                wp_send_json_error([
                    'message' => 'Authentication token is invalid. Please check your settings.',
                    'code' => 'TOKEN_INVALID'
                ]);
                exit;
            }

            require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-api-client.php';
            require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-cache.php';
            $this->api_client = new Synofex_API_Client($auth_token);
        }
        return $this->api_client;
    }

    /**
     * Handle send message AJAX request
     */
    public function handle_send_message() {
        // Verify nonce for security
        if (!check_ajax_referer('synofex_ajax_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => 'Security check failed']);
            exit;
        }

        // Get request data
        $message = sanitize_text_field($_POST['message'] ?? '');
        $bot_id = sanitize_text_field($_POST['bot_id'] ?? 'default');
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');

        if (empty($message)) {
            wp_send_json_error(['message' => 'Message cannot be empty']);
            exit;
        }

        // Initialize API client
        $this->init_api_client();

        // Get page URL from POST data (sent by JS widget) or fallback to referer
        $page_url = sanitize_url($_POST['page_url'] ?? '') ?: wp_get_referer();

        // Prepare metadata with visitor info for Human Handoff
        $metadata = [
            'user_ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'],
            'page_url' => $page_url,
            'pageUrl' => $page_url, // Also send as pageUrl for API compatibility
            'wordpress_user' => is_user_logged_in() ? wp_get_current_user()->user_email : 'guest',
            'visitorEmail' => is_user_logged_in() ? wp_get_current_user()->user_email : '',
            'visitorName' => is_user_logged_in() ? wp_get_current_user()->display_name : '',
            'timestamp' => current_time('mysql'),
        ];

        // CRITICAL: Pass session_id from JavaScript client to ensure new sessions work after end chat
        $response = $this->api_client->send_message($bot_id, $message, $metadata, $session_id);

        if ($response && isset($response['response'])) {
            // Success - send response back to frontend
            wp_send_json_success([
                'response' => $response['response'],
                'sessionId' => $response['sessionId'] ?? $session_id,
                'conversationId' => $response['conversationId'] ?? null,
                'mode' => $response['mode'] ?? 'AI',
                'waitingForAgent' => $response['waitingForAgent'] ?? false,
                'typing' => false,
            ]);
        } else {
            // Error - send fallback response
            wp_send_json_error([
                'message' => 'Failed to get response',
                'fallback' => true,
                'response' => 'I apologize for the inconvenience. Our service is temporarily unavailable. Please try again later.'
            ]);
        }
    }

    /**
     * Handle connection check
     */
    public function handle_check_connection() {
        // Verify nonce
        if (!check_ajax_referer('synofex_ajax_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => 'Security check failed']);
            exit;
        }

        // Initialize API client
        $this->init_api_client();

        // Check heartbeat
        $status = $this->api_client->heartbeat();

        wp_send_json_success([
            'status' => $status,
            'connected' => ($status === 'online'),
        ]);
    }

    /**
     * Handle issue reporting
     */
    public function handle_report_issue() {
        // Verify nonce
        if (!check_ajax_referer('synofex_ajax_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => 'Security check failed']);
            exit;
        }

        $bot_id = sanitize_text_field($_POST['bot_id'] ?? 'default');
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        $conversation_id = sanitize_text_field($_POST['conversation_id'] ?? '');
        $name = sanitize_text_field($_POST['name'] ?? '');
        $email = sanitize_email($_POST['email'] ?? '');
        // FIX: JS sends 'description' not 'issue'
        $issue = sanitize_textarea_field($_POST['description'] ?? $_POST['issue'] ?? '');

        // Validate required fields
        if (empty($name)) {
            wp_send_json_error(['message' => 'Name is required']);
            exit;
        }

        if (empty($email) || !is_email($email)) {
            wp_send_json_error(['message' => 'Valid email is required']);
            exit;
        }

        if (empty($issue)) {
            wp_send_json_error(['message' => 'Issue description is required']);
            exit;
        }

        // Initialize API client
        $this->init_api_client();

        // Report issue with name, email, and issue fields
        $response = $this->api_client->report_issue($bot_id, 'issue_report', $issue, $conversation_id, [
            'name' => $name,
            'email' => $email,
            'source' => 'wordpress_plugin'
        ]);

        if ($response) {
            wp_send_json_success([
                'message' => 'Issue reported successfully',
                'ticket_id' => $response['ticket_id'] ?? null,
            ]);
        } else {
            wp_send_json_error(['message' => 'Failed to report issue']);
        }
    }

    /**
     * Handle human handoff request
     */
    public function handle_request_human() {
        // Verify nonce
        if (!check_ajax_referer('synofex_ajax_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => 'Security check failed']);
            exit;
        }

        $bot_id = sanitize_text_field($_POST['bot_id'] ?? 'default');
        $conversation_id = sanitize_text_field($_POST['conversation_id'] ?? '');
        $reason = sanitize_textarea_field($_POST['reason'] ?? '');

        // Initialize API client
        $this->init_api_client();

        // Request human handoff
        $response = $this->api_client->request_human_handoff($bot_id, $conversation_id, $reason);

        if ($response) {
            wp_send_json_success([
                'message' => 'A human agent will assist you shortly',
                'queue_position' => $response['queue_position'] ?? null,
                'estimated_wait' => $response['estimated_wait'] ?? 'a few minutes',
            ]);
        } else {
            wp_send_json_error(['message' => 'Human agents are currently unavailable']);
        }
    }

    /**
     * Handle transcript download
     */
    public function handle_download_transcript() {
        // Verify nonce
        if (!check_ajax_referer('synofex_ajax_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => 'Security check failed']);
            exit;
        }

        $bot_id = sanitize_text_field($_POST['bot_id'] ?? 'default');
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');

        // Get chat messages from frontend
        $messages = $_POST['messages'] ?? [];

        if (empty($messages)) {
            wp_send_json_error(['message' => 'No messages to download']);
            exit;
        }

        // Format transcript
        $transcript = "Chat Transcript\n";
        $transcript .= "Date: " . current_time('Y-m-d H:i:s') . "\n";
        $transcript .= "Website: " . get_site_url() . "\n";
        $transcript .= "Session ID: " . $session_id . "\n";
        $transcript .= str_repeat('-', 50) . "\n\n";

        foreach ($messages as $msg) {
            $sender = sanitize_text_field($msg['sender'] ?? 'unknown');
            $content = sanitize_textarea_field($msg['content'] ?? '');
            $time = sanitize_text_field($msg['time'] ?? '');

            $transcript .= "[{$time}] " . ucfirst($sender) . ": {$content}\n\n";
        }

        // Generate download URL
        $upload_dir = wp_upload_dir();
        $filename = 'chat-transcript-' . date('Y-m-d-His') . '.txt';
        $filepath = $upload_dir['path'] . '/' . $filename;

        // Save file
        if (file_put_contents($filepath, $transcript)) {
            wp_send_json_success([
                'download_url' => $upload_dir['url'] . '/' . $filename,
                'filename' => $filename,
            ]);
        } else {
            wp_send_json_error(['message' => 'Failed to generate transcript']);
        }
    }

    /**
     * Register frontend scripts and localization
     */
    public static function register_scripts() {
        wp_enqueue_script(
            'synofex-chat',
            SYNOFEX_CHATBOT_PLUGIN_URL . 'assets/js/synofex-chat.js',
            ['jquery'],
            SYNOFEX_CHATBOT_VERSION,
            true
        );

        // Localize script with AJAX data
        wp_localize_script('synofex-chat', 'synofex_ajax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('synofex_ajax_nonce'),
        ]);

        // Pass configuration to frontend
        $auth_token = get_option('synofex_auth_token');
        $bot_config = get_option('synofex_bot_config', []);

        wp_localize_script('synofex-chat', 'synofexConfig', [
            'token' => $auth_token,
            'apiUrl' => get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app'),
            'botId' => $bot_config['bot_id'] ?? 'default',
            'botName' => $bot_config['name'] ?? 'AI Assistant',
            'botAvatar' => $bot_config['avatar'] ?? '',
            'welcomeMessage' => $bot_config['welcome_message'] ?? 'Hello! How can I help you today?',
            'placeholder' => $bot_config['placeholder'] ?? 'Type your message...',
            'position' => get_option('synofex_widget_position', 'bottom-right'),
            'theme' => get_option('synofex_widget_theme', 'light'),
            'primaryColor' => $bot_config['primary_color'] ?? '#0066FF',
            'soundEnabled' => get_option('synofex_sound_enabled', true),
        ]);
    }
}

// Initialize AJAX handler
new Synofex_AJAX_Handler();

/**
 * TODO: Non-WordPress Implementation Notes
 *
 * For JavaScript widget (non-WordPress):
 *
 * 1. Create REST API endpoints instead of WordPress AJAX:
 *    - POST /api/widget/message
 *    - GET  /api/widget/status
 *    - POST /api/widget/report
 *
 * 2. Handle CORS for cross-domain requests:
 *    - Add Access-Control-Allow-Origin headers
 *    - Support preflight OPTIONS requests
 *
 * 3. Authentication methods:
 *    - Token in header: Authorization: Bearer TOKEN
 *    - Token in query: ?token=TOKEN
 *    - Domain whitelist validation
 *
 * 4. WebSocket support for real-time:
 *    - ws://localhost:3000/chat
 *    - Socket.IO or native WebSocket
 */