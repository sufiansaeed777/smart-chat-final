<?php
/**
 * Synofex API Client
 * Handles all communication with the Synofex SaaS platform
 */

if (!defined('ABSPATH')) {
    exit;
}

class Synofex_API_Client {

    /**
     * API base URL
     */
    private $api_url;

    /**
     * Auth token
     */
    private $auth_token;

    /**
     * Cache instance
     */
    private $cache;

    /**
     * Constructor
     */
    public function __construct($auth_token) {
        // Default to production URL, can be overridden in settings
        // For local development, change this in WordPress admin settings
        $this->api_url = get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app');
        $this->auth_token = $auth_token;

        // Initialize cache only if class exists
        if (class_exists('Synofex_Cache')) {
            $this->cache = new Synofex_Cache();
        } else {
            // Fallback: create a simple cache object
            $this->cache = new class {
                public function get($key) { return false; }
                public function set($key, $value, $expiration = 3600) { return false; }
            };
        }
    }

    /**
     * Validate token and domain binding
     */
    public function validate_token($domain) {
        $cache_key = 'token_validation_' . md5($this->auth_token . $domain);
        $cached = $this->cache->get($cache_key);

        // Don't use cache for expired tokens
        if ($cached !== false && (!isset($cached['expired']) || !$cached['expired'])) {
            return $cached;
        }

        // Updated to match Next.js WordPress API endpoint
        $response = $this->make_request('POST', '/api/wordpress/validate-token', [
            'token' => $this->auth_token,
            'domain' => $domain,
        ], true); // Pass true to get full response including errors

        if ($response) {
            // Handle expired token response
            if (isset($response['expired']) && $response['expired']) {
                // Clear cache and return expired response
                $this->cache->set($cache_key, null, 1);
                return [
                    'valid' => false,
                    'expired' => true,
                    'expiredAt' => isset($response['expiredAt']) ? $response['expiredAt'] : null,
                    'error' => isset($response['error']) ? $response['error'] : 'Token has expired'
                ];
            }

            if (isset($response['valid'])) {
                $this->cache->set($cache_key, $response, 3600); // Cache for 1 hour
                return $response;
            }
        }

        return false;
    }

    /**
     * Get bot configuration
     */
    public function get_bot_config($bot_id = null) {
        $cache_key = 'bot_config_' . ($bot_id ?: 'default');
        $cached = $this->cache->get($cache_key);

        if ($cached !== false) {
            return $cached;
        }

        $endpoint = $bot_id ? "/api/settings/{$bot_id}" : '/api/settings';
        $response = $this->make_request('GET', $endpoint);

        if ($response) {
            $this->cache->set($cache_key, $response, 300); // Cache for 5 minutes
            return $response;
        }

        return false;
    }

    /**
     * Send message to bot
     */
    public function send_message($bot_id, $message, $metadata = []) {
        // Updated to match Next.js WordPress API endpoint
        $response = $this->make_request('POST', '/api/wordpress/send-message', [
            'token' => $this->auth_token,
            'bot_id' => $bot_id,
            'message' => $message,
            'metadata' => $metadata,
            'sessionId' => $_COOKIE['synofex_session'] ?? session_id(),
            'source' => 'wordpress',
        ]);

        // Log message locally
        $this->log_message($bot_id, $message, 'user', $metadata);

        if ($response && isset($response['response'])) {
            // Log bot response
            $this->log_message($bot_id, $response['response'], 'bot', $response);
            return $response;
        }

        // Return fallback response if API fails
        return $this->get_fallback_response($message);
    }

    /**
     * Get chat logs
     */
    public function get_logs($bot_id = null, $limit = 100) {
        $endpoint = $bot_id ? "/api/get-logs/{$bot_id}" : '/api/get-logs';

        return $this->make_request('GET', $endpoint, [
            'limit' => $limit,
        ]);
    }

    /**
     * Report issue
     */
    public function report_issue($bot_id, $issue_type, $description, $conversation_id = null) {
        return $this->make_request('POST', '/api/report-issue', [
            'bot_id' => $bot_id,
            'issue_type' => $issue_type,
            'description' => $description,
            'conversation_id' => $conversation_id,
            'source' => 'wordpress',
        ]);
    }

    /**
     * Request human handoff
     */
    public function request_human_handoff($bot_id, $conversation_id, $reason = '') {
        // Update conversation to set mode to 'Human' and status to 'waiting'
        return $this->make_request('PATCH', "/api/conversations/{$conversation_id}", [
            'mode' => 'Human',
            'status' => 'waiting',
            'message' => 'A visitor has requested human assistance: ' . $reason,
        ]);
    }

    /**
     * Heartbeat check
     */
    public function heartbeat() {
        $response = $this->make_request('GET', '/api/health');
        return $response && isset($response['status']) ? $response['status'] : 'offline';
    }

