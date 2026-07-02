import React from 'react';

export const TypingIndicator = () => {
  return (
    <div className="message-row ai animate-fade-in my-2">
      <div className="avatar ai">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 8.25v7.5a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <div className="message-bubble ai max-w-xs md:max-w-md lg:max-w-lg">
        <div className="typing-dots flex items-center gap-1.5">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
