<?php
/**
 * Chat Widget for Synofex Chatbot
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
                    <path d="M7 9H17V11H7V9ZM7 13H13V15H7V13Z" fill="white"/>
                </svg>
                <span class="synofex-unread-indicator" style="display:none;">0</span>
            </button>

            <!-- Chat Window -->
            <div id="synofex-chat-window" class="synofex-chat-window" style="display:none;">
                <!-- Chat Header -->
                <div class="synofex-chat-header">
                    <div class="synofex-chat-header-info">
                        <?php if (!empty($bot_config['avatar'])): ?>
                            <img src="<?php echo esc_url($bot_config['avatar']); ?>" alt="<?php esc_attr_e('Bot Avatar', 'synofex-chatbot'); ?>" class="synofex-bot-avatar">
                        <?php endif; ?>
                        <div class="synofex-chat-header-text">
                            <h3><?php echo esc_html($bot_config['name'] ?? __('AI Assistant', 'synofex-chatbot')); ?></h3>
                            <span class="synofex-status-indicator synofex-status-online">
                                <?php _e('Online', 'synofex-chatbot'); ?>
                            </span>
                        </div>
                    </div>
                    <button id="synofex-chat-close" class="synofex-chat-close" aria-label="<?php esc_attr_e('Close chat', 'synofex-chatbot'); ?>">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>

                <!-- Chat Messages -->
                <div id="synofex-chat-messages" class="synofex-chat-messages">
                    <!-- Welcome message -->
                    <?php if (!empty($bot_config['welcome_message'])): ?>
                        <div class="synofex-message synofex-message-bot">
                            <div class="synofex-message-content">
                                <?php echo wp_kses_post($bot_config['welcome_message']); ?>
                            </div>
                            <span class="synofex-message-time"><?php echo esc_html(current_time('g:i a')); ?></span>
                        </div>
                    <?php else: ?>
                        <div class="synofex-message synofex-message-bot">
                            <div class="synofex-message-content">
                                <?php _e('Hello! How can I help you today?', 'synofex-chatbot'); ?>
                            </div>
                            <span class="synofex-message-time"><?php echo esc_html(current_time('g:i a')); ?></span>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Typing Indicator -->
                <div id="synofex-typing-indicator" class="synofex-typing-indicator" style="display:none;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <!-- Chat Input -->
                <div class="synofex-chat-input-container">
                    <form id="synofex-chat-form" class="synofex-chat-form">
                        <div class="synofex-input-group">
                            <textarea
                                id="synofex-chat-input"
                                class="synofex-chat-input"
                                placeholder="<?php esc_attr_e('Type your message...', 'synofex-chatbot'); ?>"
                                rows="1"
                                maxlength="1000"
                            ></textarea>
                            <button type="submit" class="synofex-send-button" aria-label="<?php esc_attr_e('Send message', 'synofex-chatbot'); ?>">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 10L18 2L14 18L10 10L2 10Z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </form>

                    <!-- Powered By -->
                    <?php if (get_option('synofex_show_powered_by', true)): ?>
                        <div class="synofex-powered-by">
                            <a href="https://synofex.com" target="_blank" rel="noopener">
                                <?php _e('Powered by Synofex', 'synofex-chatbot'); ?>
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Inline styles for critical CSS -->
        <style>
            .synofex-chatbot-widget {
                position: fixed;
                z-index: 9999;
            }

            .synofex-widget-bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .synofex-widget-bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .synofex-chat-toggle {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #0073aa;
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                position: relative;
                transition: transform 0.3s ease;
            }

            .synofex-chat-toggle:hover {
                transform: scale(1.05);
            }

            .synofex-chat-window {
                position: absolute;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 5px 40px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .synofex-widget-bottom-right .synofex-chat-window {
                bottom: 80px;
                right: 0;
            }

            .synofex-widget-bottom-left .synofex-chat-window {
                bottom: 80px;
                left: 0;
            }

            .synofex-chat-header {
                background: #0073aa;
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .synofex-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            .synofex-chat-input-container {
                border-top: 1px solid #e0e0e0;
                padding: 12px;
            }

            .synofex-chat-input {
                width: 100%;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 8px 40px 8px 12px;
                resize: none;
                font-family: inherit;
            }

            .synofex-send-button {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: transparent;
                border: none;
                color: #0073aa;
                cursor: pointer;
                padding: 4px;
            }

            .synofex-input-group {
                position: relative;
            }

            /* Dark theme */
            .synofex-theme-dark .synofex-chat-window {
                background: #1a1a1a;
                color: #ffffff;
            }

            .synofex-theme-dark .synofex-chat-header {
                background: #2c2c2c;
            }

            .synofex-theme-dark .synofex-chat-input {
                background: #2c2c2c;
                color: #ffffff;
                border-color: #444;
            }

            /* Responsive */
            @media (max-width: 480px) {
                .synofex-chat-window {
                    width: 100vw;
                    height: 100vh;
                    bottom: 0 !important;
                    right: 0 !important;
                    left: 0 !important;
                    border-radius: 0;
                }
            }
        </style>
        <?php
    }
}