// // AI Chatbot Frontend JavaScript
// class AIChatbot {
//     constructor() {
//         this.messages = [];
//         this.isTyping = false;
//         this.apiBaseUrl = window.location.origin;
//         this.userId = this.generateUserId();
        
//         this.initializeElements();
//         this.attachEventListeners();
//         this.loadTheme();
//         this.checkConnection();
//     }

//     initializeElements() {
//         this.chatMessages = document.getElementById('chatMessages');
//         this.messageInput = document.getElementById('messageInput');
//         this.sendButton = document.getElementById('sendButton');
//         this.typingIndicator = document.getElementById('typingIndicator');
//         this.clearChatBtn = document.getElementById('clearChat');
//         this.themeToggle = document.getElementById('themeToggle');
//         this.charCount = document.getElementById('charCount');
//         this.connectionStatus = document.getElementById('connectionStatus');
//         this.loadingOverlay = document.getElementById('loadingOverlay');
//         this.errorModal = document.getElementById('errorModal');
//         this.errorMessage = document.getElementById('errorMessage');
//         this.retryConnection = document.getElementById('retryConnection');
//         this.closeErrorModal = document.getElementById('closeErrorModal');
//         this.closeModal = document.getElementById('closeModal');
//     }

//     attachEventListeners() {
//         // Send message events
//         this.sendButton.addEventListener('click', () => this.sendMessage());
//         this.messageInput.addEventListener('keydown', (e) => {
//             if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 this.sendMessage();
//             }
//         });

//         // Auto-resize textarea
//         this.messageInput.addEventListener('input', () => {
//             this.autoResizeTextarea();
//             this.updateCharCount();
//         });

//         // Clear chat
//         this.clearChatBtn.addEventListener('click', () => this.clearChat());

//         // Theme toggle
//         this.themeToggle.addEventListener('click', () => this.toggleTheme());

//         // Modal events
//         this.closeErrorModal.addEventListener('click', () => this.hideErrorModal());
//         this.closeModal.addEventListener('click', () => this.hideErrorModal());
//         this.retryConnection.addEventListener('click', () => this.checkConnection());

//         // Close modal on outside click
//         this.errorModal.addEventListener('click', (e) => {
//             if (e.target === this.errorModal) {
//                 this.hideErrorModal();
//             }
//         });

//         // Load saved messages on page load
//         window.addEventListener('load', () => {
//             this.loadSavedMessages();
//         });
//     }

//     generateUserId() {
//         return 'user_' + Math.random().toString(36).substr(2, 9);
//     }

//     async sendMessage() {
//         const message = this.messageInput.value.trim();
//         if (!message || this.isTyping) return;

//         // Add user message to chat
//         this.addMessage(message, 'user');
//         this.messageInput.value = '';
//         this.autoResizeTextarea();
//         this.updateCharCount();

//         // Show typing indicator
//         this.showTypingIndicator();

//         try {
//             // Prepare conversation history
//             const conversationHistory = this.messages.map(msg => ({
//                 role: msg.role,
//                 content: msg.content
//             }));

//             // Send to API
//             const response = await this.callAPI('/api/chat-with-history', {
//                 messages: conversationHistory,
//                 userId: this.userId
//             });

//             if (response.success) {
//                 this.addMessage(response.response, 'bot');
//             } else {
//                 throw new Error(response.error || 'Failed to get response');
//             }

//         } catch (error) {
//             console.error('Error sending message:', error);
//             this.addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'bot', true);
//             this.showErrorModal('Connection Error', 'Unable to connect to the AI service. Please check your connection and try again.');
//         } finally {
//             this.hideTypingIndicator();
//         }
//     }

//     async callAPI(endpoint, data) {
//         const response = await fetch(this.apiBaseUrl + endpoint, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(data)
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         return await response.json();
//     }

//     addMessage(content, role, isError = false) {
//         const message = {
//             id: Date.now(),
//             content: content,
//             role: role,
//             timestamp: new Date(),
//             isError: isError
//         };

//         this.messages.push(message);
//         this.renderMessage(message);
//         this.saveMessages();
//         this.scrollToBottom();
//     }

//     renderMessage(message) {
//         const messageElement = document.createElement('div');
//         messageElement.className = `message ${message.role}-message new-message`;
//         if (message.isError) {
//             messageElement.classList.add('error-message');
//         }

//         const avatarIcon = message.role === 'user' ? 'fas fa-user' : 'fas fa-robot';
//         const timeString = this.formatTime(message.timestamp);

