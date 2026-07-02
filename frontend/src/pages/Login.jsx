import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';

export const Login = () => {
  const { login, loading } = useAuth();
  const { showToast } = useChat();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError(''); // clear error when user types
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast('Forgot password functionality is currently a placeholder.', 'info');
  };

  const validateEmail = (email) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email.trim() || !password) {
      setError('All fields are required.');
      showToast('All fields are required.', 'error');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      showToast('Invalid email address.', 'error');
      return;
    }

    setError('');
    const result = await login(email.trim(), password);

    if (result.success) {
      showToast('Logged in successfully! Welcome back.', 'success');
    } else {
      setError(result.error);
      showToast(result.error, 'error');
    }
  };

  const { setCurrentPage } = useAuth();

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 animate-fade-in">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log in to unlock unlimited AI chats</p>
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
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="bg-transparent border-none p-0 text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
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

          <div className="flex justify-between items-center my-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                Remember Me
              </label>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition duration-200 shadow-md hover:shadow-lg border-none cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Logging In...</span>
              </>
            ) : (
              <span>Log In</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentPage('signup')}
              className="bg-transparent border-none p-0 font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              Sign up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
