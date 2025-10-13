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
        $api_url = get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app');
        $widget_enabled = get_option('synofex_widget_enabled', true);
        $widget_position = get_option('synofex_widget_position', 'bottom-right');
        $widget_theme = get_option('synofex_widget_theme', 'light');

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
                    update_option('synofex_bot_config', $validation['config']);
                    echo '<div class="notice notice-success"><p>' . __('Settings saved and token validated successfully!', 'synofex-chatbot') . '</p></div>';
                } else {
                    update_option('synofex_token_valid', false);
                    echo '<div class="notice notice-error"><p>' . __('Settings saved but token validation failed. Please check your token and domain binding.', 'synofex-chatbot') . '</p></div>';
                }
            } else {
                echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'synofex-chatbot') . '</p></div>';
            }

            // Refresh values
            $auth_token = get_option('synofex_auth_token', '');
            $token_valid = get_option('synofex_token_valid', false);
            $api_url = get_option('synofex_api_url', 'https://smart-chat-finale.vercel.app');
            $widget_enabled = get_option('synofex_widget_enabled', true);
            $widget_position = get_option('synofex_widget_position', 'bottom-right');
            $widget_theme = get_option('synofex_widget_theme', 'light');
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <?php if ($token_valid): ?>
                <div class="notice notice-success inline">
                    <p><?php _e('✓ Token is valid and chatbot is active', 'synofex-chatbot'); ?></p>
                </div>
            <?php elseif (!empty($auth_token)): ?>
                <div class="notice notice-warning inline">
                    <p><?php _e('⚠ Token validation failed. Please check your token and domain binding.', 'synofex-chatbot'); ?></p>
                </div>
            <?php endif; ?>

            <form method="post" action="">
                <?php wp_nonce_field('synofex_settings_nonce'); ?>

                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="synofex_auth_token"><?php _e('Authentication Token', 'synofex-chatbot'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="synofex_auth_token" name="synofex_auth_token"
                                   value="<?php echo esc_attr($auth_token); ?>" class="regular-text" />
                            <p class="description">
                                <?php _e('Enter your authentication token from the Synofex dashboard.', 'synofex-chatbot'); ?>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="synofex_api_url"><?php _e('API URL', 'synofex-chatbot'); ?></label>
                        </th>
                        <td>
                            <input type="url" id="synofex_api_url" name="synofex_api_url"
                                   value="<?php echo esc_url($api_url); ?>" class="regular-text" />
                            <p class="description">
                                <?php _e('The URL of your Synofex API endpoint.', 'synofex-chatbot'); ?>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <?php _e('Widget Settings', 'synofex-chatbot'); ?>
                        </th>
                        <td>
                            <fieldset>
                                <label for="synofex_widget_enabled">
                                    <input type="checkbox" id="synofex_widget_enabled" name="synofex_widget_enabled"
                                           value="1" <?php checked($widget_enabled, true); ?> />
                                    <?php _e('Enable chat widget', 'synofex-chatbot'); ?>
                                </label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="synofex_widget_position"><?php _e('Widget Position', 'synofex-chatbot'); ?></label>
                        </th>
                        <td>
                            <select id="synofex_widget_position" name="synofex_widget_position">
                                <option value="bottom-right" <?php selected($widget_position, 'bottom-right'); ?>>
                                    <?php _e('Bottom Right', 'synofex-chatbot'); ?>
                                </option>
                                <option value="bottom-left" <?php selected($widget_position, 'bottom-left'); ?>>
                                    <?php _e('Bottom Left', 'synofex-chatbot'); ?>
                                </option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="synofex_widget_theme"><?php _e('Widget Theme', 'synofex-chatbot'); ?></label>
                        </th>
                        <td>
                            <select id="synofex_widget_theme" name="synofex_widget_theme">
                                <option value="light" <?php selected($widget_theme, 'light'); ?>>
                                    <?php _e('Light', 'synofex-chatbot'); ?>
                                </option>
                                <option value="dark" <?php selected($widget_theme, 'dark'); ?>>
                                    <?php _e('Dark', 'synofex-chatbot'); ?>
                                </option>
                            </select>
                        </td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="synofex_save_settings" class="button-primary"
                           value="<?php _e('Save Settings', 'synofex-chatbot'); ?>" />
                </p>
            </form>

            <hr />

            <h2><?php _e('Shortcode Usage', 'synofex-chatbot'); ?></h2>
            <p><?php _e('You can also display the chatbot using the following shortcode:', 'synofex-chatbot'); ?></p>
            <code>[synofex_chatbot position="bottom-right" theme="light"]</code>
        </div>
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