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
        $widget_enabled = get_option('synofex_widget_enabled', true);
        $widget_position = get_option('synofex_widget_position', 'bottom-right');
        $widget_theme = get_option('synofex_widget_theme', 'light');
        $widget_icon_type = get_option('synofex_widget_icon_type', 'default'); // default, emoji, svg
        $widget_icon_emoji = get_option('synofex_widget_icon_emoji', '💬');
        $widget_icon_svg = get_option('synofex_widget_icon_svg', '');
        $bot_config = get_option('synofex_bot_config', []);

        // Website URL is auto-detected from WordPress
        $website_url = get_site_url();

        // Handle form submission
        if (isset($_POST['synofex_save_settings'])) {
            check_admin_referer('synofex_settings_nonce');

            // Update settings
            update_option('synofex_auth_token', sanitize_text_field($_POST['synofex_auth_token']));
            update_option('synofex_widget_enabled', isset($_POST['synofex_widget_enabled']) ? 1 : 0);
            update_option('synofex_widget_position', sanitize_text_field($_POST['synofex_widget_position']));
            update_option('synofex_widget_theme', sanitize_text_field($_POST['synofex_widget_theme']));
            update_option('synofex_widget_icon_type', sanitize_text_field($_POST['synofex_widget_icon_type']));
            update_option('synofex_widget_icon_emoji', sanitize_text_field($_POST['synofex_widget_icon_emoji']));

            // Handle SVG upload
            if (!empty($_FILES['synofex_widget_icon_svg']['tmp_name'])) {
                $uploaded_file = $_FILES['synofex_widget_icon_svg'];
                $file_type = wp_check_filetype($uploaded_file['name']);

                if ($file_type['ext'] === 'svg') {
                    $svg_content = file_get_contents($uploaded_file['tmp_name']);
                    // Basic sanitization - remove script tags
                    $svg_content = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $svg_content);
                    update_option('synofex_widget_icon_svg', $svg_content);
                }
            }

            // Validate token if provided (website URL auto-detected)
            if (!empty($_POST['synofex_auth_token'])) {
                $api_client = new Synofex_API_Client($_POST['synofex_auth_token']);
                $validation = $api_client->validate_token($website_url);

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
            $widget_enabled = get_option('synofex_widget_enabled', true);
            $widget_position = get_option('synofex_widget_position', 'bottom-right');
            $widget_theme = get_option('synofex_widget_theme', 'light');
            $widget_icon_type = get_option('synofex_widget_icon_type', 'default');
            $widget_icon_emoji = get_option('synofex_widget_icon_emoji', '💬');
            $widget_icon_svg = get_option('synofex_widget_icon_svg', '');
            $bot_config = get_option('synofex_bot_config', []);
        }

        // Available emojis for widget icon
        $available_emojis = ['💬', '🤖', '💭', '🗨️', '📱', '🎯', '⚡', '🌟', '👋', '❓', '💡', '🔮'];
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
                <form method="post" action="" class="synofex-settings-form" enctype="multipart/form-data">
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
                            <label><?php _e('Website URL', 'synofex-chatbot'); ?></label>
                            <div class="synofex-readonly-field">
                                <span class="dashicons dashicons-admin-site-alt3"></span>
                                <span><?php echo esc_html($website_url); ?></span>
                            </div>
                            <p class="synofex-field-description">
                                <?php _e('Your website URL is automatically detected. Make sure this matches the domain bound to your token.', 'synofex-chatbot'); ?>
                            </p>
                        </div>
                    </div>

                    <!-- Widget Settings Section -->
                    <div class="synofex-settings-section">
                        <h2>
                            <span class="section-icon">💬</span>
                            <?php _e('Chat Widget Settings', 'synofex-chatbot'); ?>
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
                                <?php _e('Show or hide the chat widget on your website.', 'synofex-chatbot'); ?>
                            </p>
                        </div>

                        <!-- Widget Icon Section -->
                        <div class="synofex-field-group">
                            <label><?php _e('Widget Icon', 'synofex-chatbot'); ?></label>
                            <div class="synofex-icon-options">
                                <label class="synofex-icon-option <?php echo $widget_icon_type === 'default' ? 'selected' : ''; ?>">
                                    <input type="radio" name="synofex_widget_icon_type" value="default"
                                           <?php checked($widget_icon_type, 'default'); ?> />
                                    <div class="synofex-icon-preview">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <span><?php _e('Default', 'synofex-chatbot'); ?></span>
                                </label>

                                <label class="synofex-icon-option <?php echo $widget_icon_type === 'emoji' ? 'selected' : ''; ?>">
                                    <input type="radio" name="synofex_widget_icon_type" value="emoji"
                                           <?php checked($widget_icon_type, 'emoji'); ?> />
                                    <div class="synofex-icon-preview emoji-preview">
                                        <?php echo esc_html($widget_icon_emoji); ?>
                                    </div>
                                    <span><?php _e('Emoji', 'synofex-chatbot'); ?></span>
                                </label>

                                <label class="synofex-icon-option <?php echo $widget_icon_type === 'svg' ? 'selected' : ''; ?>">
                                    <input type="radio" name="synofex_widget_icon_type" value="svg"
                                           <?php checked($widget_icon_type, 'svg'); ?> />
                                    <div class="synofex-icon-preview svg-preview">
                                        <?php if (!empty($widget_icon_svg)): ?>
                                            <?php echo $widget_icon_svg; ?>
                                        <?php else: ?>
                                            <span class="dashicons dashicons-upload"></span>
                                        <?php endif; ?>
                                    </div>
                                    <span><?php _e('Custom SVG', 'synofex-chatbot'); ?></span>
                                </label>
                            </div>
                        </div>

                        <!-- Emoji Selector (shown when emoji is selected) -->
                        <div class="synofex-field-group synofex-emoji-selector" id="emoji-selector" style="<?php echo $widget_icon_type !== 'emoji' ? 'display:none;' : ''; ?>">
                            <label><?php _e('Select Emoji', 'synofex-chatbot'); ?></label>
                            <div class="synofex-emoji-grid">
                                <?php foreach ($available_emojis as $emoji): ?>
                                    <label class="synofex-emoji-item <?php echo $widget_icon_emoji === $emoji ? 'selected' : ''; ?>">
                                        <input type="radio" name="synofex_widget_icon_emoji" value="<?php echo esc_attr($emoji); ?>"
                                               <?php checked($widget_icon_emoji, $emoji); ?> />
                                        <span class="synofex-emoji"><?php echo esc_html($emoji); ?></span>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <!-- SVG Upload (shown when svg is selected) -->
                        <div class="synofex-field-group synofex-svg-upload" id="svg-upload" style="<?php echo $widget_icon_type !== 'svg' ? 'display:none;' : ''; ?>">
                            <label for="synofex_widget_icon_svg"><?php _e('Upload SVG File', 'synofex-chatbot'); ?></label>
                            <input type="file" id="synofex_widget_icon_svg" name="synofex_widget_icon_svg" accept=".svg" class="synofex-file-input" />
                            <p class="synofex-field-description">
                                <?php _e('Upload a custom SVG icon for your chat widget. Recommended size: 24x24px.', 'synofex-chatbot'); ?>
                            </p>
                            <?php if (!empty($widget_icon_svg)): ?>
                                <div class="synofex-current-svg">
                                    <span><?php _e('Current SVG:', 'synofex-chatbot'); ?></span>
                                    <div class="synofex-svg-preview-large"><?php echo $widget_icon_svg; ?></div>
                                </div>
                            <?php endif; ?>
                        </div>

                        <div class="synofex-field-row">
                            <div class="synofex-field-group synofex-field-half">
                                <label for="synofex_widget_position"><?php _e('Widget Position', 'synofex-chatbot'); ?></label>
                                <div class="synofex-position-options">
                                    <label class="synofex-position-option <?php echo $widget_position === 'bottom-left' ? 'selected' : ''; ?>">
                                        <input type="radio" name="synofex_widget_position" value="bottom-left"
                                               <?php checked($widget_position, 'bottom-left'); ?> />
                                        <div class="synofex-position-preview">
                                            <div class="synofex-position-dot left"></div>
                                        </div>
                                        <span><?php _e('Left', 'synofex-chatbot'); ?></span>
                                    </label>
                                    <label class="synofex-position-option <?php echo $widget_position === 'bottom-right' ? 'selected' : ''; ?>">
                                        <input type="radio" name="synofex_widget_position" value="bottom-right"
                                               <?php checked($widget_position, 'bottom-right'); ?> />
                                        <div class="synofex-position-preview">
                                            <div class="synofex-position-dot right"></div>
                                        </div>
                                        <span><?php _e('Right', 'synofex-chatbot'); ?></span>
                                    </label>
                                </div>
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
                overflow: visible;
                position: relative;
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
            .synofex-field-group > .synofex-toggle-label {
                display: inline-flex;
                width: auto;
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
                display: inline-flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                min-width: 260px;
                overflow: visible;
            }
            .synofex-toggle {
                position: relative;
                width: 52px;
                min-width: 52px;
                height: 28px;
                flex-shrink: 0;
            }
            .synofex-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
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
                border-radius: 28px;
            }
            .synofex-toggle-slider:before {
                position: absolute;
                content: "";
                height: 22px;
                width: 22px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .synofex-toggle input:checked + .synofex-toggle-slider {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .synofex-toggle input:checked + .synofex-toggle-slider:before {
                transform: translateX(24px);
            }
            .synofex-toggle-text {
                font-weight: 600;
                color: #333;
                white-space: nowrap;
                flex-shrink: 0;
                overflow: visible;
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

            /* Readonly Field */
            .synofex-readonly-field {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 14px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 6px;
                color: #666;
            }
            .synofex-readonly-field .dashicons {
                color: #667eea;
            }

            /* Icon Options */
            .synofex-icon-options {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            .synofex-icon-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 16px 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 90px;
            }
            .synofex-icon-option:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }
            .synofex-icon-option.selected {
                border-color: #667eea;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            }
            .synofex-icon-option input[type="radio"] {
                display: none;
            }
            .synofex-icon-preview {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #667eea;
                border-radius: 50%;
                color: white;
            }
            .synofex-icon-preview.emoji-preview {
                font-size: 20px;
            }
            .synofex-icon-preview.svg-preview {
                background: #f3f4f6;
                color: #667eea;
            }
            .synofex-icon-preview svg {
                width: 24px;
                height: 24px;
            }
            .synofex-icon-option span:last-child {
                font-size: 12px;
                font-weight: 500;
                color: #666;
            }

            /* Emoji Grid */
            .synofex-emoji-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 8px;
                margin-top: 12px;
            }
            .synofex-emoji-item {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .synofex-emoji-item:hover {
                border-color: #667eea;
                transform: scale(1.1);
            }
            .synofex-emoji-item.selected {
                border-color: #667eea;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            }
            .synofex-emoji-item input[type="radio"] {
                display: none;
            }
            .synofex-emoji {
                font-size: 24px;
            }

            /* SVG Upload */
            .synofex-file-input {
                width: 100%;
                padding: 10px 14px;
                border: 2px dashed #ddd;
                border-radius: 6px;
                cursor: pointer;
            }
            .synofex-file-input:hover {
                border-color: #667eea;
            }
            .synofex-current-svg {
                margin-top: 12px;
                padding: 12px;
                background: #f5f5f5;
                border-radius: 6px;
            }
            .synofex-svg-preview-large {
                width: 48px;
                height: 48px;
                margin-top: 8px;
                background: #667eea;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .synofex-svg-preview-large svg {
                width: 24px;
                height: 24px;
            }

            /* Position Options */
            .synofex-position-options {
                display: flex;
                gap: 12px;
            }
            .synofex-position-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .synofex-position-option:hover {
                border-color: #667eea;
            }
            .synofex-position-option.selected {
                border-color: #667eea;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            }
            .synofex-position-option input[type="radio"] {
                display: none;
            }
            .synofex-position-preview {
                width: 60px;
                height: 40px;
                background: #f3f4f6;
                border: 1px solid #ddd;
                border-radius: 4px;
                position: relative;
            }
            .synofex-position-dot {
                width: 12px;
                height: 12px;
                background: #667eea;
                border-radius: 50%;
                position: absolute;
                bottom: 4px;
            }
            .synofex-position-dot.left {
                left: 4px;
            }
            .synofex-position-dot.right {
                right: 4px;
            }
            .synofex-position-option span:last-child {
                font-size: 12px;
                font-weight: 500;
                color: #666;
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

            // Icon type selection
            document.addEventListener('DOMContentLoaded', function() {
                var iconOptions = document.querySelectorAll('.synofex-icon-option input[type="radio"]');
                iconOptions.forEach(function(radio) {
                    radio.addEventListener('change', function() {
                        // Update selected state
                        document.querySelectorAll('.synofex-icon-option').forEach(function(opt) {
                            opt.classList.remove('selected');
                        });
                        this.closest('.synofex-icon-option').classList.add('selected');

                        // Show/hide emoji selector and SVG upload
                        var emojiSelector = document.getElementById('emoji-selector');
                        var svgUpload = document.getElementById('svg-upload');

                        if (this.value === 'emoji') {
                            emojiSelector.style.display = 'block';
                            svgUpload.style.display = 'none';
                        } else if (this.value === 'svg') {
                            emojiSelector.style.display = 'none';
                            svgUpload.style.display = 'block';
                        } else {
                            emojiSelector.style.display = 'none';
                            svgUpload.style.display = 'none';
                        }
                    });
                });

                // Emoji selection
                var emojiItems = document.querySelectorAll('.synofex-emoji-item input[type="radio"]');
                emojiItems.forEach(function(radio) {
                    radio.addEventListener('change', function() {
                        document.querySelectorAll('.synofex-emoji-item').forEach(function(item) {
                            item.classList.remove('selected');
                        });
                        this.closest('.synofex-emoji-item').classList.add('selected');

                        // Update the emoji preview in the icon option
                        var emojiPreview = document.querySelector('.synofex-icon-option .emoji-preview');
                        if (emojiPreview) {
                            emojiPreview.textContent = this.value;
                        }
                    });
                });

                // Position selection
                var positionOptions = document.querySelectorAll('.synofex-position-option input[type="radio"]');
                positionOptions.forEach(function(radio) {
                    radio.addEventListener('change', function() {
                        document.querySelectorAll('.synofex-position-option').forEach(function(opt) {
                            opt.classList.remove('selected');
                        });
                        this.closest('.synofex-position-option').classList.add('selected');
                    });
                });
            });
        </script>
        <?php
    }

    /**
     * Render analytics page
     */
    public function render_analytics_page() {
        $auth_token = get_option('synofex_auth_token', '');
        $token_valid = get_option('synofex_token_valid', false);
        $bot_config = get_option('synofex_bot_config', []);

        // Default analytics data
        $analytics = [
            'totalConversations' => 0,
            'messagesToday' => 0,
            'activeSessions' => 0,
            'avgResponseTime' => 'N/A',
            'totalMessages' => 0,
            'humanHandoffs' => 0
        ];

        // Fetch analytics from API if token is valid
        if ($token_valid && !empty($auth_token)) {
            $api_client = new Synofex_API_Client($auth_token);
            $api_analytics = $api_client->get_analytics();

            if ($api_analytics && !isset($api_analytics['error'])) {
                $analytics = array_merge($analytics, $api_analytics);
            }
        }
        ?>
        <div class="wrap synofex-analytics-wrap">
            <!-- Header -->
            <div class="synofex-analytics-header">
                <div class="synofex-header-content">
                    <h1>
                        <span class="synofex-logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M7 14L11 10L15 14L21 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <?php _e('Bot Analytics', 'synofex-chatbot'); ?>
                    </h1>
                    <?php if (!empty($bot_config['name'])): ?>
                        <p class="synofex-header-subtitle"><?php printf(__('Analytics for %s', 'synofex-chatbot'), esc_html($bot_config['name'])); ?></p>
                    <?php else: ?>
                        <p class="synofex-header-subtitle"><?php _e('View your chatbot performance metrics', 'synofex-chatbot'); ?></p>
                    <?php endif; ?>
                </div>
                <?php if ($token_valid): ?>
                    <button type="button" class="synofex-refresh-btn" onclick="location.reload();">
                        <span class="dashicons dashicons-update"></span>
                        <?php _e('Refresh', 'synofex-chatbot'); ?>
                    </button>
                <?php endif; ?>
            </div>

            <?php if (!$token_valid): ?>
                <div class="synofex-notice synofex-notice-warning">
                    <span class="dashicons dashicons-warning"></span>
                    <div>
                        <strong><?php _e('Token Not Configured', 'synofex-chatbot'); ?></strong>
                        <p><?php _e('Please configure your authentication token in Settings to view analytics.', 'synofex-chatbot'); ?></p>
                        <a href="<?php echo admin_url('admin.php?page=synofex-chatbot'); ?>" class="synofex-link"><?php _e('Go to Settings', 'synofex-chatbot'); ?> →</a>
                    </div>
                </div>
            <?php else: ?>
                <!-- Stats Grid -->
                <div class="synofex-stats-grid">
                    <div class="synofex-stat-card">
                        <div class="synofex-stat-icon conversations">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="synofex-stat-content">
                            <span class="synofex-stat-number"><?php echo number_format($analytics['totalConversations']); ?></span>
                            <span class="synofex-stat-label"><?php _e('Total Conversations', 'synofex-chatbot'); ?></span>
                        </div>
                    </div>

                    <div class="synofex-stat-card">
                        <div class="synofex-stat-icon messages">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="synofex-stat-content">
                            <span class="synofex-stat-number"><?php echo number_format($analytics['messagesToday']); ?></span>
                            <span class="synofex-stat-label"><?php _e('Messages Today', 'synofex-chatbot'); ?></span>
                        </div>
                    </div>

                    <div class="synofex-stat-card">
                        <div class="synofex-stat-icon sessions">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="synofex-stat-content">
                            <span class="synofex-stat-number"><?php echo number_format($analytics['activeSessions']); ?></span>
                            <span class="synofex-stat-label"><?php _e('Active Sessions', 'synofex-chatbot'); ?></span>
                        </div>
                    </div>

                    <div class="synofex-stat-card">
                        <div class="synofex-stat-icon response">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="synofex-stat-content">
                            <span class="synofex-stat-number"><?php echo esc_html($analytics['avgResponseTime']); ?></span>
                            <span class="synofex-stat-label"><?php _e('Avg Response Time', 'synofex-chatbot'); ?></span>
                        </div>
                    </div>

                    <div class="synofex-stat-card">
                        <div class="synofex-stat-icon total-messages">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="synofex-stat-content">
                            <span class="synofex-stat-number"><?php echo number_format($analytics['totalMessages']); ?></span>
                            <span class="synofex-stat-label"><?php _e('Total Messages', 'synofex-chatbot'); ?></span>
                        </div>
                    </div>

                    <div class="synofex-stat-card">
                        <div class="synofex-stat-icon handoffs">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="17 11 19 13 23 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="synofex-stat-content">
                            <span class="synofex-stat-number"><?php echo number_format($analytics['humanHandoffs']); ?></span>
                            <span class="synofex-stat-label"><?php _e('Human Handoffs', 'synofex-chatbot'); ?></span>
                        </div>
                    </div>
                </div>

                <!-- Info Card -->
                <div class="synofex-info-card">
                    <div class="synofex-info-icon">
                        <span class="dashicons dashicons-info"></span>
                    </div>
                    <div class="synofex-info-content">
                        <strong><?php _e('Analytics Tip', 'synofex-chatbot'); ?></strong>
                        <p><?php _e('Analytics are updated in real-time. For more detailed analytics including conversation history and user insights, visit your dashboard.', 'synofex-chatbot'); ?></p>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <style>
            .synofex-analytics-wrap {
                margin-right: 20px;
            }
            .synofex-analytics-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                margin: -10px -20px 30px -20px;
                border-radius: 0 0 8px 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .synofex-analytics-header h1 {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 600;
                color: white;
            }
            .synofex-analytics-header .synofex-logo {
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
            .synofex-refresh-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 20px;
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 6px;
                color: white;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .synofex-refresh-btn:hover {
                background: rgba(255,255,255,0.3);
            }

            .synofex-notice {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .synofex-notice-warning {
                background: #fff3cd;
                border: 1px solid #ffc107;
            }
            .synofex-notice .dashicons {
                font-size: 24px;
                color: #856404;
            }
            .synofex-notice strong {
                display: block;
                margin-bottom: 4px;
                color: #856404;
            }
            .synofex-notice p {
                margin: 0 0 8px 0;
                color: #856404;
            }
            .synofex-link {
                color: #667eea;
                text-decoration: none;
                font-weight: 500;
            }
            .synofex-link:hover {
                text-decoration: underline;
            }

            .synofex-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .synofex-stat-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
                display: flex;
                align-items: center;
                gap: 20px;
                transition: all 0.2s;
            }
            .synofex-stat-card:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }
            .synofex-stat-icon {
                width: 56px;
                height: 56px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .synofex-stat-icon.conversations { background: #dbeafe; color: #2563eb; }
            .synofex-stat-icon.messages { background: #dcfce7; color: #16a34a; }
            .synofex-stat-icon.sessions { background: #fef3c7; color: #d97706; }
            .synofex-stat-icon.response { background: #f3e8ff; color: #9333ea; }
            .synofex-stat-icon.total-messages { background: #fee2e2; color: #dc2626; }
            .synofex-stat-icon.handoffs { background: #e0e7ff; color: #4f46e5; }
            .synofex-stat-content {
                display: flex;
                flex-direction: column;
            }
            .synofex-stat-number {
                font-size: 28px;
                font-weight: 700;
                color: #111827;
            }
            .synofex-stat-label {
                font-size: 14px;
                color: #6b7280;
                margin-top: 4px;
            }

            .synofex-info-card {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 8px;
                padding: 16px 20px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            .synofex-info-icon {
                color: #0284c7;
            }
            .synofex-info-content strong {
                display: block;
                color: #0369a1;
                margin-bottom: 4px;
            }
            .synofex-info-content p {
                margin: 0;
                color: #0c4a6e;
                font-size: 14px;
            }

            @media (max-width: 782px) {
                .synofex-analytics-header {
                    flex-direction: column;
                    gap: 16px;
                    margin: -10px -10px 20px -10px;
                    padding: 20px;
                }
                .synofex-stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        <?php
    }
}