import React from 'react';
import useAuth from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';

export const Navbar = () => {
  const { isAuthenticated, logout, setCurrentPage, currentPage, user } = useAuth();
  const { createNewSession, dbStatus } = useChat();

  return (
    <nav className="h-16 px-6 bg-slate-900 text-slate-100 border-b border-slate-800 flex items-center justify-between z-40 relative shadow-md">
      {/* Brand logo */}
      <button 
        type="button"
        onClick={() => setCurrentPage('chat')}
        className="flex items-center gap-2 border-none bg-transparent cursor-pointer text-slate-100"
      >
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          NVIDIA NIM AI
        </span>
      </button>

      {/* Nav Actions */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          // Authenticated Navbar Items
          <>
            {currentPage === 'chat' && (
              <button
                type="button"
                onClick={createNewSession}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow transition duration-200 border-none cursor-pointer flex items-center gap-1.5"
                title="Create a new conversation session"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Chat</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentPage('profile')}
              className={`px-3 py-1.5 font-semibold text-sm rounded-lg transition duration-200 border-none cursor-pointer flex items-center gap-1.5 ${
                currentPage === 'profile' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{user?.username || 'Profile'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 bg-transparent border-none text-slate-300 hover:text-red-400 font-semibold text-sm rounded-lg hover:bg-red-500/10 transition duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </>
        ) : (
          // Guest Navbar Items
          <>
            <button
              type="button"
              onClick={() => setCurrentPage('login')}
              className={`px-3.5 py-1.5 font-semibold text-sm rounded-lg transition duration-200 border-none cursor-pointer ${
                currentPage === 'login' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Login
            </button>
            
            <button
              type="button"
              onClick={() => setCurrentPage('signup')}
              className={`px-3.5 py-1.5 font-semibold text-sm rounded-lg transition duration-200 border-none cursor-pointer ${
                currentPage === 'signup' 
                  ? 'bg-blue-600 text-white shadow hover:bg-blue-700' 
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              }`}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
