<?php
/**
 * Admin functionality for Synofex Chatbot
 *
 * @package SynofexChatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin class for Synofex Chatbot
 */
class Synofex_Admin {

    /**
     * Render settings page
     */
    public function render_settings_page() {
        $auth_token = get_option('synofex_auth_token', '');
        $token_valid = get_option('synofex_token_valid', false);
        $token_expired = get_option('synofex_token_expired', false);
        $token_expires_at = get_option('synofex_token_expires_at', '');
        $api_url = get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app');
        $widget_enabled = get_option('synofex_widget_enabled', true);
        $widget_position = get_option('synofex_widget_position', 'bottom-right');
        $widget_theme = get_option('synofex_widget_theme', 'light');
        $bot_config = get_option('synofex_bot_config', []);

        // Handle form submission
        if (isset($_POST['synofex_save_settings'])) {
            check_admin_referer('synofex_settings_nonce');

            // Update settings
            update_option('synofex_auth_token', sanitize_text_field($_POST['synofex_auth_token']));
            update_option('synofex_api_url', esc_url_raw($_POST['synofex_api_url']));
            update_option('synofex_widget_enabled', isset($_POST['synofex_widget_enabled']) ? 1 : 0);
            update_option('synofex_widget_position', sanitize_text_field($_POST['synofex_widget_position']));
            update_option('synofex_widget_theme', sanitize_text_field($_POST['synofex_widget_theme']));

            // Validate token if provided
            if (!empty($_POST['synofex_auth_token'])) {
                $api_client = new Synofex_API_Client($_POST['synofex_auth_token']);
                $validation = $api_client->validate_token(get_site_url());

                if ($validation && isset($validation['valid']) && $validation['valid']) {
                    update_option('synofex_token_valid', true);
                    update_option('synofex_token_expired', false);
                    update_option('synofex_bot_config', $validation['config']);
                    echo '<div class="notice notice-success is-dismissible"><p><strong>' . __('Success!', 'synofex-chatbot') . '</strong> ' . __('Settings saved and token validated successfully.', 'synofex-chatbot') . '</p></div>';
                } elseif ($validation && isset($validation['expired']) && $validation['expired']) {
                    update_option('synofex_token_valid', false);
                    update_option('synofex_token_expired', true);
                    update_option('synofex_token_expires_at', isset($validation['expiredAt']) ? $validation['expiredAt'] : '');
                    echo '<div class="notice notice-error is-dismissible"><p><strong>' . __('Token Expired!', 'synofex-chatbot') . '</strong> ' . __('Your authentication token has expired. Please generate a new token from your dashboard.', 'synofex-chatbot') . '</p></div>';
                } else {
                    update_option('synofex_token_valid', false);
                    update_option('synofex_token_expired', false);
                    $error_msg = isset($validation['error']) ? $validation['error'] : __('Token validation failed. Please check your token and domain binding.', 'synofex-chatbot');
                    echo '<div class="notice notice-error is-dismissible"><p><strong>' . __('Error!', 'synofex-chatbot') . '</strong> ' . esc_html($error_msg) . '</p></div>';
                }
            } else {
                echo '<div class="notice notice-success is-dismissible"><p>' . __('Settings saved successfully!', 'synofex-chatbot') . '</p></div>';
            }

            // Refresh values
            $auth_token = get_option('synofex_auth_token', '');
            $token_valid = get_option('synofex_token_valid', false);
            $token_expired = get_option('synofex_token_expired', false);
            $token_expires_at = get_option('synofex_token_expires_at', '');
            $api_url = get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app');
            $widget_enabled = get_option('synofex_widget_enabled', true);
            $widget_position = get_option('synofex_widget_position', 'bottom-right');
            $widget_theme = get_option('synofex_widget_theme', 'light');
            $bot_config = get_option('synofex_bot_config', []);
        }
        ?>
        <div class="wrap synofex-admin-wrap">
            <!-- Header -->
            <div class="synofex-admin-header">
                <div class="synofex-header-content">
                    <h1>
                        <span class="synofex-logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
                                <path d="M7 9H17V11H7V9ZM7 13H13V15H7V13Z" fill="#667eea"/>
                            </svg>
                        </span>
                        <?php echo esc_html(get_admin_page_title()); ?>
                    </h1>
                    <p class="synofex-header-subtitle"><?php _e('Configure your AI chatbot settings', 'synofex-chatbot'); ?></p>
                </div>
            </div>

            <!-- Status Card -->
            <div class="synofex-status-card">
                <?php if ($token_expired): ?>
                    <div class="synofex-status synofex-status-expired">
                        <span class="synofex-status-icon">⚠️</span>
                        <div class="synofex-status-text">
                            <strong><?php _e('Token Expired', 'synofex-chatbot'); ?></strong>
                            <p><?php _e('Your authentication token has expired. The chatbot is currently disabled. Please generate a new token from your dashboard.', 'synofex-chatbot'); ?></p>
                            <?php if ($token_expires_at): ?>
                                <small><?php printf(__('Expired on: %s', 'synofex-chatbot'), esc_html(date('F j, Y', strtotime($token_expires_at)))); ?></small>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php elseif ($token_valid): ?>
                    <div class="synofex-status synofex-status-active">
                        <span class="synofex-status-icon">✓</span>
                        <div class="synofex-status-text">
                            <strong><?php _e('Chatbot Active', 'synofex-chatbot'); ?></strong>
                            <p><?php _e('Your token is valid and the chatbot is ready to assist your visitors.', 'synofex-chatbot'); ?></p>
                            <?php if (!empty($bot_config['name'])): ?>
                                <small><?php printf(__('Connected Bot: %s', 'synofex-chatbot'), esc_html($bot_config['name'])); ?></small>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php elseif (!empty($auth_token)): ?>
                    <div class="synofex-status synofex-status-error">
                        <span class="synofex-status-icon">✕</span>
                        <div class="synofex-status-text">
                            <strong><?php _e('Connection Failed', 'synofex-chatbot'); ?></strong>
                            <p><?php _e('Token validation failed. Please check your token and ensure your domain is authorized.', 'synofex-chatbot'); ?></p>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="synofex-status synofex-status-setup">
                        <span class="synofex-status-icon">🚀</span>
                        <div class="synofex-status-text">
                            <strong><?php _e('Setup Required', 'synofex-chatbot'); ?></strong>
                            <p><?php _e('Enter your authentication token to connect your chatbot.', 'synofex-chatbot'); ?></p>
                        </div>
                    </div>
                <?php endif; ?>
            </div>

            <div class="synofex-settings-container">
                <form method="post" action="" class="synofex-settings-form">
                    <?php wp_nonce_field('synofex_settings_nonce'); ?>

                    <!-- Authentication Section -->
                    <div class="synofex-settings-section">
                        <h2>
                            <span class="section-icon">🔐</span>
                            <?php _e('Authentication', 'synofex-chatbot'); ?>
                        </h2>
                        <div class="synofex-field-group">
                            <label for="synofex_auth_token"><?php _e('Authentication Token', 'synofex-chatbot'); ?></label>
                            <div class="synofex-input-wrapper">
                                <input type="password" id="synofex_auth_token" name="synofex_auth_token"
                                       value="<?php echo esc_attr($auth_token); ?>" class="synofex-input large-text"
                                       placeholder="<?php esc_attr_e('Enter your token here...', 'synofex-chatbot'); ?>" />
                                <button type="button" class="synofex-toggle-visibility" onclick="toggleTokenVisibility()">
                                    <span class="dashicons dashicons-visibility"></span>
                                </button>
                            </div>
                            <p class="synofex-field-description">
                                <?php _e('Get your token from the Integrations section in your dashboard.', 'synofex-chatbot'); ?>
                            </p>
                        </div>

                        <div class="synofex-field-group">
                            <label for="synofex_api_url"><?php _e('API URL', 'synofex-chatbot'); ?></label>
                            <input type="url" id="synofex_api_url" name="synofex_api_url"
                                   value="<?php echo esc_url($api_url); ?>" class="synofex-input large-text"
                                   placeholder="https://your-api-url.com" />
                            <p class="synofex-field-description">
                                <?php _e('The API endpoint URL. Only change this if instructed.', 'synofex-chatbot'); ?>
                            </p>
                        </div>
                    </div>

                    <!-- Widget Settings Section -->
                    <div class="synofex-settings-section">
                        <h2>
                            <span class="section-icon">💬</span>
                            <?php _e('Widget Settings', 'synofex-chatbot'); ?>
                        </h2>

                        <div class="synofex-field-group">
                            <label class="synofex-toggle-label">
                                <span class="synofex-toggle">
                                    <input type="checkbox" id="synofex_widget_enabled" name="synofex_widget_enabled"
                                           value="1" <?php checked($widget_enabled, true); ?> />
                                    <span class="synofex-toggle-slider"></span>
                                </span>
                                <span class="synofex-toggle-text"><?php _e('Enable Chat Widget', 'synofex-chatbot'); ?></span>
                            </label>
                            <p class="synofex-field-description">
                                <?php _e('Show the chat widget on your website.', 'synofex-chatbot'); ?>
                            </p>
                        </div>

                        <div class="synofex-field-row">
                            <div class="synofex-field-group synofex-field-half">
                                <label for="synofex_widget_position"><?php _e('Position', 'synofex-chatbot'); ?></label>
                                <select id="synofex_widget_position" name="synofex_widget_position" class="synofex-select">
                                    <option value="bottom-right" <?php selected($widget_position, 'bottom-right'); ?>>
                                        <?php _e('Bottom Right', 'synofex-chatbot'); ?>
                                    </option>
                                    <option value="bottom-left" <?php selected($widget_position, 'bottom-left'); ?>>
                                        <?php _e('Bottom Left', 'synofex-chatbot'); ?>
                                    </option>
                                </select>
                            </div>

                            <div class="synofex-field-group synofex-field-half">
                                <label for="synofex_widget_theme"><?php _e('Theme', 'synofex-chatbot'); ?></label>
                                <select id="synofex_widget_theme" name="synofex_widget_theme" class="synofex-select">
                                    <option value="light" <?php selected($widget_theme, 'light'); ?>>
                                        <?php _e('Light', 'synofex-chatbot'); ?>
                                    </option>
                                    <option value="dark" <?php selected($widget_theme, 'dark'); ?>>
                                        <?php _e('Dark', 'synofex-chatbot'); ?>
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="synofex-submit-section">
                        <button type="submit" name="synofex_save_settings" class="synofex-btn synofex-btn-primary">
                            <span class="dashicons dashicons-saved"></span>
                            <?php _e('Save Settings', 'synofex-chatbot'); ?>
                        </button>
                    </div>
                </form>

                <!-- Shortcode Info -->
                <div class="synofex-settings-section synofex-info-section">
                    <h2>
                        <span class="section-icon">📋</span>
                        <?php _e('Shortcode Usage', 'synofex-chatbot'); ?>
                    </h2>
                    <p><?php _e('You can also display the chatbot using shortcodes:', 'synofex-chatbot'); ?></p>
                    <div class="synofex-code-block">
                        <code>[synofex_chatbot]</code>
                        <button type="button" class="synofex-copy-btn" onclick="copyShortcode('[synofex_chatbot]')">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                    <p class="synofex-field-description"><?php _e('With custom options:', 'synofex-chatbot'); ?></p>
                    <div class="synofex-code-block">
                        <code>[synofex_chatbot position="bottom-right" theme="light"]</code>
                        <button type="button" class="synofex-copy-btn" onclick="copyShortcode('[synofex_chatbot position=&quot;bottom-right&quot; theme=&quot;light&quot;]')">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .synofex-admin-wrap {
                margin-right: 20px;
            }
            .synofex-admin-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                margin: -10px -20px 30px -20px;
                border-radius: 0 0 8px 8px;
            }
            .synofex-header-content {
                max-width: 800px;
            }
            .synofex-admin-header h1 {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 600;
                color: white;
            }
            .synofex-logo {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                background: rgba(255,255,255,0.2);
                border-radius: 8px;
            }
            .synofex-header-subtitle {
                margin: 0;
                opacity: 0.9;
                font-size: 15px;
            }

