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
                
                // Backend configuration - Your existing backend setup
                this.backendURL = 'http://localhost:3001';
                this.userId = this.generateUserId();
                
                this.init();
                this.initVoice();
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
                        this.voiceVisualizer.classList.add('active');
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
                        this.voiceVisualizer.classList.remove('active');
                        this.messageInput.placeholder = 'Type or speak your message...';
                    };

                    this.recognition.onerror = (event) => {
                        console.error('Speech recognition error:', event.error);
                        this.isRecording = false;
                        this.voiceInputBtn.classList.remove('recording');
                        this.voiceVisualizer.classList.remove('active');
                        this.messageInput.placeholder = 'Type or speak your message...';
                        this.addMessage("Voice input failed. Please try again or type your message.", 'bot');
                    };
                } else {
                    this.voiceInputBtn.style.display = 'none';
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
                
                this.synthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.volume = 0.8;
                
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
                
                this.synthesis.speak(utterance);
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
                const emojis = ['😊', '👍', '❤️', '😄', '🎉', '✅', '⭐', '🚀', '💡', '🔥'];
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
                
                this.addMessage(message, 'user');
                this.messageInput.value = '';
                this.adjustTextareaHeight();
                
                this.showTypingIndicator();
                
                const response = await this.getBotResponse(message);
                this.hideTypingIndicator();
                this.addMessage(response, 'bot');
                this.speak(response);
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
                
                this.chatHistory.push({ sender, text, time: this.getCurrentTime() });
            }
            
            showTypingIndicator() {
                if (this.typingIndicatorElement) return;
                this.isTyping = true;
                this.sendBtn.disabled = true;
                
                this.typingIndicatorElement = document.createElement('div');
                this.typingIndicatorElement.className = 'typing-indicator';
                
                this.typingIndicatorElement.innerHTML = `
                    <div class="bot-avatar" style="width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;">
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
                    const response = await fetch(`${this.backendURL}/api/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: userMessage,
                            userId: this.userId,
                            chatHistory: this.chatHistory
                        })
                    });

                    console.log('📡 Response status:', response.status);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('✅ Backend response:', data);
                    
                    if (data.success) {
                        return data.response;
                    } else {
                        return data.message || 'Backend returned an error without a specific message.';
                    }
                    
                } catch (error) {
                    console.error('❌ Connection error:', error);
                    
                    return `Sorry, I'm having connection issues right now. 😔 Error: ${error.message}`;
                }
            }
            
            scrollToBottom() {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            new ChatBot();
        });