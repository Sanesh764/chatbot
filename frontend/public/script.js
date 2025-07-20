class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.actionBtns = document.querySelectorAll('.action-btn');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.voiceInputBtn = document.getElementById('voiceInputBtn');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.voiceVisualizer = document.getElementById('voiceVisualizer');
        
        this.chatHistory = [];
        this.isTyping = false;
        this.isVoiceEnabled = true;
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        // ✅ FIXED: Dynamic backend URL configuration
        this.backendURL = this.getBackendURL();
        this.userId = this.generateUserId();
        
        this.init();
        this.initVoice();
        this.checkBackendConnection();
    }
    
    // 🚀 NEW: Dynamic backend URL detection
    getBackendURL() {
        const hostname = window.location.hostname;
        
        // Production: Use your Render deployed URL
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // Replace with your actual Render service URL
            return 'https://your-chatbot-service-name.onrender.com';
        }
        
        // Development: Use localhost
        return 'http://localhost:3001';
    }
    
    // 🚀 NEW: Check backend connection on startup
    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.backendURL}/health`, {
                method: 'GET',
                timeout: 10000
            });
            
            if (response.ok) {
                console.log('✅ Backend connection successful');
                this.addSystemMessage('🟢 Connected to AI service');
            } else {
                throw new Error('Backend health check failed');
            }
        } catch (error) {
            console.warn('⚠️ Backend connection issue:', error);
            this.addSystemMessage('🟡 Limited connectivity - some features may be slower');
        }
    }
    
    // 🚀 NEW: System messages for user feedback
    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.innerHTML = `
            <div style="color: #888; font-size: 0.8em; text-align: center; padding: 5px;">
                ${message}
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Auto-remove system message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    init() {
        // Set welcome time
        document.getElementById('welcomeTime').textContent = this.getCurrentTime();
        
        // Event listeners
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());
        
        this.actionBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
        });
        
        this.emojiBtn.addEventListener('click', () => this.insertEmoji());
        this.voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.voiceToggle.addEventListener('click', () => this.toggleVoiceResponse());
        
        // Focus on input
        this.messageInput.focus();
        
        // 🚀 NEW: Add initial welcome message
        setTimeout(() => {
            this.addMessage("Hi there! 👋 I'm your AI assistant. How can I help you today?", 'bot');
        }, 1000);
    }

    initVoice() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.voiceInputBtn.classList.add('recording');
                if (this.voiceVisualizer) this.voiceVisualizer.classList.add('active');
                this.messageInput.placeholder = 'Listening... Speak now!';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.adjustTextareaHeight();
                this.messageInput.focus();
                this.messageInput.placeholder = 'Type or speak your message...';
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                this.voiceInputBtn.classList.remove('recording');
                if (this.voiceVisualizer) this.voiceVisualizer.classList.remove('active');
                this.messageInput.placeholder = 'Type or speak your message...';
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                this.voiceInputBtn.classList.remove('recording');
                if (this.voiceVisualizer) this.voiceVisualizer.classList.remove('active');
                this.messageInput.placeholder = 'Type or speak your message...';
                this.addMessage("Voice input failed. Please try again or type your message.", 'bot');
            };
        } else {
            if (this.voiceInputBtn) this.voiceInputBtn.style.display = 'none';
            console.warn('Speech recognition not supported in this browser.');
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.addMessage("Your browser doesn't support voice input.", 'bot');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    toggleVoiceResponse() {
        this.isVoiceEnabled = !this.isVoiceEnabled;
        const icon = this.voiceToggle.querySelector('i');
        
        if (this.isVoiceEnabled) {
            icon.className = 'fas fa-volume-up';
            this.voiceToggle.style.background = 'rgba(255, 255, 255, 0.25)';
            this.speak("Voice output enabled.");
        } else {
            icon.className = 'fas fa-volume-mute';
            this.voiceToggle.style.background = 'rgba(255, 0, 0, 0.3)';
            this.synthesis.cancel();
        }
    }

    speak(text) {
        if (!this.isVoiceEnabled) return;
        
        // Clean text for better speech
        const cleanText = text.replace(/[*_~`#]/g, '').replace(/\n+/g, ' ');
        
        this.synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Wait for voices to load
        const setVoice = () => {
            const voices = this.synthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.lang === 'en-US' && 
                (voice.name.includes('Google') || voice.name.includes('Samantha') || voice.name.includes('Female'))
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            } else if (voices.length > 0) {
                utterance.voice = voices.find(voice => voice.lang === 'en-US') || voices[0];
            }
        };
        
        if (this.synthesis.getVoices().length === 0) {
            this.synthesis.onvoiceschanged = () => {
                setVoice();
                this.synthesis.speak(utterance);
            };
        } else {
            setVoice();
            this.synthesis.speak(utterance);
        }
    }
    
    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
        }
    }
    
    handleQuickAction(action) {
        this.messageInput.value = action;
        this.messageInput.focus();
        this.adjustTextareaHeight();
        this.handleSend();
    }
    
    insertEmoji() {
        const emojis = ['😊', '👍', '❤️', '😄', '🎉', '✅', '⭐', '🚀', '💡', '🔥', '🤖', '💬', '🌟', '✨'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const start = this.messageInput.selectionStart;
        const end = this.messageInput.selectionEnd;
        const currentValue = this.messageInput.value;
        
        this.messageInput.value = currentValue.substring(0, start) + randomEmoji + currentValue.substring(end);
        this.messageInput.selectionStart = this.messageInput.selectionEnd = start + randomEmoji.length;
        
        this.messageInput.focus();
        this.adjustTextareaHeight();
    }
    
    async handleSend() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // ✅ IMPROVED: Input validation
        if (message.length > 8000) {
            this.addMessage("Message too long! Please keep it under 8000 characters.", 'bot');
            return;
        }
        
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.adjustTextareaHeight();
        
        this.showTypingIndicator();
        
        const response = await this.getBotResponse(message);
        this.hideTypingIndicator();
        this.addMessage(response, 'bot');
        
        // Only speak if response is successful (not error message)
        if (!response.includes('connection issues') && !response.includes('Error:')) {
            this.speak(response);
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.textContent = text;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store in chat history for context
        this.chatHistory.push({ 
            role: sender === 'user' ? 'user' : 'assistant',
            content: text, 
            time: this.getCurrentTime() 
        });
        
        // Limit chat history to last 20 messages for performance
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(-20);
        }
    }
    
    showTypingIndicator() {
        if (this.typingIndicatorElement) return;
        this.isTyping = true;
        this.sendBtn.disabled = true;
        
        this.typingIndicatorElement = document.createElement('div');
        this.typingIndicatorElement.className = 'typing-indicator';
        
        this.typingIndicatorElement.innerHTML = `
            <div class="bot-avatar" style="width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2);">
                <i class="fas fa-robot text-white text-md"></i>
            </div>
            <span>Assistant is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.chatMessages.appendChild(this.typingIndicatorElement);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        if (this.typingIndicatorElement) {
            this.typingIndicatorElement.remove();
            this.typingIndicatorElement = null;
        }
        this.isTyping = false;
        this.sendBtn.disabled = false;
    }
    
    async getBotResponse(userMessage) {
        console.log('🚀 Sending to backend:', userMessage);
        
        try {
            // ✅ IMPROVED: Use chat history endpoint for better conversations
            const endpoint = this.chatHistory.length > 1 ? '/api/chat-with-history' : '/api/chat';
            const payload = this.chatHistory.length > 1 
                ? {
                    messages: this.chatHistory,
                    userId: this.userId
                  }
                : {
                    message: userMessage,
                    userId: this.userId
                  };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(`${this.backendURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Backend response:', data);
            
            if (data.success) {
                return data.response;
            } else {
                return data.error || 'Sorry, I encountered an issue. Please try again.';
            }
            
        } catch (error) {
            console.error('❌ Connection error:', error);
            
            if (error.name === 'AbortError') {
                return "Sorry, that request took too long. Please try asking something simpler. ⏱️";
            }
            
            // More user-friendly error messages
            if (error.message.includes('Failed to fetch')) {
                return "I'm having trouble connecting to my server. Please check your internet connection and try again. 🌐";
            }
            
            return `I'm experiencing some technical difficulties right now. Please try again in a moment. 🔧`;
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});
