import React from 'react';

/**
 * Helper to render inline elements like bold (**text**) and inline code (`code`)
 */
const renderInlineElements = (text) => {
  if (!text) return '';
  
  // Split by inline code first, then bold text
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code 
          key={idx} 
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-red-500 dark:text-red-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    
    return part;
  });
};

/**
 * FormatMessage Component
 * Parses markdown text content and renders it into React nodes.
 * Supports:
 * - Paragraphs
 * - Code Blocks (```lang ... ```) with Copy button
 * - Inline Code (`code`)
 * - Bold text (**bold**)
 * - Unordered list items (- or * )
 * - Ordered list items (1. )
 */
export const FormatMessage = ({ content, onCopyCode }) => {
  if (!content) return null;

  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-content">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code content
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);

          return (
            <div key={index} className="code-block-container my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="code-block-header flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <span className="uppercase font-semibold">{lang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => onCopyCode(code)}
                  className="copy-code-btn px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-1 cursor-pointer font-semibold text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-50 dark:bg-slate-900 overflow-x-auto text-sm font-mono text-slate-800 dark:text-slate-100">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else {
          // Regular text block: parse line-by-line
          const lines = part.split('\n');
          let currentList = [];
          let currentListType = null; // 'ul' | 'ol' | null
          const elements = [];

          const flushList = (key) => {
            if (currentList.length > 0) {
              if (currentListType === 'ul') {
                elements.push(
                  <ul key={`ul-${key}`} className="list-disc pl-5 my-2">
                    {currentList.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                );
              } else {
                elements.push(
                  <ol key={`ol-${key}`} className="list-decimal pl-5 my-2">
                    {currentList.map((item, i) => <li key={i}>{item}</li>)}
                  </ol>
                );
              }
              currentList = [];
              currentListType = null;
            }
          };

          lines.forEach((line, lineIdx) => {
            const trimmed = line.trim();

            // Unordered list item
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              if (currentListType !== 'ul') {
                flushList(lineIdx);
                currentListType = 'ul';
              }
              currentList.push(renderInlineElements(trimmed.substring(2)));
              return;
            }

            // Ordered list item
            const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
            if (numMatch) {
              if (currentListType !== 'ol') {
                flushList(lineIdx);
                currentListType = 'ol';
              }
              currentList.push(renderInlineElements(numMatch[2]));
              return;
            }

            // Regular paragraph line - flush list if we have one
            flushList(lineIdx);
            
            if (trimmed === '') {
              elements.push(<div key={`space-${lineIdx}`} className="h-2" />);
            } else {
              elements.push(
                <p key={`p-${lineIdx}`} className="my-1.5 text-base leading-relaxed">
                  {renderInlineElements(line)}
                </p>
              );
            }
          });

          // Final flush
          flushList(lines.length);
          return <React.Fragment key={index}>{elements}</React.Fragment>;
        }
      })}
    </div>
  );
};

export default FormatMessage;
