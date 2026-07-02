import React from 'react';
import useChat from '../hooks/useChat';
import useAuth from '../hooks/useAuth';
import ChatWindow from '../components/Chat/ChatWindow';
import Navbar from '../components/Navbar/Navbar';

export const Home = () => {
  const { setCurrentPage } = useAuth();
  const {
    sidebarOpen,
    setSidebarOpen,
    createNewSession,
    sessions,
    sessionId,
    selectSession,
    deleteSession,
    dbStatus,
    isErrorOpen,
    setIsErrorOpen,
    errorMessage,
    retryConnection,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmTitle,
    confirmMessage,
    onConfirm,
    toasts,
    isLoginRequiredOpen,
    setIsLoginRequiredOpen
  } = useChat();

  return (
    <>
      <Navbar />
      <div className="app-container" style={{ height: 'calc(100vh - 64px)' }}>
      
      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="font-bold tracking-tight">NVIDIA NIM AI</span>
        </div>

        <button 
          type="button"
          onClick={createNewSession}
          className="new-chat-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>

        {/* Historical Conversations List */}
        <div className="sessions-list custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              {dbStatus === 'online' ? 'No saved chats' : 'History disabled (Offline)'}
            </div>
          ) : (
            sessions.map((sess) => (
              <button
                key={sess.sessionId}
                type="button"
                onClick={() => selectSession(sess.sessionId)}
                className={`session-item ${sess.sessionId === sessionId ? 'active' : ''}`}
              >
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="session-title">{sess.title}</span>
                
                <span className="session-actions">
                  <button
                    type="button"
                    onClick={(e) => deleteSession(e, sess.sessionId)}
                    className="delete-session-btn"
                    title="Delete conversation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="text-center text-slate-500 text-xs font-medium">
            NVIDIA NIM Chatbot v2.0
          </div>
        </div>
      </aside>

      {/* Main Chat Canvas Area */}
      <main className="flex-1 overflow-hidden">
        <ChatWindow />
      </main>

      {/* Global Connection Check Overlay */}
      {dbStatus === 'connecting' && (
        <div className="modal-overlay">
          <div className="modal-content text-center items-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2" />
            <p className="font-semibold text-slate-800 dark:text-white">Connecting to server...</p>
          </div>
        </div>
      )}

      {/* Backend API Failure Modal */}
      {isErrorOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title text-red-500 flex items-center gap-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Connection Error</span>
            </h3>
            <p className="modal-body">{errorMessage}</p>
            <div className="modal-footer">
              <button 
                type="button"
                onClick={() => setIsErrorOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button 
                type="button"
                onClick={retryConnection}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear/Delete Chat Confirmation Modal */}
      {isConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{confirmTitle}</h3>
            <p className="modal-body">{confirmMessage}</p>
            <div className="modal-footer">
              <button 
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  setIsConfirmOpen(false);
                }}
                className="btn-danger"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Guest Limit Modal */}
      {isLoginRequiredOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title flex items-center gap-1.5 text-blue-500">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Login Required</span>
            </h3>
            <p className="modal-body">
              You have used your 2 free AI messages. Please login or create an account to continue chatting.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsLoginRequiredOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginRequiredOpen(false);
                  setCurrentPage('signup');
                }}
                className="btn-secondary text-blue-600 border-blue-500/20 hover:bg-blue-500/10 font-bold"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginRequiredOpen(false);
                  setCurrentPage('login');
                }}
                className="btn-primary"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Drawer */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-white font-semibold transition-all duration-300 animate-fade-in flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'warning' ? 'bg-yellow-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
    </>
  );
};

export default Home;
