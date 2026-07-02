import React, { createContext, useState, useEffect, useRef } from 'react';
import * as chatApi from '../services/chatApi';
import useAuth from '../hooks/useAuth';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Guest Chat Limits
  const [guestMessageCount, setGuestMessageCount] = useState(() => {
    return parseInt(localStorage.getItem('guest_message_count') || '0', 10);
  });
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);

  // Modal states
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Stream Abort controller reference
  const abortControllerRef = useRef(null);

  // Initialize Application (Theme & Server Connectivity)
  useEffect(() => {
    loadTheme();
    checkConnection(true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Sync session and history context when User Auth status changes
  useEffect(() => {
    if (dbStatus === 'connecting') return;

    const syncUserContext = async () => {
      if (isAuthenticated && user) {
        // Logged-in mode
        setUserId(user._id);
        
        let sId = localStorage.getItem(`chatbot_sessionId_${user._id}`);
        if (!sId) {
          sId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          localStorage.setItem(`chatbot_sessionId_${user._id}`, sId);
        }
        setSessionId(sId);

        // Reset guest count on successful auth
        localStorage.setItem('guest_message_count', '0');
        setGuestMessageCount(0);

        if (dbStatus === 'online') {
          await loadSessionsList(user._id);
        }
        await loadSavedMessages(user._id, sId, dbStatus);
      } else {
        // Guest mode
        let uId = localStorage.getItem('chatbot_userId');
        if (!uId) {
          uId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          localStorage.setItem('chatbot_userId', uId);
        }
        setUserId(uId);

        let sId = localStorage.getItem('chatbot_sessionId');
        if (!sId) {
          sId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          localStorage.setItem('chatbot_sessionId', sId);
        }
        setSessionId(sId);
        setSessions([]); // Clear db sessions list for guests
        await loadSavedMessages(uId, sId, dbStatus);
      }
    };

    syncUserContext();
  }, [isAuthenticated, user, dbStatus]);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Connection check helper
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
        showToast('Database offline. History will be saved locally.', 'warning');
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

  // Load list of sessions from DB
  const loadSessionsList = async (uId) => {
    try {
      const list = await chatApi.getSessions(uId);
      setSessions(list || []);
    } catch (error) {
      console.error('Failed to load session list:', error);
    }
  };

  // Load chat messages for the active session
  const loadSavedMessages = async (uId, sId, currentDbStatus) => {
    if (currentDbStatus === 'online') {
      try {
        const dbMessages = await chatApi.getHistory(sId);
        if (dbMessages && dbMessages.length > 0) {
          // Normalize roles: DB stores 'model', frontend UI expects 'ai'
          const uiMessages = dbMessages.map(msg => ({
            role: (msg.role === 'model' || msg.role === 'ai') ? 'ai' : msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }));
          setMessages(uiMessages);
        } else {
          // Initialize empty session in DB and append welcome
          await chatApi.createSession(sId, uId, 'New Conversation');
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
      content: "Hello! I'm your AI Assistant powered by NVIDIA NIM. How can I help you today?",
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    if (currentDbStatus !== 'online') {
      localStorage.setItem(`chatMessages_${uId}`, JSON.stringify([welcome]));
    }
  };

  // Create a new session
  const createNewSession = async () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(newSessionId);
    localStorage.setItem('chatbot_sessionId', newSessionId);

    if (dbStatus === 'online') {
      try {
        await chatApi.createSession(newSessionId, userId, 'New Conversation');
        await loadSessionsList(userId);
        showToast('Created a new chat session', 'success');
      } catch (err) {
        console.error('Failed to create new session in DB:', err);
      }
    }

    addWelcomeMessage(userId, dbStatus);
    setInputText('');
    setSidebarOpen(false);
  };

  // Select an existing session
  const selectSession = async (sId) => {
    if (sId === sessionId) {
      setSidebarOpen(false);
      return;
    }

    if (isTyping) {
      showToast('Please wait for the response to complete or stop generation first.', 'warning');
      return;
    }

    setSessionId(sId);
    localStorage.setItem('chatbot_sessionId', sId);
    await loadSavedMessages(userId, sId, dbStatus);
    setSidebarOpen(false);
  };

  // Delete a session
  const deleteSession = async (e, sId) => {
    e.stopPropagation(); // Avoid triggering session selection
    
    if (isTyping && sId === sessionId) {
      showToast('Cannot delete active session while generating text.', 'warning');
      return;
    }

    const performDelete = async () => {
      if (dbStatus === 'online') {
        try {
          await chatApi.clearHistory(sId);
          await loadSessionsList(userId);
          showToast('Chat history deleted from server', 'success');
        } catch (err) {
          console.error('Failed to delete history on server:', err);
          showToast('Failed to sync deletion with server', 'error');
        }
      }

      // If deleted the active session, switch to a new one
      if (sId === sessionId) {
        localStorage.removeItem(`chatMessages_${userId}`);
        createNewSession();
      }
    };

    setConfirmTitle('Delete Conversation?');
    setConfirmMessage('This will permanently delete this conversation and all its messages.');
    setOnConfirm(() => () => performDelete());
    setIsConfirmOpen(true);
  };

  // Stop current AI completion stream
  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      showToast('Generation stopped', 'info');
      // Sync list of sessions to update potential titles
      if (dbStatus === 'online') {
        loadSessionsList(userId);
      }
    }
  };

  // Send message
  const sendMessage = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    if (isTyping) return;

    const content = customMessage ? customMessage.trim() : inputText.trim();
    if (content === '') return;

    // Check Guest message limit (max 2 messages)
    if (!isAuthenticated) {
      if (guestMessageCount >= 2) {
        setIsLoginRequiredOpen(true);
        showToast('Login required to continue chatting.', 'warning');
        return;
      }
    }

    const userMessage = { role: 'user', content, timestamp: new Date().toISOString() };
    
    // Clear input field if it's the standard send
    if (!customMessage) {
      setInputText('');
    }

    // Set messages state, appending the user's message and a placeholder AI message
    let updatedMessages = [...messages];
    // If we are regenerating, we might have already popped the bad messages.
    // Otherwise, append user message.
    if (!customMessage || messages[messages.length - 1]?.role !== 'user') {
      updatedMessages = [...messages, userMessage];
    }
    
    const placeholderAiMessage = {
      role: 'ai',
      content: '',
      timestamp: new Date().toISOString()
    };
    
    setMessages([...updatedMessages, placeholderAiMessage]);
    setIsTyping(true);

    if (dbStatus !== 'online') {
      localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(updatedMessages));
    }

    // Initialize abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';

    await chatApi.streamChatCompletion({
      message: content,
      messages: updatedMessages.map(msg => ({
        role: msg.role === 'ai' ? 'model' : msg.role,
        content: msg.content
      })),
      sessionId,
      userId,
      signal: controller.signal,
      onChunk: (chunk) => {
        accumulatedText += chunk;
        setMessages(prev => {
          const nextMsgs = [...prev];
          const lastMsgIdx = nextMsgs.length - 1;
          if (lastMsgIdx >= 0 && nextMsgs[lastMsgIdx].role === 'ai') {
            nextMsgs[lastMsgIdx] = {
              ...nextMsgs[lastMsgIdx],
              content: accumulatedText
            };
          }
          return nextMsgs;
        });
      },
      onComplete: () => {
        setIsTyping(false);
        abortControllerRef.current = null;
        
        // Increment guest message count on successful completion of a response
        if (!isAuthenticated) {
          setGuestMessageCount(prev => {
            const next = prev + 1;
            localStorage.setItem('guest_message_count', next.toString());
            return next;
          });
        }

        // Sync local storage if offline
        if (dbStatus !== 'online') {
          const finalMessages = [...updatedMessages, {
            role: 'ai',
            content: accumulatedText,
            timestamp: new Date().toISOString()
          }];
          localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(finalMessages));
        } else {
          // Reload sessions list to update the dynamic title of the conversation
          loadSessionsList(userId);
        }
      },
      onError: (err) => {
        setIsTyping(false);
        abortControllerRef.current = null;
        console.error('Chat error:', err);

        const errorResponseText = `Sorry, I encountered an error: ${err.message}. Please click the "Retry" button below to regenerate my response.`;
        
        setMessages(prev => {
          const nextMsgs = [...prev];
          const lastMsgIdx = nextMsgs.length - 1;
          if (lastMsgIdx >= 0 && nextMsgs[lastMsgIdx].role === 'ai') {
            nextMsgs[lastMsgIdx] = {
              ...nextMsgs[lastMsgIdx],
              content: errorResponseText,
              isError: true
            };
          }
          return nextMsgs;
        });

        if (dbStatus !== 'online') {
          const finalMessages = [...updatedMessages, {
            role: 'ai',
            content: errorResponseText,
            timestamp: new Date().toISOString(),
            isError: true
          }];
          localStorage.setItem(`chatMessages_${userId}`, JSON.stringify(finalMessages));
        }
      }
    });
  };

  // Regenerate Response
  const regenerateResponse = async () => {
    if (isTyping) return;

    // We look for the last user message
    let lastUserMessageIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIdx = i;
        break;
      }
    }

    if (lastUserMessageIdx === -1) {
      showToast('No user messages found to regenerate response for.', 'warning');
      return;
    }

    const userMessageContent = messages[lastUserMessageIdx].content;
    
    // Trim current message state up to the user message
    const slicedMessages = messages.slice(0, lastUserMessageIdx + 1);
    setMessages(slicedMessages);

    // Call sendMessage with custom user message
    await sendMessage(null, userMessageContent);
  };

  // Clear current active session (confirm modal)
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

  const clearChat = async () => {
    if (isTyping) {
      showToast('Please stop generation before clearing chat.', 'warning');
      return;
    }

    const welcome = {
      role: 'ai',
      content: "Hello! I'm your AI Assistant powered by NVIDIA NIM. How can I help you today?",
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    localStorage.removeItem(`chatMessages_${userId}`);
    
    if (dbStatus === 'online') {
      try {
        await chatApi.clearHistory(sessionId);
        
        // Generate new session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        setSessionId(newSessionId);
        localStorage.setItem('chatbot_sessionId', newSessionId);
        
        // Initialize new session in DB
        await chatApi.createSession(newSessionId, userId, 'New Conversation');
        await loadSessionsList(userId);
        
        showToast('Chat history cleared. Sync complete.', 'success');
      } catch (error) {
        console.error('Failed to clear chat on server:', error);
        showToast('Cleared locally. Failed to sync with server.', 'warning');
      }
    } else {
      showToast('Chat history cleared.', 'success');
    }
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

  // Re-attempt server verification
  const retryConnection = async () => {
    setIsErrorOpen(false);
    const conn = await checkConnection(true);
    const currentDbStatus = conn.dbConnected ? 'online' : 'offline';
    
    if (conn.dbConnected) {
      await loadSessionsList(userId);
    }
    await loadSavedMessages(userId, sessionId, currentDbStatus);
  };

  return (
    <ChatContext.Provider
      value={{
        userId,
        sessionId,
        sessions,
        messages,
        inputText,
        setInputText,
        isTyping,
        dbStatus,
        theme,
        sidebarOpen,
        setSidebarOpen,
        isErrorOpen,
        setIsErrorOpen,
        errorMessage,
        isConfirmOpen,
        setIsConfirmOpen,
        confirmTitle,
        confirmMessage,
        onConfirm,
        toasts,
        guestMessageCount,
        isLoginRequiredOpen,
        setIsLoginRequiredOpen,
        createNewSession,
        selectSession,
        deleteSession,
        stopGenerating,
        sendMessage,
        regenerateResponse,
        confirmClearChat,
        toggleTheme,
        retryConnection,
        showToast
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
