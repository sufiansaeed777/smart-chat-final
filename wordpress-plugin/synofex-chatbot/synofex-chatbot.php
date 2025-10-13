<?php
/**
 * Plugin Name: Synofex AI Chatbot
 * Plugin URI: https://synofex.com/
 * Description: AI-powered chatbot for WordPress with advanced features including document training, multi-language support, and human handoff.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * Author: Synofex (SMC-Private) Limited
 * Author URI: https://synofex.com/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: synofex-chatbot
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SYNOFEX_CHATBOT_VERSION', '1.0.0');
define('SYNOFEX_CHATBOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SYNOFEX_CHATBOT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SYNOFEX_CHATBOT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// API Configuration
define('SYNOFEX_API_BASE_URL', get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app'));
define('SYNOFEX_API_VERSION', 'v1');

/**
 * Main plugin class
 */
class SynofexChatbot {

    /**
     * Plugin instance
     */
    private static $instance = null;

    /**
     * Auth token
     */
    private $auth_token;

    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_dependencies();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);

        // Action hooks
        add_action('init', [$this, 'init']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_public_scripts']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('wp_footer', [$this, 'render_chat_widget']);

        // AJAX handlers
        add_action('wp_ajax_synofex_validate_token', [$this, 'ajax_validate_token']);
        add_action('wp_ajax_nopriv_synofex_send_message', [$this, 'ajax_send_message']);
        add_action('wp_ajax_synofex_send_message', [$this, 'ajax_send_message']);

        // REST API endpoints
        add_action('rest_api_init', [$this, 'register_rest_routes']);

        // Heartbeat for connection status
        add_action('wp_ajax_synofex_heartbeat', [$this, 'ajax_heartbeat']);

        // Widget shortcode
        add_shortcode('synofex_chatbot', [$this, 'render_shortcode']);
    }

    /**
     * Load dependencies
     */
    private function load_dependencies() {
        require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-cache.php';
        require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-api-client.php';
        require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-ajax-handler.php';
        require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-widget.php';
        require_once SYNOFEX_CHATBOT_PLUGIN_DIR . 'includes/class-admin.php';
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables if needed
        $this->create_tables();

        // Set default options
        $this->set_default_options();

        // Clear cache
        wp_cache_flush();

        // Schedule cron jobs
        $this->schedule_cron_jobs();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('synofex_daily_sync');
        wp_clear_scheduled_hook('synofex_hourly_heartbeat');

        // Clear cache
        wp_cache_flush();
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Load plugin textdomain
        load_plugin_textdomain('synofex-chatbot', false, dirname(SYNOFEX_CHATBOT_PLUGIN_BASENAME) . '/languages');

        // Get auth token
        $this->auth_token = get_option('synofex_auth_token');

        // Validate token and domain binding
        if ($this->auth_token) {
            $this->validate_token_and_domain();
        }
    }

    /**
     * Validate token and domain binding
     */
    private function validate_token_and_domain() {
        $api_client = new Synofex_API_Client($this->auth_token);
        $validation = $api_client->validate_token(get_site_url());

        if ($validation && isset($validation['valid']) && $validation['valid']) {
            update_option('synofex_token_valid', true);
            update_option('synofex_bot_config', $validation['config']);
        } else {
            update_option('synofex_token_valid', false);
        }
    }

    /**
     * Enqueue public scripts
     */
    public function enqueue_public_scripts() {
        if (!$this->should_load_widget()) {
            return;
        }

        // Chat widget styles
        wp_enqueue_style(
            'synofex-chatbot',
            SYNOFEX_CHATBOT_PLUGIN_URL . 'public/css/chat-widget.css',
            [],
            SYNOFEX_CHATBOT_VERSION
        );

        // Chat widget script
        wp_enqueue_script(
            'synofex-chatbot',
            SYNOFEX_CHATBOT_PLUGIN_URL . 'public/js/chat-widget.js',
            ['jquery'],
            SYNOFEX_CHATBOT_VERSION,
            true
        );

        // Localize script with configuration
        wp_localize_script('synofex-chatbot', 'synofex_config', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'api_url' => SYNOFEX_API_BASE_URL,
            'nonce' => wp_create_nonce('synofex_nonce'),
            'token' => $this->auth_token,
            'bot_config' => get_option('synofex_bot_config', []),
            'strings' => [
                'typing' => __('Typing...', 'synofex-chatbot'),
                'send' => __('Send', 'synofex-chatbot'),
                'placeholder' => __('Type your message...', 'synofex-chatbot'),
                'error' => __('Something went wrong. Please try again.', 'synofex-chatbot'),
                'offline' => __('Connection lost. Please check your internet.', 'synofex-chatbot'),
            ]
        ]);
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ('toplevel_page_synofex-chatbot' !== $hook) {
            return;
        }

        wp_enqueue_style(
            'synofex-admin',
            SYNOFEX_CHATBOT_PLUGIN_URL . 'admin/css/admin.css',
            [],
            SYNOFEX_CHATBOT_VERSION
        );

        wp_enqueue_script(
            'synofex-admin',
            SYNOFEX_CHATBOT_PLUGIN_URL . 'admin/js/admin.js',
            ['jquery'],
            SYNOFEX_CHATBOT_VERSION,
            true
        );

        wp_localize_script('synofex-admin', 'synofex_admin', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('synofex_admin_nonce'),
            'strings' => [
                'validating' => __('Validating token...', 'synofex-chatbot'),
                'success' => __('Token validated successfully!', 'synofex-chatbot'),
                'error' => __('Invalid token or domain mismatch.', 'synofex-chatbot'),
            ]
        ]);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Synofex Chatbot', 'synofex-chatbot'),
            __('Synofex Chatbot', 'synofex-chatbot'),
            'manage_options',
            'synofex-chatbot',
            [$this, 'admin_page'],
            'dashicons-format-chat',
            30
        );

        add_submenu_page(
            'synofex-chatbot',
            __('Settings', 'synofex-chatbot'),
            __('Settings', 'synofex-chatbot'),
            'manage_options',
            'synofex-chatbot',
            [$this, 'admin_page']
        );

        add_submenu_page(
            'synofex-chatbot',
            __('Analytics', 'synofex-chatbot'),
            __('Analytics', 'synofex-chatbot'),
            'manage_options',
            'synofex-analytics',
            [$this, 'analytics_page']
        );
    }

    /**
     * Admin page
     */
    public function admin_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        $admin = new Synofex_Admin();
        $admin->render_settings_page();
    }

    /**
     * Analytics page
     */
    public function analytics_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        $admin = new Synofex_Admin();
        $admin->render_analytics_page();
    }

    /**
     * Render chat widget
     */
    public function render_chat_widget() {
        if (!$this->should_load_widget()) {
            return;
        }

        $widget = new Synofex_Widget();
        $widget->render();
    }

    /**
     * Check if widget should load
     */
    private function should_load_widget() {
        // Check if token is valid
        if (!get_option('synofex_token_valid', false)) {
            return false;
        }

        // Check if enabled
        if (!get_option('synofex_widget_enabled', true)) {
            return false;
        }

        // Check page restrictions
        $show_on_pages = get_option('synofex_show_on_pages', 'all');
        if ('specific' === $show_on_pages) {
            $allowed_pages = get_option('synofex_allowed_pages', []);
            if (!in_array(get_the_ID(), $allowed_pages)) {
                return false;
            }
        }

        return true;
    }

    /**
     * AJAX: Validate token
     */
    public function ajax_validate_token() {
        check_ajax_referer('synofex_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        $token = sanitize_text_field($_POST['token']);

        $api_client = new Synofex_API_Client($token);
        $result = $api_client->validate_token(get_site_url());

        if ($result && isset($result['valid']) && $result['valid']) {
            update_option('synofex_auth_token', $token);
            update_option('synofex_token_valid', true);
            update_option('synofex_bot_config', $result['config']);

            wp_send_json_success([
                'message' => 'Token validated successfully',
                'config' => $result['config']
            ]);
        } else {
            wp_send_json_error('Invalid token or domain mismatch');
        }
    }

    /**
     * AJAX: Send message
     */
    public function ajax_send_message() {
        check_ajax_referer('synofex_nonce', 'nonce');

        $message = sanitize_text_field($_POST['message']);
        $bot_id = sanitize_text_field($_POST['bot_id']);

        $api_client = new Synofex_API_Client($this->auth_token);
        $response = $api_client->send_message($bot_id, $message, [
            'user_ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'],
            'page_url' => sanitize_text_field($_POST['page_url']),
        ]);

        if ($response && isset($response['response'])) {
            wp_send_json_success($response);
        } else {
            wp_send_json_error('Failed to get response');
        }
    }

    /**
     * AJAX: Heartbeat
     */
    public function ajax_heartbeat() {
        check_ajax_referer('synofex_nonce', 'nonce');

        $api_client = new Synofex_API_Client($this->auth_token);
        $status = $api_client->heartbeat();

        wp_send_json_success(['status' => $status]);
    }

    /**
     * Register REST routes
     */
    public function register_rest_routes() {
        register_rest_route('synofex/v1', '/webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Handle webhook
     */
    public function handle_webhook($request) {
        $data = $request->get_json_params();

        // Verify webhook signature
        $signature = $request->get_header('X-Synofex-Signature');
        if (!$this->verify_webhook_signature($data, $signature)) {
            return new WP_Error('invalid_signature', 'Invalid webhook signature', ['status' => 401]);
        }

        // Process webhook based on event type
        $event_type = $data['type'] ?? '';

        switch ($event_type) {
            case 'config_updated':
                update_option('synofex_bot_config', $data['config']);
                break;
            case 'token_expired':
                update_option('synofex_token_valid', false);
                break;
            case 'quota_exceeded':
                update_option('synofex_quota_exceeded', true);
                break;
        }

        return ['success' => true];
    }

    /**
     * Verify webhook signature
     */
    private function verify_webhook_signature($data, $signature) {
        $expected = hash_hmac('sha256', json_encode($data), $this->auth_token);
        return hash_equals($expected, $signature);
    }

    /**
     * Render shortcode
     */
    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'position' => 'bottom-right',
            'theme' => 'light',
        ], $atts);

        ob_start();
        $widget = new Synofex_Widget();
        $widget->render($atts);
        return ob_get_clean();
    }

    /**
     * Create database tables
     */
    private function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}synofex_conversations (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(255) NOT NULL,
            message text NOT NULL,
            sender varchar(20) NOT NULL,
            metadata text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY session_id (session_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Set default options
     */
    private function set_default_options() {
        add_option('synofex_widget_enabled', true);
        add_option('synofex_show_on_pages', 'all');
        add_option('synofex_widget_position', 'bottom-right');
        add_option('synofex_widget_theme', 'light');
        add_option('synofex_cache_enabled', true);
        add_option('synofex_cache_duration', 3600);
    }

    /**
     * Schedule cron jobs
     */
    private function schedule_cron_jobs() {
        if (!wp_next_scheduled('synofex_daily_sync')) {
            wp_schedule_event(time(), 'daily', 'synofex_daily_sync');
        }

        if (!wp_next_scheduled('synofex_hourly_heartbeat')) {
            wp_schedule_event(time(), 'hourly', 'synofex_hourly_heartbeat');
        }
    }
}

// Initialize plugin
SynofexChatbot::get_instance();