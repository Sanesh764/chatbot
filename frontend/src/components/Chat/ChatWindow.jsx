import React, { useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

export const ChatWindow = () => {
  const {
    messages,
    isTyping,
    dbStatus,
    theme,
    toggleTheme,
    confirmClearChat,
    setSidebarOpen,
    showToast
  } = useChat();

  const chatMessagesRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the message container on new additions
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Export chat function
  const exportChat = () => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].content.includes("Hello! I'm your AI Assistant"))) {
      showToast('No conversational messages to export.', 'warning');
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

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <header className="chat-header">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setSidebarOpen(true)}
            className="sidebar-toggle-btn p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              NVIDIA NIM Assistant
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className={`w-2 h-2 rounded-full ${
                dbStatus === 'online' ? 'bg-green-500' : dbStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span>
                {dbStatus === 'online' ? 'Connected' : dbStatus === 'connecting' ? 'Connecting...' : 'Database Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportChat}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
            title="Export conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={confirmClearChat}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
            title="Clear conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Message Scroll Space */}
      <div 
        ref={chatMessagesRef}
        className="chat-messages custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10"
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            message={msg}
            isLast={index === messages.length - 1}
          />
        ))}
        {isTyping && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <ChatInput />
    </div>
  );
};

export default ChatWindow;