            /* Status Card */
            .synofex-status-card {
                margin-bottom: 30px;
            }
            .synofex-status {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid;
            }
            .synofex-status-icon {
                font-size: 24px;
                line-height: 1;
            }
            .synofex-status-text strong {
                display: block;
                font-size: 16px;
                margin-bottom: 4px;
            }
            .synofex-status-text p {
                margin: 0 0 4px 0;
                color: #666;
            }
            .synofex-status-text small {
                color: #888;
                font-size: 12px;
            }
            .synofex-status-active {
                background: #d4edda;
                border-color: #28a745;
            }
            .synofex-status-active strong { color: #155724; }
            .synofex-status-error {
                background: #f8d7da;
                border-color: #dc3545;
            }
            .synofex-status-error strong { color: #721c24; }
            .synofex-status-expired {
                background: #fff3cd;
                border-color: #ffc107;
            }
            .synofex-status-expired strong { color: #856404; }
            .synofex-status-setup {
                background: #e7f3ff;
                border-color: #0073aa;
            }
            .synofex-status-setup strong { color: #004085; }

            /* Settings Container */
            .synofex-settings-container {
                max-width: 800px;
            }
            .synofex-settings-section {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 20px;
            }
            .synofex-settings-section h2 {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0 0 20px 0;
                padding-bottom: 12px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 18px;
                font-weight: 600;
            }
            .section-icon {
                font-size: 20px;
            }

            /* Field Groups */
            .synofex-field-group {
                margin-bottom: 20px;
            }
            .synofex-field-group:last-child {
                margin-bottom: 0;
            }
            .synofex-field-group > label {
                display: block;
                font-weight: 600;
                margin-bottom: 8px;
                color: #333;
            }
            .synofex-field-description {
                margin-top: 6px;
                color: #666;
                font-size: 13px;
            }
            .synofex-field-row {
                display: flex;
                gap: 20px;
            }
            .synofex-field-half {
                flex: 1;
            }

            /* Inputs */
            .synofex-input,
            .synofex-select {
                width: 100%;
                padding: 10px 14px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .synofex-input:focus,
            .synofex-select:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                outline: none;
            }
            .synofex-input-wrapper {
                position: relative;
            }
            .synofex-toggle-visibility {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                padding: 4px;
            }
            .synofex-toggle-visibility:hover {
                color: #333;
            }

            /* Toggle Switch */
            .synofex-toggle-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
            }
            .synofex-toggle {
                position: relative;
                width: 48px;
                height: 26px;
            }
            .synofex-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .synofex-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: 0.3s;
                border-radius: 26px;
            }
            .synofex-toggle-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
            }
            .synofex-toggle input:checked + .synofex-toggle-slider {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .synofex-toggle input:checked + .synofex-toggle-slider:before {
                transform: translateX(22px);
            }
            .synofex-toggle-text {
                font-weight: 600;
                color: #333;
            }

            /* Buttons */
            .synofex-submit-section {
                padding-top: 10px;
            }
            .synofex-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .synofex-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .synofex-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .synofex-btn .dashicons {
                font-size: 18px;
                width: 18px;
                height: 18px;
            }

            /* Code Block */
            .synofex-code-block {
                display: flex;
                align-items: center;
                gap: 10px;
                background: #f5f5f5;
                padding: 12px 16px;
                border-radius: 6px;
                margin-bottom: 12px;
            }
            .synofex-code-block code {
                flex: 1;
                background: none;
                padding: 0;
                font-family: 'Courier New', monospace;
                font-size: 13px;
            }
            .synofex-copy-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                padding: 4px;
            }
            .synofex-copy-btn:hover {
                color: #667eea;
            }

            .synofex-info-section {
                background: #f8f9fa;
            }

            @media (max-width: 782px) {
                .synofex-field-row {
                    flex-direction: column;
                    gap: 0;
                }
                .synofex-admin-header {
                    margin: -10px -10px 20px -10px;
                    padding: 20px;
                }
            }
        </style>

        <script>
            function toggleTokenVisibility() {
                var input = document.getElementById('synofex_auth_token');
                var icon = document.querySelector('.synofex-toggle-visibility .dashicons');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('dashicons-visibility');
                    icon.classList.add('dashicons-hidden');
                } else {
                    input.type = 'password';
                    icon.classList.remove('dashicons-hidden');
                    icon.classList.add('dashicons-visibility');
                }
            }

            function copyShortcode(text) {
                navigator.clipboard.writeText(text).then(function() {
                    alert('Shortcode copied to clipboard!');
                });
            }
        </script>
        <?php
    }

    /**
     * Render analytics page
     */
    public function render_analytics_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Chatbot Analytics', 'synofex-chatbot'); ?></h1>

            <div class="notice notice-info">
                <p><?php _e('Analytics data will be available here once your chatbot starts receiving messages.', 'synofex-chatbot'); ?></p>
            </div>

            <div class="synofex-analytics-container">
                <div class="card">
                    <h3><?php _e('Total Conversations', 'synofex-chatbot'); ?></h3>
                    <p class="stat-number">0</p>
                </div>

                <div class="card">
                    <h3><?php _e('Messages Today', 'synofex-chatbot'); ?></h3>
                    <p class="stat-number">0</p>
                </div>

                <div class="card">
                    <h3><?php _e('Active Sessions', 'synofex-chatbot'); ?></h3>
                    <p class="stat-number">0</p>
                </div>

                <div class="card">
                    <h3><?php _e('Average Response Time', 'synofex-chatbot'); ?></h3>
                    <p class="stat-number">N/A</p>
                </div>
            </div>
        </div>
        <?php
    }
}