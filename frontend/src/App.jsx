import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import useAuth from './hooks/useAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import './styles/chat.css';

function MainApp() {
  const { currentPage, loading } = useAuth();

  // Fullscreen loader while checking JWT session validity on load
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 text-slate-100 gap-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
        <p className="font-semibold text-sm tracking-wider text-slate-400">Verifying session...</p>
      </div>
    );
  }

  // Component-based router switcher
  switch (currentPage) {
    case 'login':
      return <Login />;
    case 'signup':
      return <Signup />;
    case 'profile':
      return <Profile />;
    case 'chat':
    default:
      return <Home />;
  }
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MainApp />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
