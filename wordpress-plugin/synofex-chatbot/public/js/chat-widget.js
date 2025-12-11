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
        displayedMessageIds: new Set(), // NEW: Track displayed message IDs to prevent duplicates
        isCheckingMode: false, // NEW: Prevent concurrent mode check requests
        userMessageCount: 0, // Track user messages for showing action buttons

        // Format timestamp for display - shows date for older messages, time only for today
        formatTimestamp: function(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp; // Return original if can't parse

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Check if message is from today
            if (today.getTime() === messageDay.getTime()) {
                return timeStr;
            }

            // Check if message is from yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.getTime() === messageDay.getTime()) {
                return 'Yesterday, ' + timeStr;
            }

            // Older messages - show date and time
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return dateStr + ', ' + timeStr;
        },

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

            // Hide action buttons initially (show after 5 messages)
            $('#synofex-action-buttons').hide();

            // Load saved message count
            this.loadMessageCount();

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

            // Action buttons (Request Human and Report Issue)
            $('.synofex-action-btn.request-human').on('click', () => {
                this.requestHumanAgent();
            });

            $('.synofex-action-btn.report-issue').on('click', () => {
                this.showReportDialog();
            });

            // End chat button
            $('#synofex-end-chat').on('click', () => {
                this.endChat();
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

            // Increment user message count and check if buttons should show
            this.userMessageCount++;
            this.saveMessageCount();
            this.checkShowActionButtons();

            // Add user message to chat (track message ID to prevent duplicates)
            const userMessageId = `user-${Date.now()}-${message.substring(0, 20)}`;
            this.displayedMessageIds.add(userMessageId);
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
                    session_id: this.sessionId,
                    page_url: window.location.href // Send current page URL for Human Handoff
                },
                success: (response) => {
                    this.hideTypingIndicator();

                    if (response.success && response.data) {
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

                        // FIX: Check if conversation is in Human mode
                        if (response.data.mode === 'Human' && response.data.waitingForAgent) {
                            // Don't show bot response in Human mode - agent will respond
                            // Just update mode if not already set
                            if (this.conversationMode !== 'Human') {
                                this.conversationMode = 'Human';
                                this.updateModeIndicator('Human', 'Agent is here to help');
                            }
                            // Message already added to chat (visitor message), just wait for agent response
                        } else {
                            // Add bot response to chat (track message ID to prevent duplicates)
                            const botMessageId = `bot-${Date.now()}-${response.data.response.substring(0, 20)}`;
                            this.displayedMessageIds.add(botMessageId);
                            this.addMessage(response.data.response, 'bot');
                        }
                    } else {
                        // Handle error responses
                        const errorData = response.data || {};
                        let errorMessage = 'Sorry, I encountered an error. Please try again.';

                        // Check for expired token
                        if (errorData.expired || errorData.code === 'TOKEN_EXPIRED') {
                            errorMessage = '⚠️ This chatbot is currently unavailable. Please contact the site administrator.';
                            // Disable input to prevent further attempts
                            this.disableChat('Token expired');
                        } else if (errorData.code === 'TOKEN_INVALID') {
                            errorMessage = '⚠️ Chatbot configuration error. Please contact the site administrator.';
                            this.disableChat('Invalid token');
                        } else if (errorData.message) {
                            errorMessage = errorData.message;
                        }

                        const errorMessageId = `bot-error-${Date.now()}`;
                        this.displayedMessageIds.add(errorMessageId);
                        this.addMessage(errorMessage, 'bot');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('Synofex Chat Error:', error);
                    this.hideTypingIndicator();
                    const errorMessageId = `bot-error-${Date.now()}`;
                    this.displayedMessageIds.add(errorMessageId);
                    this.addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
                }
            });
        },

        // Add message to chat window
        addMessage: function(message, sender, messageId) {
            // FIX: Changed from #synofex-messages to #synofex-chat-messages
            const messagesContainer = $('#synofex-chat-messages');
            // FIX: Store full ISO timestamp for proper date display on older messages
            const timestamp = new Date().toISOString();

            // Generate message ID if not provided (for user messages and old code compatibility)
            if (!messageId) {
                messageId = `${sender}-${Date.now()}-${message.substring(0, 20)}`;
            }

            // Determine avatar based on sender type
            let avatar;
            if (sender === 'bot') {
                avatar = this.getBotAvatar();
            } else if (sender === 'agent') {
                avatar = this.getAgentAvatar(); // Human agent
            } else {
                avatar = this.getUserAvatar(); // Visitor
            }

            // FIX: Store message ID and timestamp in data attributes for proper persistence
            const displayTime = this.formatTimestamp(timestamp);
            const messageHtml = `
                <div class="synofex-message synofex-${sender}-message" data-message-id="${this.escapeHtml(messageId)}" data-timestamp="${this.escapeHtml(timestamp)}">
                    <div class="synofex-message-avatar">
                        ${avatar}
                    </div>
                    <div class="synofex-message-content">
                        <div class="synofex-message-bubble">
                            ${this.escapeHtml(message)}
                        </div>
                        <div class="synofex-message-time">${displayTime}</div>
                    </div>
                </div>
            `;

            messagesContainer.append(messageHtml);
            this.scrollToBottom();

            // Save to local storage
            this.saveChatHistory();

            // Play sound if enabled (for both bot and agent messages)
            if (this.config.soundEnabled && (sender === 'bot' || sender === 'agent')) {
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

        // Get human agent avatar HTML
        getAgentAvatar: function() {
            return '<div class="synofex-avatar-placeholder">👨‍💼</div>';
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

                // Clear displayed message IDs to allow fresh start
                this.displayedMessageIds.clear();

                // Reset message count and hide action buttons
                this.userMessageCount = 0;
                this.saveMessageCount();
                $('#synofex-action-buttons').hide();

                // Add welcome message
                const welcomeId = `bot-welcome-${Date.now()}`;
                this.displayedMessageIds.add(welcomeId);
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

        // Session management - FIXED: Include bot token in key to prevent cross-bot session mixing
        getSessionId: function() {
            const token = window.synofexChatConfig?.token || 'default';
            const storageKey = 'synofex_session_id_' + token.substring(0, 8); // Use first 8 chars of token
            let sessionId = localStorage.getItem(storageKey);
            if (!sessionId) {
                sessionId = 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                this.saveSessionId(sessionId);
            }
            return sessionId;
        },

        saveSessionId: function(sessionId) {
            const token = window.synofexChatConfig?.token || 'default';
            const storageKey = 'synofex_session_id_' + token.substring(0, 8);
            localStorage.setItem(storageKey, sessionId);
        },

        // Chat history management - FIXED: Bot-specific storage
        saveChatHistory: function() {
            const messages = [];
            // FIX: Changed from #synofex-messages to #synofex-chat-messages
            // FIX: Read actual message IDs from DOM data attributes to prevent duplicates
            $('#synofex-chat-messages .synofex-message').each(function() {
                let sender = 'user';
                if ($(this).hasClass('synofex-bot-message')) {
                    sender = 'bot';
                } else if ($(this).hasClass('synofex-agent-message')) {
                    sender = 'agent';
                }
                const content = $(this).find('.synofex-message-bubble').text();
                // FIX: Read the actual timestamp from data attribute (preserves full ISO date for older messages)
                const timestamp = $(this).data('timestamp') || $(this).find('.synofex-message-time').text();
                // FIX: Read the actual message ID from data attribute (preserves server's ID)
                const messageId = $(this).data('message-id') || `${sender}-${Date.now()}-${content.substring(0, 20)}`;
                messages.push({ sender, content, messageId, timestamp });
            });
            const token = window.synofexChatConfig?.token || 'default';
            const storageKey = 'synofex_chat_history_' + token.substring(0, 8);
            localStorage.setItem(storageKey, JSON.stringify(messages));
        },

        loadChatHistory: function() {
            const token = window.synofexChatConfig?.token || 'default';
            const storageKey = 'synofex_chat_history_' + token.substring(0, 8);
            const history = localStorage.getItem(storageKey);
            if (history) {
                try {
                    const messages = JSON.parse(history);
                    messages.forEach(msg => {
                        // FIX: Use the saved message ID to prevent duplicates
                        const messageId = msg.messageId || `${msg.sender}-${Date.now()}-${msg.content.substring(0, 20)}`;
                        if (!this.displayedMessageIds.has(messageId)) {
                            this.displayedMessageIds.add(messageId);
                            // FIX: Pass messageId to addMessage to preserve it
                            this.addMessage(msg.content, msg.sender, messageId);
                        }
                    });
                } catch (e) {
                    console.error('Failed to load chat history:', e);
                    // Clear corrupted history
                    localStorage.removeItem('synofex_chat_history');
                    // Show welcome message
                    const welcomeId = `bot-welcome-${Date.now()}`;
                    this.displayedMessageIds.add(welcomeId);
                    this.addMessage(this.config.welcomeMessage || 'Hello! How can I help you today?', 'bot', welcomeId);
                }
            } else {
                // Show welcome message
                const welcomeId = `bot-welcome-${Date.now()}`;
                this.displayedMessageIds.add(welcomeId);
                this.addMessage(this.config.welcomeMessage || 'Hello! How can I help you today?', 'bot', welcomeId);
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
            // FIX: Prevent concurrent requests to avoid glitching
            if (this.isCheckingMode) return;

            // Only check if we have a conversation ID
            if (!this.conversationId) {
                // Try to retrieve from localStorage
                this.conversationId = localStorage.getItem('synofex_conversation_id');
                if (!this.conversationId) return;
            }

            // Set flag to prevent concurrent requests
            this.isCheckingMode = true;

            // Call API to check conversation status
            $.ajax({
                url: this.apiUrl + '/api/conversations/' + this.conversationId,
                type: 'GET',
                success: (response) => {
                    this.isCheckingMode = false;

                    if (response.success && response.conversation) {
                        const newMode = response.conversation.mode;

                        // Check if mode changed
                        if (newMode !== this.conversationMode) {
                            const oldMode = this.conversationMode;
                            this.conversationMode = newMode;

                            // Update UI and notify visitor
                            this.handleModeChange(oldMode, newMode);
                        }

                        // FIX: Only sync messages if in Human mode (prevents unnecessary syncing)
                        if (newMode === 'Human' && response.conversation.messages && response.conversation.messages.length > 0) {
                            this.syncMessages(response.conversation.messages);
                        }
                    }
                },
                error: (xhr) => {
                    this.isCheckingMode = false;

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
                // Agent took over - show small notification
                this.addNotification('An agent has joined the conversation');
                this.updateModeIndicator('Human', 'Agent is here to help');
            } else if (newMode === 'AI') {
                // Back to AI - show small notification
                this.addNotification('You are now chatting with AI');
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
            // FIX: Use message IDs instead of text comparison to prevent glitching
            // Only add messages that haven't been displayed yet
            let newMessagesAdded = false;

            serverMessages.forEach(msg => {
                // Use server's message ID (critical for preventing duplicates!)
                const messageId = msg.id || `${msg.sender}-${msg.timestamp}-${msg.text.substring(0, 20)}`;

                // Skip if already displayed
                if (this.displayedMessageIds.has(messageId)) {
                    return;
                }

                // Handle notification messages (system notifications for mode changes)
                if (msg.type === 'notification' || msg.sender === 'system') {
                    this.displayedMessageIds.add(messageId);
                    this.addNotification(msg.text, messageId);
                    newMessagesAdded = true;
                    return;
                }

                // Only add agent messages that we haven't displayed yet
                if (msg.sender === 'agent') {
                    this.displayedMessageIds.add(messageId);
                    // FIX: Pass messageId to addMessage - this preserves server's ID!
                    this.addMessage(msg.text, 'agent', messageId);
                    newMessagesAdded = true;
                }
            });

            // Only save history if new messages were added (addMessage already saves, but being explicit)
            if (newMessagesAdded) {
                this.saveChatHistory();
            }
        },

        // Add a small notification (not a full message)
        addNotification: function(text, notificationId) {
            const messagesContainer = $('#synofex-chat-messages');
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const notificationHtml = `
                <div class="synofex-notification" data-message-id="${this.escapeHtml(notificationId || '')}">
                    <span class="synofex-notification-text">${this.escapeHtml(text)}</span>
                </div>
            `;

            messagesContainer.append(notificationHtml);
            this.scrollToBottom();
        },

        // Stop polling (cleanup)
        stopModePolling: function() {
            if (this.modePollInterval) {
                clearInterval(this.modePollInterval);
                this.modePollInterval = null;
            }
        },

        // Check if action buttons should be shown (after 5 messages)
        checkShowActionButtons: function() {
            if (this.userMessageCount >= 5) {
                $('#synofex-action-buttons').slideDown(200);
            }
        },

        // Save message count to localStorage
        saveMessageCount: function() {
            const token = window.synofexChatConfig?.token || 'default';
            const storageKey = 'synofex_message_count_' + token.substring(0, 8);
            try {
                localStorage.setItem(storageKey, this.userMessageCount.toString());
            } catch(e) {
                console.warn('Could not save message count:', e);
            }
        },

        // Load message count from localStorage
        loadMessageCount: function() {
            const token = window.synofexChatConfig?.token || 'default';
            const storageKey = 'synofex_message_count_' + token.substring(0, 8);
            try {
                const count = localStorage.getItem(storageKey);
                if (count) {
                    this.userMessageCount = parseInt(count, 10) || 0;
                    this.checkShowActionButtons();
                }
            } catch(e) {
                console.warn('Could not load message count:', e);
            }
        },

        // Disable chat when token is expired or invalid
        disableChat: function(reason) {
            console.warn('Synofex Chat: Disabled -', reason);

            // Disable input field
            $('#synofex-chat-input').prop('disabled', true).attr('placeholder', 'Chat unavailable');

            // Disable send button
            $('.synofex-send-button').prop('disabled', true).css('opacity', '0.5');

            // Stop polling
            this.stopModePolling();

            // Update status indicator
            $('.synofex-status-indicator').removeClass('synofex-status-online').addClass('synofex-status-offline').text('Offline');
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

        // Show report issue dialog - Proper form with Name, Email, Issue
        showReportDialog: function() {
            // Remove any existing overlay
            $('.synofex-report-overlay').remove();

            const formHtml = `
                <div class="synofex-report-overlay">
                    <div class="synofex-report-form">
                        <div class="synofex-report-header">
                            <h4>Report an Issue</h4>
                            <button class="synofex-report-close" type="button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="synofex-report-field">
                            <label>Name <span class="required">*</span></label>
                            <input type="text" id="synofex-report-name" placeholder="Enter your name" required>
                            <div class="error-message" style="display: none;"></div>
                        </div>
                        <div class="synofex-report-field">
                            <label>Email <span class="required">*</span></label>
                            <input type="email" id="synofex-report-email" placeholder="Enter your email" required>
                            <div class="error-message" style="display: none;"></div>
                        </div>
                        <div class="synofex-report-field">
                            <label>Issue <span class="required">*</span></label>
                            <textarea id="synofex-report-issue" placeholder="Describe your issue..." required></textarea>
                            <div class="error-message" style="display: none;"></div>
                        </div>
                        <div class="synofex-report-actions">
                            <button class="synofex-report-cancel" type="button">Cancel</button>
                            <button class="synofex-report-submit" type="button">Submit</button>
                        </div>
                    </div>
                </div>
            `;

            // Append to chat window
            $('#synofex-chat-window').append(formHtml);

            // Focus on name field
            setTimeout(() => {
                $('#synofex-report-name').focus();
            }, 100);

            // Close button handler
            $('.synofex-report-close, .synofex-report-cancel').on('click', () => {
                this.closeReportDialog();
            });

            // Submit button handler
            $('.synofex-report-submit').on('click', () => {
                this.submitReportForm();
            });

            // Close on overlay click
            $('.synofex-report-overlay').on('click', (e) => {
                if ($(e.target).hasClass('synofex-report-overlay')) {
                    this.closeReportDialog();
                }
            });

            // Enter key submits on last field
            $('#synofex-report-issue').on('keypress', (e) => {
                if (e.which === 13 && e.ctrlKey) {
                    this.submitReportForm();
                }
            });
        },

        // Close report dialog
        closeReportDialog: function() {
            $('.synofex-report-overlay').fadeOut(200, function() {
                $(this).remove();
            });
        },

        // Validate email format
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        // Submit report form with validation
        submitReportForm: function() {
            const name = $('#synofex-report-name').val().trim();
            const email = $('#synofex-report-email').val().trim();
            const issue = $('#synofex-report-issue').val().trim();

            let isValid = true;

            // Clear previous errors
            $('.synofex-report-field input, .synofex-report-field textarea').removeClass('error');
            $('.synofex-report-field .error-message').hide().text('');

            // Validate name
            if (!name) {
                $('#synofex-report-name').addClass('error');
                $('#synofex-report-name').siblings('.error-message').text('Name is required').show();
                isValid = false;
            }

            // Validate email
            if (!email) {
                $('#synofex-report-email').addClass('error');
                $('#synofex-report-email').siblings('.error-message').text('Email is required').show();
                isValid = false;
            } else if (!this.isValidEmail(email)) {
                $('#synofex-report-email').addClass('error');
                $('#synofex-report-email').siblings('.error-message').text('Please enter a valid email address').show();
                isValid = false;
            }

            // Validate issue
            if (!issue) {
                $('#synofex-report-issue').addClass('error');
                $('#synofex-report-issue').siblings('.error-message').text('Issue description is required').show();
                isValid = false;
            }

            if (!isValid) return;

            // Disable submit button
            $('.synofex-report-submit').prop('disabled', true).text('Submitting...');

            $.ajax({
                url: synofex_config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_report_issue',
                    nonce: synofex_config.nonce,
                    bot_id: this.botId,
                    issue_type: 'general',
                    name: name,
                    email: email,
                    description: issue,
                    conversation_id: this.conversationId
                },
                success: (response) => {
                    this.closeReportDialog();
                    if (response.success) {
                        this.addNotification('Thank you! Your issue has been reported.');
                    } else {
                        this.addNotification('Failed to report issue. Please try again.');
                    }
                },
                error: () => {
                    this.closeReportDialog();
                    this.addNotification('Failed to report issue. Please try again.');
                }
            });
        },

        // Request human agent - Shows notification instead of popup
        requestHumanAgent: function() {
            // Show immediate notification
            this.addNotification('Connecting you to a human agent...');

            $.ajax({
                url: synofex_config.ajax_url,
                type: 'POST',
                data: {
                    action: 'synofex_request_human',
                    nonce: synofex_config.nonce,
                    bot_id: this.botId,
                    conversation_id: this.conversationId,
                    reason: 'Requested human assistance'
                },
                success: (response) => {
                    if (response.success) {
                        this.addNotification('A human agent will assist you shortly');
                    } else {
                        this.addNotification('Human agents unavailable. Please try again later.');
                    }
                },
                error: () => {
                    this.addNotification('Failed to connect. Please try again later.');
                }
            });
        },

        // End chat - Closes current session and starts fresh on next message
        endChat: function() {
            if (confirm('Are you sure you want to end this chat?')) {
                // Call API to mark conversation as completed (if we have a conversation ID)
                if (this.conversationId) {
                    this.closeConversationOnServer(this.conversationId);
                }

                // Clear chat UI
                $('#synofex-chat-messages').empty();

                // Clear all session data - CRITICAL: Generate NEW sessionId for next conversation
                const token = window.synofexChatConfig?.token || 'default';
                const storageKey = 'synofex_session_id_' + token.substring(0, 8);
                const historyKey = 'synofex_chat_history_' + token.substring(0, 8);

                // Remove old session and generate new one
                localStorage.removeItem(storageKey);
                localStorage.removeItem(historyKey);
                localStorage.removeItem('synofex_conversation_id');

                // Generate NEW session ID for next conversation
                this.sessionId = 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                this.saveSessionId(this.sessionId);

                // Clear conversation tracking
                this.conversationId = null;
                this.displayedMessageIds.clear();
                this.userMessageCount = 0;
                this.saveMessageCount();
                $('#synofex-action-buttons').hide();

                // Reset mode to AI
                this.conversationMode = 'AI';
                $('.synofex-mode-indicator').remove();

                // Add welcome message for new session
                const welcomeId = `bot-welcome-${Date.now()}`;
                this.displayedMessageIds.add(welcomeId);
                this.addMessage(this.config.welcomeMessage || 'Hello! How can I help you today?', 'bot', welcomeId);

                // Close chat window
                this.closeChat();

                console.log('Synofex Chat: Session ended. New session ID:', this.sessionId);
            }
        },

        // Close conversation on server (mark as completed)
        closeConversationOnServer: function(conversationId) {
            // Call API to close conversation - fire and forget
            $.ajax({
                url: this.apiUrl + '/api/conversations/' + conversationId + '/close',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    status: 'completed',
                    reason: 'User ended chat'
                }),
                success: (response) => {
                    console.log('Synofex Chat: Conversation closed on server');
                },
                error: (xhr) => {
                    // Silently fail - not critical
                    console.log('Synofex Chat: Could not close conversation on server');
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