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
        conversationId: null,  // NEW: Track conversation ID for handoff
        conversationMode: 'AI', // NEW: Track current mode (AI or Human)
        isOpen: false,
        isTyping: false,
        messageQueue: [],
        modePollInterval: null, // NEW: Interval for polling mode changes

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

            // NEW: Start polling for mode changes (every 5 seconds)
            this.startModePolling();

            console.log('Synofex Chat: Ready');
        },

        // Setup all event listeners
        setupEventListeners: function() {
            // Toggle chat window
            $('#synofex-chat-toggle').on('click', () => {
                this.toggleChat();
            });

            // Close button (FIX: Changed from .synofex-minimize-btn to #synofex-chat-close)
            $('#synofex-chat-close').on('click', () => {
                this.closeChat();
            });

            // Send message on Enter (FIX: Changed from #synofex-message-input to #synofex-chat-input)
            $('#synofex-chat-input').on('keypress', (e) => {
                if (e.which === 13 && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Send button click (FIX: Changed from #synofex-send-btn to .synofex-send-button)
            $('.synofex-send-button').on('click', (e) => {
                e.preventDefault(); // Prevent form submission
                this.sendMessage();
            });

            // Form submit handler (FIX: Added to handle form submission)
            $('#synofex-chat-form').on('submit', (e) => {
                e.preventDefault();
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
            $('.synofex-unread-indicator').hide().text('0');
            this.isOpen = true;

            // Focus on input (FIX: Changed from #synofex-message-input to #synofex-chat-input)
            setTimeout(() => {
                $('#synofex-chat-input').focus();
            }, 300);

            // Mark messages as read (FIX: Only call if function exists)
            if (typeof this.markMessagesAsRead === 'function') {
                this.markMessagesAsRead();
            }
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
            // FIX: Changed from #synofex-message-input to #synofex-chat-input
            const input = $('#synofex-chat-input');
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

                        // NEW: Store conversation ID for handoff tracking
                        if (response.data.conversationId) {
                            this.conversationId = response.data.conversationId;
                            localStorage.setItem('synofex_conversation_id', this.conversationId);
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
            // FIX: Changed from #synofex-messages to #synofex-chat-messages
            const messagesContainer = $('#synofex-chat-messages');
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

            // FIX: Changed from #synofex-messages to #synofex-chat-messages
            $('#synofex-chat-messages').append(typingHtml);
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
            // FIX: Changed from #synofex-messages to #synofex-chat-messages
            const messagesContainer = $('#synofex-chat-messages');
            // FIX: Check if element exists before accessing scrollHeight
            if (messagesContainer.length && messagesContainer[0]) {
                messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
            }
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
                // FIX: Changed from #synofex-messages to #synofex-chat-messages
                $('#synofex-chat-messages').empty();
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
            // FIX: Changed from #synofex-messages to #synofex-chat-messages
            $('#synofex-chat-messages .synofex-message').each(function() {
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
        },

        // Mark messages as read (FIX: Added missing function)
        markMessagesAsRead: function() {
            // Hide unread indicator
            $('.synofex-unread-indicator').hide().text('0');

            // Could also send AJAX request to mark messages as read on server
            // For now, just handle UI updates
        },

        // NEW: Human Handoff Integration
        // Start polling for conversation mode changes
        startModePolling: function() {
            // Poll every 5 seconds
            this.modePollInterval = setInterval(() => {
                this.checkConversationMode();
            }, 5000);
        },

        // Check if conversation mode has changed (AI vs Human)
        checkConversationMode: function() {
            // Only check if we have a conversation ID
            if (!this.conversationId) {
                // Try to retrieve from localStorage
                this.conversationId = localStorage.getItem('synofex_conversation_id');
                if (!this.conversationId) return;
            }

            // Call API to check conversation status
            $.ajax({
                url: this.apiUrl + '/api/conversations/' + this.conversationId,
                type: 'GET',
                success: (response) => {
                    if (response.success && response.conversation) {
                        const newMode = response.conversation.mode;

                        // Check if mode changed
                        if (newMode !== this.conversationMode) {
                            const oldMode = this.conversationMode;
                            this.conversationMode = newMode;

                            // Update UI and notify visitor
                            this.handleModeChange(oldMode, newMode);
                        }

                        // Check for new messages from agent
                        if (newMode === 'Human' && response.conversation.messages) {
                            this.syncMessages(response.conversation.messages);
                        }
                    }
                },
                error: (xhr) => {
                    // Conversation might not exist yet, silently continue
                    if (xhr.status !== 404) {
                        console.error('Failed to check conversation mode:', xhr);
                    }
                }
            });
        },

        // Handle mode change between AI and Human
        handleModeChange: function(oldMode, newMode) {
            console.log('Conversation mode changed:', oldMode, '->', newMode);

            if (newMode === 'Human') {
                // Agent took over
                this.addSystemMessage('🙋 An agent has joined the conversation');
                this.updateModeIndicator('Human', 'Agent is here to help');
            } else if (newMode === 'AI') {
                // Back to AI
                this.addSystemMessage('🤖 You are now chatting with AI');
                this.updateModeIndicator('AI', 'AI Assistant');
            }
        },

        // Add system message (different style from regular messages)
        addSystemMessage: function(message) {
            const messagesContainer = $('#synofex-chat-messages');
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const systemHtml = `
                <div class="synofex-system-message">
                    <div class="synofex-system-content">
                        <span class="synofex-system-icon">ℹ️</span>
                        <span class="synofex-system-text">${this.escapeHtml(message)}</span>
                    </div>
                    <div class="synofex-message-time">${timestamp}</div>
                </div>
            `;

            messagesContainer.append(systemHtml);
            this.scrollToBottom();
        },

        // Update mode indicator in chat header
        updateModeIndicator: function(mode, label) {
            // Remove existing indicator
            $('.synofex-mode-indicator').remove();

            // Add new indicator to chat header
            const indicatorClass = mode === 'Human' ? 'mode-human' : 'mode-ai';
            const indicatorHtml = `
                <div class="synofex-mode-indicator ${indicatorClass}">
                    <span class="synofex-mode-dot"></span>
                    <span class="synofex-mode-label">${label}</span>
                </div>
            `;

            // Insert after chat close button
            $('#synofex-chat-close').after(indicatorHtml);
        },

        // Sync messages from server (for Human mode)
        syncMessages: function(serverMessages) {
            // Get current messages
            const currentMessages = [];
            $('#synofex-chat-messages .synofex-message').each(function() {
                const text = $(this).find('.synofex-message-bubble').text();
                currentMessages.push(text);
            });

            // Check for new messages from agent
            serverMessages.forEach(msg => {
                // Only add agent messages that we don't have
                if (msg.sender === 'agent' && !currentMessages.includes(msg.text)) {
                    this.addMessage(msg.text, 'agent');
                }
            });
        },

        // Stop polling (cleanup)
        stopModePolling: function() {
            if (this.modePollInterval) {
                clearInterval(this.modePollInterval);
                this.modePollInterval = null;
            }
        },

        // Download chat transcript
        downloadTranscript: function() {
            const messages = [];
            $('#synofex-chat-messages .synofex-message').each(function() {
                const sender = $(this).hasClass('synofex-user-message') ? 'You' : 'Bot';
                const text = $(this).find('.synofex-message-bubble').text();
                const time = $(this).find('.synofex-message-time').text();
                messages.push({ sender, text, time });
            });

            $.ajax({
                url: synofex_config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_download_transcript',
                    nonce: synofex_config.nonce,
                    bot_id: this.botId,
                    session_id: this.sessionId,
                    messages: messages
                },
                success: (response) => {
                    if (response.success && response.data.download_url) {
                        window.open(response.data.download_url, '_blank');
                    } else {
                        alert('Failed to generate transcript');
                    }
                },
                error: () => {
                    alert('Failed to download transcript');
                }
            });
        },

        // Show report issue dialog
        showReportDialog: function() {
            const description = prompt('Please describe the issue:');
            if (!description) return;

            $.ajax({
                url: synofex_config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_report_issue',
                    nonce: synofex_config.nonce,
                    bot_id: this.botId,
                    issue_type: 'general',
                    description: description,
                    conversation_id: this.conversationId
                },
                success: (response) => {
                    if (response.success) {
                        alert('Thank you! Your issue has been reported.');
                    } else {
                        alert('Failed to report issue. Please try again.');
                    }
                },
                error: () => {
                    alert('Failed to report issue. Please try again.');
                }
            });
        },

        // Request human agent
        requestHumanAgent: function() {
            const reason = prompt('Please tell us why you need to speak with a human agent:') || 'Requested human assistance';

            $.ajax({
                url: synofex_config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_request_human',
                    nonce: synofex_config.nonce,
                    bot_id: this.botId,
                    conversation_id: this.conversationId,
                    reason: reason
                },
                success: (response) => {
                    if (response.success) {
                        this.addSystemMessage('🙋 Your request has been received. A human agent will assist you shortly.');
                    } else {
                        this.addSystemMessage('⚠️ Human agents are currently unavailable. Please try again later.');
                    }
                },
                error: () => {
                    this.addSystemMessage('⚠️ Failed to connect to human support. Please try again later.');
                }
            });
        }
    };

    // Initialize when DOM is ready - with retry for widget HTML
    function initWidget() {
        // FIX: Changed from #synofex-chatbot-container to #synofex-chatbot-widget to match actual HTML ID
        if ($('#synofex-chatbot-widget').length) {
            // Show the widget container (it starts hidden in HTML)
            $('#synofex-chatbot-widget').fadeIn(300);

            // Initialize chat functionality
            SynofexChat.init();
        } else {
            // Widget not in DOM yet, retry after a short delay
            setTimeout(initWidget, 100);
        }
    }

    // Start initialization when jQuery is ready
    $(document).ready(function() {
        initWidget();
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