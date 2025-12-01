<?php
/**
 * Chat Widget for Synofex Chatbot
 * Version: 2.0.0
 * Matches website ChatBot styling exactly
 *
 * @package SynofexChatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Widget class for Synofex Chatbot
 */
class Synofex_Widget {

    /**
     * Render the chat widget
     *
     * @param array $atts Widget attributes
     */
    public function render($atts = []) {
        // Get configuration
        $position = isset($atts['position']) ? $atts['position'] : get_option('synofex_widget_position', 'bottom-right');
        $theme = isset($atts['theme']) ? $atts['theme'] : get_option('synofex_widget_theme', 'light');
        $bot_config = get_option('synofex_bot_config', []);

        // Set position class
        $position_class = 'synofex-widget-' . $position;
        $theme_class = 'synofex-theme-' . $theme;

        ?>
        <div id="synofex-chatbot-widget" class="synofex-chatbot-widget <?php echo esc_attr($position_class); ?> <?php echo esc_attr($theme_class); ?>" style="display:none;">
            <!-- Chat Toggle Button -->
            <button id="synofex-chat-toggle" class="synofex-chat-toggle" aria-label="<?php esc_attr_e('Open chat', 'synofex-chatbot'); ?>">
                <svg class="synofex-chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="synofex-close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="synofex-unread-indicator" style="display:none;">0</span>
            </button>

            <!-- Chat Window -->
            <div id="synofex-chat-window" class="synofex-chat-window" style="display:none;">
                <!-- Chat Header -->
                <div class="synofex-chat-header">
                    <div class="synofex-chat-header-info">
                        <div class="synofex-bot-avatar-container">
                            <?php if (!empty($bot_config['avatar'])): ?>
                                <img src="<?php echo esc_url($bot_config['avatar']); ?>" alt="<?php esc_attr_e('Bot Avatar', 'synofex-chatbot'); ?>" class="synofex-bot-avatar">
                            <?php else: ?>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.93 6 15.5 7.57 15.5 9.5C15.5 11.43 13.93 13 12 13C10.07 13 8.5 11.43 8.5 9.5C8.5 7.57 10.07 6 12 6ZM12 20C9.97 20 7.57 19.18 5.86 17.12C7.55 15.8 9.68 15 12 15C14.32 15 16.45 15.8 18.14 17.12C16.43 19.18 14.03 20 12 20Z" fill="#6566F1"/>
                                </svg>
                            <?php endif; ?>
                        </div>
                        <div class="synofex-chat-header-text">
                            <h3><?php echo esc_html($bot_config['name'] ?? __('AI Assistant', 'synofex-chatbot')); ?></h3>
                            <p><?php _e("We're here to help!", 'synofex-chatbot'); ?></p>
                        </div>
                    </div>
                    <div class="synofex-header-actions">
                        <button class="synofex-header-btn" aria-label="<?php esc_attr_e('Help', 'synofex-chatbot'); ?>">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="17" r="1" fill="currentColor"/>
                            </svg>
                        </button>
                        <button id="synofex-chat-close" class="synofex-chat-close" aria-label="<?php esc_attr_e('Close chat', 'synofex-chatbot'); ?>">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div id="synofex-chat-messages" class="synofex-chat-messages">
                    <!-- Messages will be added here dynamically -->
                </div>

                <!-- Chat Input -->
                <div class="synofex-chat-input-container">
                    <!-- Action Buttons - Appear after 5 messages -->
                    <div id="synofex-action-buttons" class="synofex-action-buttons">
                        <button type="button" class="synofex-action-btn request-human" data-action="request-human">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <?php _e('Request a Human', 'synofex-chatbot'); ?>
                        </button>
                        <button type="button" class="synofex-action-btn report-issue" data-action="report-issue">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.65 1.55 19C1.55 19.35 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21.01H20.44C20.79 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.35 22.45 19C22.45 18.65 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.31 12.97 3.14C12.67 2.97 12.33 2.88 11.99 2.88C11.65 2.88 11.31 2.97 11.01 3.14C10.71 3.31 10.46 3.56 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="17" r="1" fill="currentColor"/>
                            </svg>
                            <?php _e('Report Issue', 'synofex-chatbot'); ?>
                        </button>
                    </div>

                    <!-- Input Row -->
                    <div class="synofex-input-row">
                        <form id="synofex-chat-form" class="synofex-chat-form">
                            <div class="synofex-input-group">
                                <input
                                    type="text"
                                    id="synofex-chat-input"
                                    class="synofex-chat-input"
                                    placeholder="<?php esc_attr_e('Type your message...', 'synofex-chatbot'); ?>"
                                    maxlength="1000"
                                    autocomplete="off"
                                />
                            </div>
                        </form>
                        <button type="button" class="synofex-end-btn" id="synofex-end-chat">
                            <?php _e('End', 'synofex-chatbot'); ?>
                        </button>
                        <button type="submit" form="synofex-chat-form" class="synofex-send-button" aria-label="<?php esc_attr_e('Send message', 'synofex-chatbot'); ?>">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Footer -->
                    <div class="synofex-footer">
                        <?php _e('Privacy', 'synofex-chatbot'); ?> • <?php _e('GDPR', 'synofex-chatbot'); ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}
