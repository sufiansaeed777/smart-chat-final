/**
 * Synofex Chatbot WordPress Plugin - Frontend JavaScript
 *
 * Handles chat widget interactions and communication with backend
 *
 * TODO: Future Enhancement for Non-WordPress Sites
 * - Create standalone widget.js that can be embedded via script tag
 * - Add CDN distribution for non-WordPress sites
 * - Support initialization via global JavaScript object
 * - Example: window.synofexChat.init({ token: 'xxx', position: 'bottom-right' })
 */

(function($) {
    'use strict';

    // Chat widget controller
    const SynofexChat = {
        // Configuration (FIX: Changed from synofexConfig to synofex_config to match PHP wp_localize_script)
        config: window.synofex_config || {},
        apiUrl: window.synofex_config?.apiUrl || 'https://smart-chat-finale.vercel.app',
        token: window.synofex_config?.token || '',
        botId: window.synofex_config?.bot_id || 'default',
        sessionId: null,
        isOpen: false,
        isTyping: false,
        messageQueue: [],

        // Initialize chat widget
        init: function() {
            console.log('Synofex Chat: Initializing...');

            // Generate or retrieve session ID
            this.sessionId = this.getSessionId();

            // Setup event listeners
            this.setupEventListeners();

            // Load saved messages if any
            this.loadChatHistory();

            // Check connection status
            this.checkConnection();

            console.log('Synofex Chat: Ready');
        },

        // Setup all event listeners
        setupEventListeners: function() {
            // Toggle chat window
            $('#synofex-chat-toggle').on('click', () => {
                this.toggleChat();
            });

            // Minimize button
            $('.synofex-minimize-btn').on('click', () => {
                this.closeChat();
            });

            // Send message on Enter
            $('#synofex-message-input').on('keypress', (e) => {
                if (e.which === 13 && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Send button click
            $('#synofex-send-btn').on('click', () => {
                this.sendMessage();
            });

            // Menu actions
            $('.synofex-menu-item').on('click', function(e) {
                const action = $(this).data('action');
                SynofexChat.handleMenuAction(action);
            });

            // Report issue button
            $('#synofex-report-issue').on('click', () => {
                this.showReportDialog();
            });
        },

        // Toggle chat window
        toggleChat: function() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        },

        // Open chat window
        openChat: function() {
            $('#synofex-chat-window').fadeIn(300);
            $('#synofex-chat-toggle .synofex-chat-icon').hide();
            $('#synofex-chat-toggle .synofex-close-icon').show();
            $('.synofex-unread-badge').hide().text('0');
            this.isOpen = true;

            // Focus on input
            setTimeout(() => {
                $('#synofex-message-input').focus();
            }, 300);

            // Mark messages as read
            this.markMessagesAsRead();
        },

        // Close chat window
        closeChat: function() {
            $('#synofex-chat-window').fadeOut(300);
            $('#synofex-chat-toggle .synofex-chat-icon').show();
            $('#synofex-chat-toggle .synofex-close-icon').hide();
            this.isOpen = false;
        },

        // Send message to backend
        sendMessage: function() {
            const input = $('#synofex-message-input');
            const message = input.val().trim();

            if (!message) return;

            // Clear input immediately
            input.val('').focus();

            // Add user message to chat
            this.addMessage(message, 'user');

            // Show typing indicator
            this.showTypingIndicator();

            // Send to backend via AJAX
            $.ajax({
                url: synofex_config.ajax_url, // WordPress AJAX URL (FIX: Changed from synofex_ajax to synofex_config)
                type: 'POST',
                data: {
                    action: 'synofex_send_message',
                    nonce: synofex_config.nonce, // FIX: Changed from synofex_ajax to synofex_config
                    message: message,
                    bot_id: this.botId,
                    session_id: this.sessionId
                },
                success: (response) => {
                    this.hideTypingIndicator();

                    if (response.success && response.data) {
                        // Add bot response to chat
                        this.addMessage(response.data.response, 'bot');

                        // Update session ID if provided
                        if (response.data.sessionId) {
                            this.sessionId = response.data.sessionId;
                            this.saveSessionId(this.sessionId);
                        }
                    } else {
                        this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Synofex Chat Error:', error);
                    this.hideTypingIndicator();
                    this.addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
                }
            });
        },

        // Add message to chat window
        addMessage: function(message, sender) {
            const messagesContainer = $('#synofex-messages');
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const messageHtml = `
                <div class="synofex-message synofex-${sender}-message">
                    <div class="synofex-message-avatar">
                        ${sender === 'bot' ? this.getBotAvatar() : this.getUserAvatar()}
                    </div>
                    <div class="synofex-message-content">
                        <div class="synofex-message-bubble">
                            ${this.escapeHtml(message)}
                        </div>
                        <div class="synofex-message-time">${timestamp}</div>
                    </div>
                </div>
            `;

            messagesContainer.append(messageHtml);
            this.scrollToBottom();

            // Save to local storage
            this.saveChatHistory();

            // Play sound if enabled
            if (this.config.soundEnabled && sender === 'bot') {
                this.playNotificationSound();
            }
        },

        // Show typing indicator
        showTypingIndicator: function() {
            if (this.isTyping) return;

            this.isTyping = true;
            const typingHtml = `
                <div class="synofex-typing-indicator" id="synofex-typing">
                    <div class="synofex-typing-avatar">${this.getBotAvatar()}</div>
                    <div class="synofex-typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;

            $('#synofex-messages').append(typingHtml);
            this.scrollToBottom();
        },

        // Hide typing indicator
        hideTypingIndicator: function() {
            this.isTyping = false;
            $('#synofex-typing').remove();
        },

        // Get bot avatar HTML
        getBotAvatar: function() {
            if (this.config.botAvatar) {
                return `<img src="${this.config.botAvatar}" alt="Bot">`;
            }
            return '<div class="synofex-avatar-placeholder">🤖</div>';
        },

        // Get user avatar HTML
        getUserAvatar: function() {
            return '<div class="synofex-avatar-placeholder">👤</div>';
        },

        // Scroll chat to bottom
        scrollToBottom: function() {
            const messagesContainer = $('#synofex-messages');
            messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
        },

        // Handle menu actions
        handleMenuAction: function(action) {
            switch(action) {
                case 'clear-chat':
                    this.clearChat();
                    break;
                case 'download-transcript':
                    this.downloadTranscript();
                    break;
                case 'report-issue':
                    this.showReportDialog();
                    break;
                case 'request-human':
                    this.requestHumanAgent();
                    break;
            }
        },

        // Clear chat history
        clearChat: function() {
            if (confirm('Are you sure you want to clear the chat history?')) {
                $('#synofex-messages').empty();
                localStorage.removeItem('synofex_chat_history');
                this.addMessage(this.config.welcomeMessage || 'Hello! How can I help you today?', 'bot');
            }
        },

        // Check connection status
        checkConnection: function() {
            $.ajax({
                url: synofex_config.ajax_url, // FIX: Changed from synofex_ajax to synofex_config
                type: 'POST',
                data: {
                    action: 'synofex_check_connection',
                    nonce: synofex_config.nonce // FIX: Changed from synofex_ajax to synofex_config
                },
                success: (response) => {
                    if (response.success) {
                        $('.synofex-status-dot').addClass('online');
                    } else {
                        $('.synofex-status-dot').removeClass('online');
                    }
                }
            });
        },

        // Session management
        getSessionId: function() {
            let sessionId = localStorage.getItem('synofex_session_id');
            if (!sessionId) {
                sessionId = 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                this.saveSessionId(sessionId);
            }
            return sessionId;
        },

        saveSessionId: function(sessionId) {
            localStorage.setItem('synofex_session_id', sessionId);
        },

        // Chat history management
        saveChatHistory: function() {
            const messages = [];
            $('#synofex-messages .synofex-message').each(function() {
                const sender = $(this).hasClass('synofex-user-message') ? 'user' : 'bot';
                const content = $(this).find('.synofex-message-bubble').text();
                messages.push({ sender, content });
            });
            localStorage.setItem('synofex_chat_history', JSON.stringify(messages));
        },

        loadChatHistory: function() {
            const history = localStorage.getItem('synofex_chat_history');
            if (history) {
                try {
                    const messages = JSON.parse(history);
                    messages.forEach(msg => {
                        this.addMessage(msg.content, msg.sender);
                    });
                } catch (e) {
                    console.error('Failed to load chat history:', e);
                }
            } else {
                // Show welcome message
                this.addMessage(this.config.welcomeMessage || 'Hello! How can I help you today?', 'bot');
            }
        },

        // Utility functions
        escapeHtml: function(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        },

        playNotificationSound: function() {
            // Create and play a simple notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAALhYAQACABAAZGF0YQoGAA==');
            audio.play().catch(e => console.log('Could not play sound:', e));
        }
    };

    // Initialize when DOM is ready
    $(document).ready(function() {
        // FIX: Changed from #synofex-chatbot-container to #synofex-chatbot-widget to match actual HTML ID
        if ($('#synofex-chatbot-widget').length) {
            // Show the widget container (it starts hidden in HTML)
            $('#synofex-chatbot-widget').fadeIn(300);

            // Initialize chat functionality
            SynofexChat.init();
        }
    });

    // Expose to global scope for debugging
    window.SynofexChat = SynofexChat;

})(jQuery);

/**
 * TODO: Non-WordPress Widget Implementation
 *
 * For non-WordPress sites, create a standalone version:
 *
 * 1. Remove jQuery dependency
 * 2. Use vanilla JavaScript or lightweight framework
 * 3. Bundle with webpack/rollup for distribution
 * 4. Host on CDN
 * 5. Initialize via script tag:
 *
 * <script>
 *   (function(w,d,s,o,f,js,fjs){
 *     w['SynofexChat']=o;w[o]=w[o]||function(){
 *     (w[o].q=w[o].q||[]).push(arguments)};w[o].l=1*new Date();
 *     js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
 *     js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
 *   }(window,document,'script','synofex','https://cdn.synofex.com/widget.js'));
 *
 *   synofex('init', { token: 'YOUR_TOKEN_HERE' });
 * </script>
 */