import React, { useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';

export const Signup = () => {
  const { signup, loading } = useAuth();
  const { showToast } = useChat();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be under 5MB.', 'warning');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Only image files are allowed.', 'warning');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateEmail = (email) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      showToast('All fields are required.', 'error');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      showToast('Username must be at least 3 characters.', 'error');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      showToast('Invalid email address.', 'error');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      showToast('Passwords do not match.', 'error');
      return;
    }

    setError('');

    // Prepare FormData payload for multi-part file support
    const signupData = new FormData();
    signupData.append('username', username.trim());
    signupData.append('email', email.trim().toLowerCase());
    signupData.append('password', password);
    if (avatarFile) {
      signupData.append('avatar', avatarFile);
    }

    const result = await signup(signupData);

    if (result.success) {
      showToast('Account created! Welcome to NVIDIA NIM Chatbot.', 'success');
    } else {
      setError(result.error);
      showToast(result.error, 'error');
    }
  };

  const { setCurrentPage } = useAuth();

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 animate-fade-in">
        
        <div className="text-center mb-5">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Create your Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get started with unlimited chat prompts</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Circular Photo Upload Selector */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={triggerFileSelect}
              className="relative w-20 h-20 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-inner group"
              title="Upload profile picture (optional)"
            >
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 text-white font-bold text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                Upload
              </div>
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Profile Photo (Optional)</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. john_doe"
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="showPassword" className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
              Show Password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition duration-200 shadow-md hover:shadow-lg border-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => setCurrentPage('login')}
              className="bg-transparent border-none p-0 font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Signup;