//         messageElement.innerHTML = `
//             <div class="message-avatar">
//                 <i class="${avatarIcon}"></i>
//             </div>
//             <div class="message-content">
//                 <div class="message-text">
//                     <p>${this.escapeHtml(message.content)}</p>
//                 </div>
//                 <div class="message-time">${timeString}</div>
//             </div>
//         `;

//         this.chatMessages.appendChild(messageElement);

//         // Remove new-message class after animation
//         setTimeout(() => {
//             messageElement.classList.remove('new-message');
//         }, 300);
//     }

//     showTypingIndicator() {
//         this.isTyping = true;
//         this.typingIndicator.style.display = 'block';
//         this.scrollToBottom();
//     }

//     hideTypingIndicator() {
//         this.isTyping = false;
//         this.typingIndicator.style.display = 'none';
//     }

//     clearChat() {
//         if (this.messages.length <= 1) return; // Keep welcome message

//         if (confirm('Are you sure you want to clear the chat history?')) {
//             // Keep only the welcome message
//             const welcomeMessage = this.messages.find(msg => 
//                 msg.role === 'bot' && 
//                 msg.content.includes('Hello! I\'m your AI assistant')
//             );

//             this.messages = welcomeMessage ? [welcomeMessage] : [];
//             this.chatMessages.innerHTML = '';
            
//             if (welcomeMessage) {
//                 this.renderMessage(welcomeMessage);
//             }
            
//             this.saveMessages();
//         }
//     }

//     toggleTheme() {
//         const currentTheme = document.documentElement.getAttribute('data-theme');
//         const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
//         document.documentElement.setAttribute('data-theme', newTheme);
//         localStorage.setItem('theme', newTheme);
        
//         // Update theme toggle icon
//         const icon = this.themeToggle.querySelector('i');
//         icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
//     }

//     loadTheme() {
//         const savedTheme = localStorage.getItem('theme') || 'light';
//         document.documentElement.setAttribute('data-theme', savedTheme);
        
//         const icon = this.themeToggle.querySelector('i');
//         icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
//     }

//     async checkConnection() {
//         try {
//             this.showLoading();
//             const response = await fetch(this.apiBaseUrl + '/api/test');
//             const data = await response.json();
            
//             if (data.hasApiKey) {
//                 this.updateConnectionStatus(true);
//                 this.hideErrorModal();
//             } else {
//                 throw new Error('API key not configured');
//             }
//         } catch (error) {
//             console.error('Connection check failed:', error);
//             this.updateConnectionStatus(false);
//             this.showErrorModal('Connection Error', 'Unable to connect to the server. Please check if the backend is running.');
//         } finally {
//             this.hideLoading();
//         }
//     }

//     updateConnectionStatus(connected) {
//         const statusElement = this.connectionStatus;
//         const icon = statusElement.querySelector('i');
        
//         if (connected) {
//             statusElement.classList.remove('disconnected');
//             statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
//         } else {
//             statusElement.classList.add('disconnected');
//             statusElement.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
//         }
//     }

//     showErrorModal(title, message) {
//         this.errorMessage.textContent = message;
//         this.errorModal.classList.add('show');
//     }

//     hideErrorModal() {
//         this.errorModal.classList.remove('show');
//     }

//     showLoading() {
//         this.loadingOverlay.style.display = 'flex';
//     }

//     hideLoading() {
//         this.loadingOverlay.style.display = 'none';
//     }

//     autoResizeTextarea() {
//         const textarea = this.messageInput;
//         textarea.style.height = 'auto';
//         textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
//     }

//     updateCharCount() {
//         const count = this.messageInput.value.length;
//         this.charCount.textContent = `${count}/8000`;
        
//         // Change color when approaching limit
//         if (count > 7000) {
//             this.charCount.style.color = 'var(--warning-color)';
//         } else if (count > 7500) {
//             this.charCount.style.color = 'var(--error-color)';
//         } else {
//             this.charCount.style.color = 'var(--text-muted)';
//         }
//     }

//     scrollToBottom() {
//         setTimeout(() => {
//             this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
//         }, 100);
//     }

//     formatTime(date) {
//         const now = new Date();
//         const diff = now - date;
        
//         if (diff < 60000) { // Less than 1 minute
//             return 'Just now';
//         } else if (diff < 3600000) { // Less than 1 hour
//             const minutes = Math.floor(diff / 60000);
//             return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
//         } else if (diff < 86400000) { // Less than 1 day
//             const hours = Math.floor(diff / 3600000);
//             return `${hours} hour${hours > 1 ? 's' : ''} ago`;
//         } else {
//             return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//         }
//     }

