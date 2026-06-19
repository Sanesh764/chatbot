import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  
  // Theme state
  const [theme, setTheme] = useState('light');
  
  // Modal states
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Scroll and input references
  const chatMessagesRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize chatbot
  useEffect(() => {
    loadTheme();
    
    // Get or generate userId
    let uId = localStorage.getItem('chatbot_userId');
    if (!uId) {
      uId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('chatbot_userId', uId);
    }
    setUserId(uId);

    // Get or generate sessionId
    let sId = localStorage.getItem('chatbot_sessionId');
    if (!sId) {
      sId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('chatbot_sessionId', sId);
    }
    setSessionId(sId);

    const initializeChat = async () => {
      const conn = await checkConnection(true);
      const currentDbStatus = conn.dbConnected ? 'online' : 'offline';
      await loadSavedMessages(uId, sId, currentDbStatus);
    };

    initializeChat();
  }, []);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Auto-resize message textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Connection/health check
  const checkConnection = async (showOverlay = false) => {
    if (showOverlay) setDbStatus('connecting');
    try {
      const response = await fetch('/api/test');
      if (!response.ok) throw new Error('API server returned error');
      
      const data = await response.json();
      
      if (data.databaseConnected) {
        setDbStatus('online');
        return { apiConnected: true, dbConnected: true };
      } else {
        setDbStatus('offline');
        showToast('Database is offline. Falling back to local storage history.', 'warning');
        return { apiConnected: true, dbConnected: false };
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setDbStatus('offline');
      setErrorMessage('Unable to connect to the backend server. Running in offline fallback mode.');
      setIsErrorOpen(true);
      return { apiConnected: false, dbConnected: false };
    }
  };

  // Load chat history from DB or LocalStorage fallback
  const loadSavedMessages = async (uId, sId, currentDbStatus) => {
    if (currentDbStatus === 'online') {
      try {
        const response = await fetch(`/api/sessions/${sId}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const data = await response.json();
        
        if (data.success && data.messages && data.messages.length > 0) {
          // Normalize role from DB 'model' to UI 'ai' if needed
          const uiMessages = data.messages.map(msg => ({
            role: msg.role === 'model' ? 'ai' : msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }));
          setMessages(uiMessages);
        } else {
          // Session is empty, initialize session in DB and display welcome
          await createDbSession(uId, sId);
          addWelcomeMessage(uId, 'online');
        }
      } catch (error) {
        console.error('Error loading history from DB:', error);
        loadFromLocalStorage(uId);
      }
    } else {
      loadFromLocalStorage(uId);
    }
  };

  const createDbSession = async (uId, sId) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sId,
          userId: uId,
          title: 'New Conversation'
        })
      });
    } catch (error) {
      console.error('Failed to initialize session in DB:', error);
    }
  };

  const loadFromLocalStorage = (uId) => {
    const saved = localStorage.getItem(`chatMessages_${uId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      addWelcomeMessage(uId, 'offline');
    }
  };

  const addWelcomeMessage = (uId, currentDbStatus) => {
    const welcome = {
      role: 'ai',
      content: "Hello! I'm your AI Assistant. How can I help you today?",
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    if (currentDbStatus !== 'online') {
      localStorage.setItem(`chatMessages_${uId}`, JSON.stringify([welcome]));
    }
  };

  // Send message handler
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    
    const content = inputText.trim();
    if (content === '' || isTyping) return;

    const userMessage = { role: 'user', content, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');

    // Save locally if DB is offline
    if (dbStatus !== 'online') {
      localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(updatedMessages));
    }

    setIsTyping(true);

    try {
      let response;
      if (dbStatus === 'online') {
        // Send message with sessionId so server saves it directly to DB
        response = await fetch('/api/chat-with-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            sessionId,
            userId
          })
        });
      } else {
        // Fallback: send full message history in request body
        response = await fetch('/api/chat-with-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map(msg => ({
              role: msg.role === 'ai' ? 'model' : msg.role,
              content: msg.content
            })),
            userId
          })
        });
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const aiResponse = { 
          role: 'ai', 
          content: data.response,
          timestamp: data.timestamp || new Date().toISOString()
        };
        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);

        // If the backend reported database failure, sync to local storage
        if (dbStatus !== 'online' || data.dbStatus === 'offline') {
          localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(finalMessages));
        }
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
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
      if (dbStatus !== 'online') {
        localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(finalMessages));
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Clear chat handler
  const clearChat = async () => {
    // Reset messages state locally
    const welcome = {
      role: 'ai',
      content: "Hello! I'm your AI Assistant. How can I help you today?",
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    localStorage.removeItem(`chatMessages_${userId}`);
    
    if (dbStatus === 'online') {
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'DELETE'
        });
        
        // Generate a brand new session ID for subsequent chats
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        setSessionId(newSessionId);
        localStorage.setItem('chatbot_sessionId', newSessionId);
        
        // Initialize the new session on the server
        await createDbSession(userId, newSessionId);
        showToast('Chat history cleared. Sync complete.', 'success');
      } catch (error) {
        console.error('Failed to delete history on backend:', error);
        showToast('Chat cleared locally. Backend sync failed.', 'warning');
      }
    } else {
      showToast('Chat history cleared.', 'success');
    }
  };

  const confirmClearChat = () => {
    if (messages.length <= 1) {
      showToast('Chat is already empty.', 'info');
      return;
    }
    setConfirmTitle('Clear Chat History?');
    setConfirmMessage('This will permanently delete all messages in this conversation.');
    setOnConfirm(() => () => clearChat());
    setIsConfirmOpen(true);
  };

  // Export chat handler
  const exportChat = () => {
    if (messages.length === 0) {
      showToast('No messages to export.', 'warning');
      return;
    }

    const chatData = {
      exportDate: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map(msg => ({
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
    showToast('Chat exported successfully!', 'success');
  };

  // Unimplemented placeholders
  const handleFileAttachment = () => {
    showToast('File attachment is not yet implemented.', 'info');
  };

  const handleVoiceInput = () => {
    showToast('Voice input is not yet implemented.', 'info');
  };

  // Theme controls
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('theme', nextTheme);
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    setTheme(isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  };

  // Modal actions
  const retryConnection = async () => {
    setIsErrorOpen(false);
    const conn = await checkConnection(true);
    const currentDbStatus = conn.dbConnected ? 'online' : 'offline';
    await loadSavedMessages(userId, sessionId, currentDbStatus);
  };

  return (
    <>
      <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-2xl shadow-slate-300/40 dark:shadow-black/40 border border-white/20 dark:border-slate-700/50">
        
        {/* Header */}
        <header className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between flex-shrink-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                dbStatus === 'online' ? 'bg-green-400' : dbStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
              }`}></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Assistant</h1>
              <div id="connectionStatus" className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  dbStatus === 'online' ? 'bg-green-500' : dbStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`}></span>
                <span>
                  {dbStatus === 'online' ? 'Connected' : dbStatus === 'connecting' ? 'Connecting...' : 'Database Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              id="exportChat" 
              onClick={exportChat}
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-200 flex items-center space-x-2 btn-bounce"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export</span>
            </button>
            <button 
              id="clearChat" 
              onClick={confirmClearChat}
              className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-200 flex items-center space-x-2 btn-bounce"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span>Clear</span>
            </button>
            <button 
              id="themeToggle" 
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-200 btn-bounce"
            >
              {theme === 'light' ? (
                <svg id="theme-icon-light" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg id="theme-icon-dark" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Message scroll area */}
        <main 
          id="chatMessages" 
          ref={chatMessagesRef}
          className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-900/30"
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} className={`animate-fade-in flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && (
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex-shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                )}
                <div className={`message-hover max-w-md md:max-w-lg lg:max-w-xl p-4 rounded-2xl shadow-lg border ${
                  isUser 
                    ? 'bg-blue-500/90 dark:bg-blue-600/90 text-white rounded-br-lg border-blue-500/10' 
                    : 'bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-bl-lg border-slate-200/50 dark:border-slate-600/50 text-slate-800 dark:text-slate-200'
                }`}>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {isUser && (
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex-shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>
        
        {/* Typing indicator */}
        <div id="typingIndicator" className={`px-6 pb-6 ${isTyping ? '' : 'hidden'}`}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex-shrink-0 shadow-md">
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div className="bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-sm p-4 rounded-2xl rounded-bl-lg max-w-md shadow-lg border border-slate-200/50 dark:border-slate-600/50">
              <div className="typing-dots flex items-center gap-1.5">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Input footer */}
        <footer className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
          <div className="w-full max-w-4xl mx-auto">
            <form id="chatForm" onSubmit={sendMessage} className="flex items-end gap-3">
              <div className="flex-1 bg-slate-100/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all duration-200 p-3 shadow-lg">
                <textarea 
                  id="messageInput" 
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message..." 
                  rows={1} 
                  maxLength={8000}
                  className="w-full bg-transparent border-none outline-none resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus-glow"
                ></textarea>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/30 dark:border-slate-600/30">
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button" 
                      onClick={handleFileAttachment}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-600/50"
                    >
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleVoiceInput}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-600/50"
                    >
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    <span>{inputText.length}/8000</span>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={inputText.trim() === '' || isTyping}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200 disabled:from-blue-300 disabled:to-purple-300 dark:disabled:from-blue-800 dark:disabled:to-purple-800 disabled:cursor-not-allowed flex-shrink-0 shadow-lg btn-bounce hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </footer>
      </div>

      {/* Loading Overlay */}
      {dbStatus === 'connecting' && (
        <div id="loadingOverlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center border border-white/20 dark:border-slate-700/50">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-600 border-t-4 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Connecting to AI...</p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {isErrorOpen && (
        <div id="errorModal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full m-4 border border-white/20 dark:border-slate-700/50">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Connection status</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300">{errorMessage}</p>
            </div>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 flex justify-end items-center space-x-3 rounded-b-2xl">
              <button 
                onClick={() => setIsErrorOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-600/70 border border-slate-300/50 dark:border-slate-500/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500/70 transition btn-bounce"
              >
                Close
              </button>
              <button 
                onClick={retryConnection}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition btn-bounce"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div id="confirmModal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full m-4 border border-white/20 dark:border-slate-700/50">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{confirmTitle}</h3>
              <p className="text-slate-600 dark:text-slate-300 mt-2">{confirmMessage}</p>
            </div>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 flex justify-end items-center space-x-3 rounded-b-2xl">
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-600/70 border border-slate-300/50 dark:border-slate-500/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-500/70 transition btn-bounce"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (onConfirm) onConfirm();
                  setIsConfirmOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition btn-bounce"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Toast Notifications */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 animate-fade-in ${
              t.type === 'success' ? 'bg-green-500' :
              t.type === 'warning' ? 'bg-yellow-500' :
              t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
