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

// Check if jQuery is loaded before initializing
if (typeof jQuery === 'undefined') {
    console.error('Synofex Chat Error: jQuery is required but not loaded. Please ensure jQuery is enqueued before this script.');
    // Create empty stub to prevent further errors
    window.SynofexChat = {
        init: function() {
            console.error('Synofex Chat: Cannot initialize without jQuery');
        }
    };
} else {
    (function($) {
        'use strict';

    // Chat widget controller
    const SynofexChat = {
        // Configuration (from WordPress localized script)
        config: window.synofex_config || {},
        botId: (window.synofex_config && window.synofex_config.bot_id) || 'default',
        botName: (window.synofex_config && window.synofex_config.bot_name) || 'AI Assistant',
        welcomeMessage: (window.synofex_config && window.synofex_config.welcome_message) || 'Hello! How can I help you today?',
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

            // Action buttons (Request Human and Report Issue)
            $('.synofex-action-btn').on('click', (e) => {
                const action = $(e.currentTarget).data('action');
                this.handleMenuAction(action);
            });

            // Close button
            $('#synofex-chat-close').on('click', () => {
                this.closeChat();
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
                url: this.config.ajax_url, // WordPress AJAX URL
                type: 'POST',
                data: {
                    action: 'synofex_send_message',
                    nonce: this.config.nonce,
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

            // Play sound if enabled (future feature)
            // Note: Sound notifications disabled for now
            // if (this.config.soundEnabled && sender === 'bot') {
            //     this.playNotificationSound();
            // }
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
                    this.showReportIssueForm();
                    break;
                case 'request-human':
                    this.requestHumanAgent();
                    break;
            }
        },

        // Request human agent - show simple notification instead of popup
        requestHumanAgent: function() {
            // Show notification in chat
            this.addNotification('Your request for a human agent has been sent. An agent will join shortly.');

            // Send request to backend
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_request_human',
                    nonce: this.config.nonce,
                    bot_id: this.botId,
                    session_id: this.sessionId
                },
                success: (response) => {
                    if (!response.success) {
                        this.addNotification('Could not connect to an agent. Please try again later.');
                    }
                },
                error: () => {
                    this.addNotification('Could not connect to an agent. Please try again later.');
                }
            });
        },

        // Add notification to chat (simple inline notification)
        addNotification: function(message) {
            const messagesContainer = $('#synofex-messages');
            const notificationHtml = `
                <div class="synofex-notification">
                    <span class="synofex-notification-text">${this.escapeHtml(message)}</span>
                </div>
            `;
            messagesContainer.append(notificationHtml);
            this.scrollToBottom();
        },

        // Show Report Issue form overlay
        showReportIssueForm: function() {
            const formHtml = `
                <div class="synofex-report-overlay" id="synofex-report-overlay">
                    <div class="synofex-report-form">
                        <div class="synofex-report-header">
                            <h4>Report an Issue</h4>
                            <button type="button" class="synofex-report-close" id="synofex-report-close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <form id="synofex-report-form">
                            <div class="synofex-report-field">
                                <label for="synofex-report-name">Name <span class="required">*</span></label>
                                <input type="text" id="synofex-report-name" name="name" required placeholder="Your name">
                            </div>
                            <div class="synofex-report-field">
                                <label for="synofex-report-email">Email <span class="required">*</span></label>
                                <input type="email" id="synofex-report-email" name="email" required placeholder="your@email.com">
                                <div class="error-message" id="synofex-email-error" style="display:none;">Please enter a valid email address</div>
                            </div>
                            <div class="synofex-report-field">
                                <label for="synofex-report-issue">Issue <span class="required">*</span></label>
                                <textarea id="synofex-report-issue" name="issue" required placeholder="Describe the issue you're experiencing..."></textarea>
                            </div>
                            <div class="synofex-report-actions">
                                <button type="button" class="synofex-report-cancel" id="synofex-report-cancel">Cancel</button>
                                <button type="submit" class="synofex-report-submit">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            $('#synofex-chat-window').append(formHtml);

            // Setup form event listeners
            const self = this;

            $('#synofex-report-close, #synofex-report-cancel').on('click', function() {
                self.closeReportForm();
            });

            // Email validation on blur
            $('#synofex-report-email').on('blur', function() {
                self.validateEmail($(this).val());
            });

            $('#synofex-report-form').on('submit', function(e) {
                e.preventDefault();
                self.submitReportIssue();
            });
        },

        // Validate email format
        validateEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = emailRegex.test(email);

            if (!isValid && email.length > 0) {
                $('#synofex-report-email').addClass('error');
                $('#synofex-email-error').show();
            } else {
                $('#synofex-report-email').removeClass('error');
                $('#synofex-email-error').hide();
            }

            return isValid;
        },

        // Submit Report Issue form
        submitReportIssue: function() {
            const name = $('#synofex-report-name').val().trim();
            const email = $('#synofex-report-email').val().trim();
            const issue = $('#synofex-report-issue').val().trim();

            // Validate all fields
            if (!name || !email || !issue) {
                return;
            }

            // Validate email format
            if (!this.validateEmail(email)) {
                return;
            }

            // Disable submit button
            $('.synofex-report-submit').prop('disabled', true).text('Submitting...');

            // Send to backend
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_report_issue',
                    nonce: this.config.nonce,
                    bot_id: this.botId,
                    session_id: this.sessionId,
                    name: name,
                    email: email,
                    issue: issue
                },
                success: (response) => {
                    this.closeReportForm();
                    if (response.success) {
                        this.addNotification('Thank you! Your issue has been reported successfully.');
                    } else {
                        this.addNotification('Could not submit your issue. Please try again later.');
                    }
                },
                error: () => {
                    this.closeReportForm();
                    this.addNotification('Could not submit your issue. Please try again later.');
                }
            });
        },

        // Close Report Issue form
        closeReportForm: function() {
            $('#synofex-report-overlay').remove();
        },

        // Clear chat history
        clearChat: function() {
            if (confirm('Are you sure you want to clear the chat history?')) {
                $('#synofex-messages').empty();
                if (this.isLocalStorageAvailable()) {
                    try {
                        localStorage.removeItem('synofex_chat_history');
                    } catch(e) {
                        console.warn('Synofex Chat: Could not clear chat history from localStorage', e);
                    }
                }
                this.addMessage(this.welcomeMessage, 'bot');
            }
        },

        // Check connection status
        checkConnection: function() {
            $.ajax({
                url: this.config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_check_connection',
                    nonce: this.config.nonce
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

        // Check if localStorage is available
        isLocalStorageAvailable: function() {
            try {
                const test = '__localStorage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch(e) {
                return false;
            }
        },

        // Session management
        getSessionId: function() {
            let sessionId = null;

            if (this.isLocalStorageAvailable()) {
                sessionId = localStorage.getItem('synofex_session_id');
            }

            if (!sessionId) {
                sessionId = 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                this.saveSessionId(sessionId);
            }
            return sessionId;
        },

        saveSessionId: function(sessionId) {
            if (this.isLocalStorageAvailable()) {
                try {
                    localStorage.setItem('synofex_session_id', sessionId);
                } catch(e) {
                    console.warn('Synofex Chat: Could not save session ID to localStorage', e);
                }
            }
        },

        // Chat history management
        saveChatHistory: function() {
            if (!this.isLocalStorageAvailable()) return;

            try {
                const messages = [];
                $('#synofex-messages .synofex-message').each(function() {
                    const sender = $(this).hasClass('synofex-user-message') ? 'user' : 'bot';
                    const content = $(this).find('.synofex-message-bubble').text();
                    messages.push({ sender, content });
                });
                localStorage.setItem('synofex_chat_history', JSON.stringify(messages));
            } catch(e) {
                console.warn('Synofex Chat: Could not save chat history', e);
            }
        },

        loadChatHistory: function() {
            let history = null;

            if (this.isLocalStorageAvailable()) {
                try {
                    history = localStorage.getItem('synofex_chat_history');
                } catch(e) {
                    console.warn('Synofex Chat: Could not load chat history', e);
                }
            }

            if (history) {
                try {
                    const messages = JSON.parse(history);
                    messages.forEach(msg => {
                        this.addMessage(msg.content, msg.sender);
                    });
                } catch (e) {
                    console.error('Failed to parse chat history:', e);
                    // Show welcome message as fallback
                    this.addMessage(this.welcomeMessage, 'bot');
                }
            } else {
                // Show welcome message
                this.addMessage(this.welcomeMessage, 'bot');
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
        if ($('#synofex-chatbot-container').length) {
            SynofexChat.init();
        }
    });

    // Expose to global scope for debugging
    window.SynofexChat = SynofexChat;

    })(jQuery);
}

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