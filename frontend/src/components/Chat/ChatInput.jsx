import React, { useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';

export const ChatInput = () => {
  const { 
    inputText, 
    setInputText, 
    sendMessage, 
    isTyping, 
    stopGenerating,
    showToast 
  } = useChat();

  const textareaRef = useRef(null);

  // Auto-resize the text input area as content length changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleAttachment = () => {
    showToast('File attachment is not yet implemented.', 'info');
  };

  const handleVoice = () => {
    showToast('Voice input is not yet implemented.', 'info');
  };

  return (
    <footer className="chat-footer">
      <div className="input-container">
        <form onSubmit={sendMessage}>
          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? "AI is generating response..." : "Type a message..."}
              disabled={isTyping}
              rows={1}
              maxLength={8000}
              className="chat-textarea custom-scrollbar"
            />
            
            {!isTyping && (
              <button
                type="submit"
                disabled={inputText.trim() === ''}
                className="send-btn"
                title="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          <div className="input-actions">
            <div className="input-action-left">
              <button
                type="button"
                onClick={handleAttachment}
                className="input-btn"
                title="Attach file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleVoice}
                className="input-btn"
                title="Voice input"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>

            {isTyping ? (
              <button
                type="button"
                onClick={stopGenerating}
                className="stop-generating-btn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
                <span>Stop Generating</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {inputText.length}/8000
              </div>
            )}
          </div>
        </form>
      </div>
    </footer>
  );
};

export default ChatInput;