    /**
     * Get analytics data from WordPress-specific endpoint
     */
    public function get_analytics($period = '7days') {
        $cache_key = 'analytics_' . md5($this->auth_token) . '_' . $period;
        $cached = $this->cache->get($cache_key);

        if ($cached !== false) {
            return $cached;
        }

        // Use WordPress-specific analytics endpoint
        $response = $this->make_request('GET', '/api/wordpress/analytics', [
            'period' => $period,
        ]);

        if ($response && !isset($response['error'])) {
            $this->cache->set($cache_key, $response, 300); // Cache for 5 minutes
            return $response;
        }

        return false;
    }

    /**
     * Make API request
     *
     * @param string $method HTTP method
     * @param string $endpoint API endpoint
     * @param array $data Request data
     * @param bool $return_errors If true, returns parsed error responses instead of false
     */
    private function make_request($method, $endpoint, $data = [], $return_errors = false) {
        $url = $this->api_url . $endpoint;

        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->auth_token,
                'Content-Type' => 'application/json',
                'X-Source' => 'wordpress',
                'X-Domain' => get_site_url(),
            ],
            'timeout' => 30,
            'sslverify' => true,
        ];

        if ('GET' === $method && !empty($data)) {
            $url = add_query_arg($data, $url);
        } else if (!empty($data)) {
            $args['body'] = json_encode($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            $this->log_error('API request failed', [
                'endpoint' => $endpoint,
                'error' => $response->get_error_message(),
            ]);
            return false;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $parsed_body = json_decode($body, true);

        if ($status_code >= 200 && $status_code < 300) {
            return $parsed_body;
        }

        // Return error response if requested (useful for handling expired tokens)
        if ($return_errors && $parsed_body) {
            return $parsed_body;
        }

        $this->log_error('API request failed with status ' . $status_code, [
            'endpoint' => $endpoint,
            'response' => $body,
        ]);

        return false;
    }

    /**
     * Get fallback response
     */
    private function get_fallback_response($message) {
        $fallback_responses = [
            'greeting' => [
                'Hello! How can I help you today?',
                'Hi there! What can I do for you?',
                'Welcome! How may I assist you?',
            ],
            'help' => [
                'I\'m here to help! What do you need assistance with?',
                'Sure, I\'d be happy to help. What\'s your question?',
                'How can I assist you today?',
            ],
            'thanks' => [
                'You\'re welcome! Is there anything else?',
                'Happy to help! Let me know if you need anything else.',
                'My pleasure! Anything else I can do for you?',
            ],
            'default' => [
                'I understand. Could you tell me more?',
                'I see. How can I help you with that?',
                'Thank you for your message. Let me assist you.',
            ],
        ];

        $message_lower = strtolower($message);

        if (preg_match('/\b(hi|hello|hey|greetings)\b/', $message_lower)) {
            $responses = $fallback_responses['greeting'];
        } elseif (preg_match('/\b(help|support|assist)\b/', $message_lower)) {
            $responses = $fallback_responses['help'];
        } elseif (preg_match('/\b(thank|thanks)\b/', $message_lower)) {
            $responses = $fallback_responses['thanks'];
        } else {
            $responses = $fallback_responses['default'];
        }

        return [
            'response' => $responses[array_rand($responses)],
            'fallback' => true,
        ];
    }

    /**
     * Log message locally
     */
    private function log_message($bot_id, $message, $sender, $metadata = []) {
        global $wpdb;

        $session_id = $this->get_session_id();

        $wpdb->insert(
            $wpdb->prefix . 'synofex_conversations',
            [
                'session_id' => $session_id,
                'message' => $message,
                'sender' => $sender,
                'metadata' => json_encode(array_merge($metadata, ['bot_id' => $bot_id])),
            ]
        );
    }

    /**
     * Get session ID
     */
    private function get_session_id() {
        // Try to start session only if headers not sent
        if (!session_id() && !headers_sent()) {
            session_start();
        }

        // If session is available, use it
        if (session_id() && isset($_SESSION['synofex_session_id'])) {
            return $_SESSION['synofex_session_id'];
        }

        // Fallback to cookie-based session if session unavailable
        if (isset($_COOKIE['synofex_session'])) {
            return sanitize_text_field($_COOKIE['synofex_session']);
        }

        // Generate new session ID
        $sessionId = wp_generate_uuid4();

        // Store in session if available
        if (session_id()) {
            $_SESSION['synofex_session_id'] = $sessionId;
        }

        // Always set cookie as fallback (won't error if headers sent)
        if (!headers_sent()) {
            setcookie('synofex_session', $sessionId, time() + (86400 * 30), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
        }

        return $sessionId;
    }

    /**
     * Log error
     */
    private function log_error($message, $context = []) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Synofex Chatbot: ' . $message . ' ' . json_encode($context));
        }
    }
}