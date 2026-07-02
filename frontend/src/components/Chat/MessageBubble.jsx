import React from 'react';
import FormatMessage from '../../utils/formatMessage';
import useChat from '../../hooks/useChat';

export const MessageBubble = ({ message, isLast }) => {
  const { showToast, regenerateResponse } = useChat();
  const isUser = message.role === 'user';

  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied content to clipboard!', 'success'))
      .catch((err) => {
        console.error('Failed to copy text:', err);
        showToast('Failed to copy text.', 'error');
      });
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'ai'} animate-fade-in`}>
      {!isUser && (
        <div className="avatar ai">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
      )}
      
      <div className={`message-bubble ${isUser ? 'user' : 'ai'} ${message.isError ? 'border-red-500 bg-red-50/5 dark:bg-red-950/5' : ''}`}>
        {isUser ? (
          <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <FormatMessage 
            content={message.content} 
            onCopyCode={copyTextToClipboard} 
          />
        )}

        <div className="message-footer-actions">
          <button 
            type="button"
            onClick={() => copyTextToClipboard(message.content)}
            className="message-action-btn"
            title="Copy entire message"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Copy</span>
          </button>

          {!isUser && isLast && (
            <button 
              type="button"
              onClick={regenerateResponse}
              className="message-action-btn"
              title="Regenerate this response"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
              </svg>
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="avatar user">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