//     escapeHtml(text) {
//         const div = document.createElement('div');
//         div.textContent = text;
//         return div.innerHTML;
//     }

//     saveMessages() {
//         try {
//             localStorage.setItem('chatbot_messages', JSON.stringify(this.messages));
//         } catch (error) {
//             console.error('Failed to save messages:', error);
//         }
//     }

//     loadSavedMessages() {
//         try {
//             const saved = localStorage.getItem('chatbot_messages');
//             if (saved) {
//                 const parsedMessages = JSON.parse(saved);
//                 this.messages = parsedMessages.map(msg => ({
//                     ...msg,
//                     timestamp: new Date(msg.timestamp)
//                 }));
                
//                 // Clear current messages and render saved ones
//                 this.chatMessages.innerHTML = '';
//                 this.messages.forEach(msg => this.renderMessage(msg));
//             }
//         } catch (error) {
//             console.error('Failed to load saved messages:', error);
//         }
//     }
// }

// // Initialize the chatbot when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     window.chatbot = new AIChatbot();
// });

// // Handle page visibility changes to update timestamps
// document.addEventListener('visibilitychange', () => {
//     if (document.visibilityState === 'visible' && window.chatbot) {
//         // Update timestamps when page becomes visible
//         const timeElements = document.querySelectorAll('.message-time');
//         timeElements.forEach((element, index) => {
//             if (window.chatbot.messages[index]) {
//                 element.textContent = window.chatbot.formatTime(window.chatbot.messages[index].timestamp);
//             }
//         });
//     }
// });

