import React, { useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';

export const Profile = () => {
  const { user, logout, updateProfile, setCurrentPage, loading } = useAuth();
  const { showToast } = useChat();
  const fileInputRef = useRef(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      showToast('Logged out successfully.', 'success');
    } else {
      showToast('Logout failed.', 'error');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be under 5MB.', 'warning');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed.', 'warning');
      return;
    }

    setUploadingAvatar(true);
    showToast('Uploading profile picture...', 'info');

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    const result = await updateProfile(uploadData);
    setUploadingAvatar(false);

    if (result.success) {
      showToast('Profile picture updated successfully!', 'success');
    } else {
      showToast(result.error || 'Failed to upload profile picture.', 'error');
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      showToast('Username must be at least 3 characters.', 'warning');
      return;
    }

    if (newUsername.trim() === user?.username) {
      setIsEditingName(false);
      return;
    }

    const updateData = new FormData();
    updateData.append('username', newUsername.trim());

    const result = await updateProfile(updateData);

    if (result.success) {
      showToast('Username updated successfully!', 'success');
      setIsEditingName(false);
    } else {
      showToast(result.error || 'Failed to update username.', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitialLetter = (name) => {
    return name ? name.trim().charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in">
        
        {/* Navigation back */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage('chat')}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Chat</span>
          </button>

          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Account Settings</h1>
        </div>

        {/* Profile Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Avatar / Left Column Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md">
            
            {/* Cloudinary Upload Circular Avatar */}
            <div className="relative group mb-4">
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
                disabled={uploadingAvatar}
                className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold text-4xl flex items-center justify-center shadow-lg overflow-hidden cursor-pointer border-none relative group"
                title="Click to change profile picture"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="User profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitialLetter(user?.username)}</span>
                )}
                
                {/* Upload Hover State Overlay */}
                <div className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>Edit</span>
                </div>
              </button>
              
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-slate-950/60 flex items-center justify-center text-white">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user?.username || 'Username'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Chatbot Account Tier: <strong className="text-blue-500">Unlimited Pro</strong></p>

            <button
              onClick={handleLogout}
              className="mt-6 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Details / Middle Column Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:col-span-2 shadow-md flex flex-col gap-5 justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800/50 pb-2 mb-4">
                Profile Details
              </h3>

              <div className="flex flex-col gap-4">
                {/* Username Input / Edit State */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/30">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Username</span>
                  {isEditingName ? (
                    <form onSubmit={handleNameSave} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={loading}
                        className="px-2.5 py-1 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="p-1 text-green-500 hover:bg-green-500/10 rounded border-none bg-transparent cursor-pointer"
                        title="Save username"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditingName(false);
                          setNewUsername(user?.username || '');
                        }}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded border-none bg-transparent cursor-pointer"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-800 dark:text-slate-100 font-bold">{user?.username}</span>
                      <button 
                        type="button" 
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border-none bg-transparent cursor-pointer"
                        title="Edit Username"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/30">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Email Address</span>
                  <span className="text-sm text-slate-800 dark:text-slate-100 font-bold">{user?.email}</span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">Member Since</span>
                  <span className="text-sm text-slate-800 dark:text-slate-100 font-bold">{formatDate(user?.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3 mt-4">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-medium">
                Your profile picture is uploaded securely to Cloudinary CDN storage. Editing your name will update in real time.
              </div>
            </div>
          </div>

          {/* Feature Grid / Stats Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:col-span-3 shadow-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800/50 pb-2 mb-4">
              Account Features & Stats
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/20 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1">Usage Counter</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white">Unlimited</span>
              </div>
              <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/20 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1">Active Model</span>
                <span className="text-base font-bold text-slate-800 dark:text-white truncate block">diffusiongemma-26b</span>
              </div>
              <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/20 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1">Cloud Storage</span>
                <span className="text-base font-bold text-green-500 block">Cloudinary Connected</span>
              </div>
            </div>

            <div className="mt-6 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 text-sm font-semibold italic">
              Future features like Custom API key bindings, custom AI avatars, and advanced system prompts will be available here soon.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