// // Handle beforeunload to save messages
// window.addEventListener('beforeunload', () => {
//     if (window.chatbot) {
//         window.chatbot.saveMessages();
//     }
// }); 





    class AIChatbot {
        constructor() {
            this.messages = [];
            this.isTyping = false;
            // This will correctly point to your server (e.g., http://localhost:3000)
            this.apiBaseUrl = window.location.origin; 
            this.userId = this.getOrGenerateUserId();
            
            this.initializeElements();
            this.attachEventListeners();
            this.loadTheme();
            this.loadSavedMessages();
            this.checkConnection();
            this.updateCharCount();
        }

        initializeElements() {
            // Main chat elements
            this.chatMessages = document.getElementById('chatMessages');
            this.chatForm = document.getElementById('chatForm');
            this.messageInput = document.getElementById('messageInput');
            this.sendButton = document.getElementById('sendButton');
            this.typingIndicator = document.getElementById('typingIndicator');
            this.clearChatBtn = document.getElementById('clearChat');
            this.exportChatBtn = document.getElementById('exportChat');
            
            // Header & Footer elements
            this.themeToggle = document.getElementById('themeToggle');
            this.themeIconLight = document.getElementById('theme-icon-light');
            this.themeIconDark = document.getElementById('theme-icon-dark');
            this.charCount = document.getElementById('charCount');
            this.connectionStatus = document.getElementById('connectionStatus');
            this.attachFileBtn = document.getElementById('attachFile');
            this.voiceInputBtn = document.getElementById('voiceInput');
            
            // Modals
            this.loadingOverlay = document.getElementById('loadingOverlay');
            this.errorModal = document.getElementById('errorModal');
            this.errorMessage = document.getElementById('errorMessage');
            this.retryConnection = document.getElementById('retryConnection');
            this.closeModal = document.getElementById('closeModal');
            
            // Confirmation Modal
            this.confirmModal = document.getElementById('confirmModal');
            this.confirmTitle = document.getElementById('confirmTitle');
            this.confirmMessage = document.getElementById('confirmMessage');
            this.confirmOk = document.getElementById('confirmOk');
            this.confirmCancel = document.getElementById('confirmCancel');
        }

        attachEventListeners() {
            this.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });

            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.messageInput.addEventListener('input', () => {
                this.autoResizeTextarea();
                this.updateCharCount();
            });

            this.clearChatBtn.addEventListener('click', () => this.confirmClearChat());
            this.exportChatBtn.addEventListener('click', () => this.exportChat());
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
            this.attachFileBtn.addEventListener('click', () => this.handleFileAttachment());
            this.voiceInputBtn.addEventListener('click', () => this.handleVoiceInput());

            // Modal events
            this.closeModal.addEventListener('click', () => this.hideErrorModal());
            this.retryConnection.addEventListener('click', () => this.checkConnection());
            this.errorModal.addEventListener('click', (e) => {
                if (e.target === this.errorModal) this.hideErrorModal();
            });
            
            this.confirmCancel.addEventListener('click', () => this.hideConfirmModal());
            this.confirmModal.addEventListener('click', (e) => {
                if (e.target === this.confirmModal) this.hideConfirmModal();
            });
        }

        // --- CORE CHAT LOGIC ---

        async sendMessage() {
            const content = this.messageInput.value.trim();
            if (content === '' || this.isTyping) return;

            const userMessage = { role: 'user', content, timestamp: new Date().toISOString() };
            this.messages.push(userMessage);
            this.addMessageToDOM(userMessage);
            this.saveMessages();

            this.messageInput.value = '';
            this.autoResizeTextarea();
            this.updateCharCount();

            this.setTyping(true);

            try {
                // Prepare conversation history exactly as your backend expects
                const conversationHistory = this.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                
                // Call your specific API endpoint with the correct payload
                const response = await fetch(`${this.apiBaseUrl}/api/chat-with-history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: conversationHistory,
                        userId: this.userId
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    const aiResponse = { 
                        role: 'ai', 
                        content: data.response,
                        timestamp: new Date().toISOString()
                    };
                    this.messages.push(aiResponse);
                    this.addMessageToDOM(aiResponse);
                    this.saveMessages();
                } else {
                    throw new Error(data.error || 'Failed to get a valid response from the API.');
                }

            } catch (error) {
                console.error("Failed to send message:", error);
                const errorMessage = {
                    role: 'ai',
                    content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
                    timestamp: new Date().toISOString()
                };
                this.addMessageToDOM(errorMessage);
            } finally {
                this.setTyping(false);
            }
        }
        
        setTyping(state) {
            this.isTyping = state;
            this.typingIndicator.classList.toggle('hidden', !state);
            if (state) this.scrollToBottom();
        }

        // --- CONNECTION & HEALTH CHECK ---
        
        async checkConnection() {
            this.loadingOverlay.classList.remove('hidden');
            this.hideErrorModal();
            try {
                // Call your specific test endpoint
                const response = await fetch(`${this.apiBaseUrl}/api/test`);
                if (!response.ok) throw new Error('Service not available or endpoint not found.');
                
                const data = await response.json();
                
                // Check for the specific success condition from your backend
                if (data.hasApiKey) {
                    this.updateConnectionStatus('success', 'Connected');
                } else {
                    throw new Error('API key not configured on the backend.');
                }
            } catch (error) {
                console.error("Connection check failed:", error);
                this.updateConnectionStatus('error', 'Connection Failed');
                this.showErrorModal(error.message);
            } finally {
                this.loadingOverlay.classList.add('hidden');
            }
        }
        
        updateConnectionStatus(status, text) {
            const statusDot = this.connectionStatus.querySelector('span:first-child');
            const statusText = this.connectionStatus.querySelector('span:last-child');
            
            statusDot.className = 'w-2 h-2 rounded-full'; // Reset classes
            if (status === 'success') {
                statusDot.classList.add('bg-green-500');
            } else if (status === 'error') {
                statusDot.classList.add('bg-red-500');
            } else {
                statusDot.classList.add('bg-yellow-500');
            }
            statusText.textContent = text;
        }

        // --- FEATURE IMPLEMENTATIONS ---

        exportChat() {
            if (this.messages.length === 0) {
                this.showToast('No messages to export.', 'warning');
                return;
            }

            const chatData = {
                exportDate: new Date().toISOString(),
                totalMessages: this.messages.length,
                messages: this.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            };

            const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStamp = new Date().toISOString().slice(0, 10);
            a.download = `chat-export-${dateStamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast('Chat exported successfully!', 'success');
        }

        confirmClearChat() {
            if (this.messages.length === 0) {
                this.showToast('Chat is already empty.', 'info');
                return;
            }
            this.showConfirmModal(
                'Clear Chat History?',
                'This will permanently delete all messages in this conversation.',
                () => this.clearChat()
            );
        }
        
        clearChat() {
            this.messages = [];
            this.chatMessages.innerHTML = '';
            localStorage.removeItem(`chatMessages_${this.userId}`);
            this.addWelcomeMessage();
            this.showToast('Chat history cleared.', 'success');
            this.autoResizeTextarea();
        }

        handleFileAttachment() {
            this.showToast('File attachment is not yet implemented.', 'info');
        }
        
        handleVoiceInput() {
            this.showToast('Voice input is not yet implemented.', 'info');
        }
        
        toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            this.updateThemeIcons(isDark);
        }

        loadTheme() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
            
            document.documentElement.classList.toggle('dark', isDark);
            this.updateThemeIcons(isDark);
        }

        updateThemeIcons(isDark) {
            this.themeIconLight.classList.toggle('hidden', isDark);
            this.themeIconDark.classList.toggle('hidden', !isDark);
        }

        // --- UI & DOM MANIPULATION ---

        autoResizeTextarea() {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = `${Math.min(this.messageInput.scrollHeight, 160)}px`;
        }

        updateCharCount() {
            const count = this.messageInput.value.length;
            const max = this.messageInput.maxLength;
            this.charCount.textContent = `${count}/${max}`;
            this.sendButton.disabled = count === 0;
        }
        
        addMessageToDOM(message) {
            const isUser = message.role === 'user';
            const messageWrapper = document.createElement('div');
            messageWrapper.classList.add('animate-fade-in', 'flex', 'items-start', 'gap-3', 'my-4');
            if (isUser) {
                messageWrapper.classList.add('justify-end');
            }

            const sanitizedContent = message.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');

            const messageHTML = `
                ${!isUser ? `
                <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex-shrink-0 shadow-md">
                    <svg class="w-5 h-5 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                </div>` : ''}
                <div class="message-hover max-w-md md:max-w-lg lg:max-w-xl p-4 rounded-2xl shadow-lg border ${
                    isUser 
                    ? 'bg-blue-500/90 dark:bg-blue-600/90 text-white rounded-br-lg' 
                    : 'bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-bl-lg border-slate-200/50 dark:border-slate-600/50'
                }">
                    <p class="text-base leading-relaxed">${sanitizedContent}</p>
                </div>
                ${isUser ? `
                <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex-shrink-0 shadow-md">
                    <svg class="w-5 h-5 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                </div>` : ''}
            `;

            messageWrapper.innerHTML = messageHTML;
            this.chatMessages.appendChild(messageWrapper);
            this.scrollToBottom();
        }

        scrollToBottom() {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }

        // --- PERSISTENCE ---

        saveMessages() {
            localStorage.setItem(`chatMessages_${this.userId}`, JSON.stringify(this.messages));
        }

        loadSavedMessages() {
            const savedMessages = localStorage.getItem(`chatMessages_${this.userId}`);
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages);
                this.chatMessages.innerHTML = '';
                this.messages.forEach(msg => this.addMessageToDOM(msg));
            } else {
                this.addWelcomeMessage();
            }
        }
        
        addWelcomeMessage() {
             const welcomeMessage = {
                role: 'ai',
                content: "Hello! I'm your AI Assistant. How can I help you today?",
                timestamp: new Date().toISOString()
            };
            this.messages.push(welcomeMessage);
            this.addMessageToDOM(welcomeMessage);
            this.saveMessages();
        }

        // --- UTILITIES & HELPERS ---
        
        getOrGenerateUserId() {
            let userId = localStorage.getItem('chatbot_userId');
            if (!userId) {
                userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('chatbot_userId', userId);
            }
            return userId;
        }

        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.className = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white font-semibold animate-fade-in z-50';

            const colors = {
                info: 'bg-blue-500',
                success: 'bg-green-500',
                warning: 'bg-yellow-500',
                error: 'bg-red-500',
            };
            toast.classList.add(colors[type] || colors.info);
            
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.transition = 'opacity 0.5s ease';
                toast.style.opacity = '0';
                setTimeout(() => document.body.removeChild(toast), 500);
            }, 3000);
        }
        
        showErrorModal(message) {
            this.errorMessage.textContent = message;
            this.errorModal.classList.remove('hidden');
        }
        hideErrorModal() {
            this.errorModal.classList.add('hidden');
        }

        showConfirmModal(title, message, onConfirm) {
            this.confirmTitle.textContent = title;
            this.confirmMessage.textContent = message;
            
            const newConfirmOk = this.confirmOk.cloneNode(true);
            this.confirmOk.parentNode.replaceChild(newConfirmOk, this.confirmOk);
            this.confirmOk = newConfirmOk;

            this.confirmOk.addEventListener('click', () => {
                onConfirm();
                this.hideConfirmModal();
            }, { once: true });

            this.confirmModal.classList.remove('hidden');
        }
        hideConfirmModal() {
            this.confirmModal.classList.add('hidden');
        }
    }

    // Initialize the chatbot
    document.addEventListener('DOMContentLoaded', () => {
        new AIChatbot();
    });