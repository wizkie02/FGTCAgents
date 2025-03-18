'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatSection as ChatSectionType } from '../../types/types';
import { useState, useEffect } from 'react';

interface ChatSectionProps {
  section: ChatSectionType;
  onCopy: (text: string) => void;
}

export const ChatSection = ({ section, onCopy }: ChatSectionProps) => {
  const [isReasoningCollapsed, setIsReasoningCollapsed] = useState(false);
  const [reasoningTime, setReasoningTime] = useState<string>('');

  useEffect(() => {
    // Calculate reasoning time when reasoning content is available
    if (section.reasoning) {
      const words = section.reasoning.split(' ').length;
      const minutes = Math.round((words / 200) * 10) / 10; // Assuming 200 words per minute
      setReasoningTime(
        minutes < 1 
          ? `${Math.round(minutes * 60)} seconds` 
          : `${minutes} minute${minutes > 1 ? 's' : ''}`
      );
    }
  }, [section.reasoning]);

  return (
    <div className="pt-2 last:border-0">
      {/* Query message */}
      <div className="mb-1 flex items-start gap-3 justify-end">
        <div className="bg-blue-50/50 rounded-2xl rounded-tr-none px-4 py-2 max-w-[90%]">
          <p className="text-gray-800">{section.query}</p>
        </div>
      </div>

      {/* Search Results với chiều cao tăng lên */}
      {section.searchResults && section.searchResults.length > 0 && (
        <div className="ml-12 mb-4">
          <div className="text-sm text-gray-500 mb-2">Search Results:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2"> {/* Tăng max-height lên 300px */}
            {section.searchResults.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200"
              >
                <span className="text-xs font-medium text-gray-500">[{idx + 1}]</span>
                <div className="flex-grow">
                  <div className="font-medium text-gray-900 text-sm line-clamp-1">{result.title}</div>
                  <div className="text-gray-500 text-xs line-clamp-1">{result.content}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Loading States */}
      {section.isLoadingSources && (
        <div className="ml-12 mb-2">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bot response with collapsible reasoning */}
      <div className="mt-1 mb-4 flex items-start gap-3 justify-start">
        <div className="w-9 h-9 rounded-full bg-yellow-50/70 flex items-center justify-center flex-shrink-0 ml-0">
          <img src="/image.svg" alt="Chatbot Logo" className="w-6 h-6 object-cover rounded-full" />
        </div>
        
        <div className="bg-gray-50/70 rounded-2xl rounded-tl-none px-4 py-3 max-w-full w-[calc(100%-3rem)]">
          {section.isLoadingThinking ? (
            <div className="flex items-center gap-2">
              <div className="animate-pulse">Thinking</div>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Reasoning Section with Toggle */}
              {section.reasoning && (
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                    <span className="italic">
                      Reasoned in {reasoningTime}
                    </span>
                    <button 
                      onClick={() => setIsReasoningCollapsed(!isReasoningCollapsed)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title={isReasoningCollapsed ? "Show reasoning" : "Hide reasoning"}
                    >
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isReasoningCollapsed ? '-rotate-90' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {!isReasoningCollapsed && (
                    <div className="prose prose-sm text-gray-600 italic transition-all duration-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {section.reasoning}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {/* Response Section */}
              {section.response && (
                <div className="prose prose-blue max-w-none text-gray-900 text-justify">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.response}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Feedback buttons */}
          {section.response && (
            <div className="flex space-x-2 mt-6">
              <button className="flex items-center text-gray-400 hover:text-gray-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md-heavy">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.1318 2.50389C12.3321 2.15338 12.7235 1.95768 13.124 2.00775L13.5778 2.06447C16.0449 2.37286 17.636 4.83353 16.9048 7.20993L16.354 8.99999H17.0722C19.7097 8.99999 21.6253 11.5079 20.9313 14.0525L19.5677 19.0525C19.0931 20.7927 17.5124 22 15.7086 22H6C4.34315 22 3 20.6568 3 19V12C3 10.3431 4.34315 8.99999 6 8.99999H8C8.25952 8.99999 8.49914 8.86094 8.6279 8.63561L12.1318 2.50389ZM10 20H15.7086C16.6105 20 17.4008 19.3964 17.6381 18.5262L19.0018 13.5262C19.3488 12.2539 18.391 11 17.0722 11H15C14.6827 11 14.3841 10.8494 14.1956 10.5941C14.0071 10.3388 13.9509 10.0092 14.0442 9.70591L14.9932 6.62175C15.3384 5.49984 14.6484 4.34036 13.5319 4.08468L10.3644 9.62789C10.0522 10.1742 9.56691 10.5859 9 10.8098V19C9 19.5523 9.44772 20 10 20ZM7 11V19C7 19.3506 7.06015 19.6872 7.17071 20H6C5.44772 20 5 19.5523 5 19V12C5 11.4477 5.44772 11 6 11H7Z" fill="currentColor"/>
                </svg>
              </button>
              <button className="flex items-center text-gray-400 hover:text-gray-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md-heavy">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.8727 21.4961C11.6725 21.8466 11.2811 22.0423 10.8805 21.9922L10.4267 21.9355C7.95958 21.6271 6.36855 19.1665 7.09975 16.7901L7.65054 15H6.93226C4.29476 15 2.37923 12.4921 3.0732 9.94753L4.43684 4.94753C4.91145 3.20728 6.49209 2 8.29589 2H18.0045C19.6614 2 21.0045 3.34315 21.0045 5V12C21.0045 13.6569 19.6614 15 18.0045 15H16.0045C15.745 15 15.5054 15.1391 15.3766 15.3644L11.8727 21.4961ZM14.0045 4H8.29589C7.39399 4 6.60367 4.60364 6.36637 5.47376L5.00273 10.4738C4.65574 11.746 5.61351 13 6.93226 13H9.00451C9.32185 13 9.62036 13.1506 9.8089 13.4059C9.99743 13.6612 10.0536 13.9908 9.96028 14.2941L9.01131 17.3782C8.6661 18.5002 9.35608 19.6596 10.4726 19.9153L13.6401 14.3721C13.9523 13.8258 14.4376 13.4141 15.0045 13.1902V5C15.0045 4.44772 14.5568 4 14.0045 4ZM17.0045 13V5C17.0045 4.64937 16.9444 4.31278 16.8338 4H18.0045C18.5568 4 19.0045 4.44772 19.0045 5V12C19.0045 12.5523 18.5568 13 18.0045 13H17.0045Z" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={() => onCopy(section.response)}
                className="flex items-center text-gray-400 hover:text-gray-800"
                title="Copy response"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md-heavy">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 2C7.34315 2 6 3.34315 6 5V6H5C3.34315 6 2 7.34315 2 9V19C2 20.6569 3.34315 22 5 22H15C16.6569 22 18 20.6569 18 19V18H19C20.6569 18 22 16.6569 22 15V5C22 3.34315 20.6569 2 19 2H9ZM16 18V19C16 19.5523 15.5523 20 15 20H5C4.44772 20 4 19.5523 4 19V9C4 8.44772 4.44772 8 5 8H6V15C6 16.6569 7.34315 18 9 18H16ZM8 6H19C19.5523 6 20 6.44772 20 7V15C20 15.5523 19.5523 16 19 16H9C8.44772 16 8 15.5523 8 15V6Z" fill="currentColor"/>
                </svg>
              </button>
              <button className="flex items-center text-gray-400 hover:text-gray-800">
                <div className="flex items-center pb-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md">
                    <path d="M3.06957 10.8763C3.62331 6.43564 7.40967 3 12 3C14.2824 3 16.4028 3.85067 18.0118 5.25439V4C18.0118 3.44772 18.4595 3 19.0118 3C19.5641 3 20.0118 3.44772 20.0118 4V8C20.0118 8.55228 19.5641 9 19.0118 9H15C14.4477 9 14 8.55228 14 8C14 7.44772 14.4477 7 15 7H16.9571C15.6757 5.76379 13.9101 5 12 5C8.43108 5 5.48466 7.67174 5.0542 11.1237C4.98586 11.6718 4.48619 12.0607 3.93815 11.9923C3.39011 11.924 3.00123 11.4243 3.06957 10.8763ZM20.0618 12.0077C20.6099 12.076 20.9988 12.5757 20.9304 13.1237C20.3767 17.5644 16.5903 21 12 21C9.72322 21 7.60762 20.1535 5.99999 18.7559V20C5.99999 20.5523 5.55228 21 4.99999 21C4.44771 21 3.99999 20.5523 3.99999 20V16C3.99999 15.4477 4.44771 15 4.99999 15H8.99999C9.55228 15 9.99999 15.4477 9.99999 16C9.99999 16.5523 9.55228 17 8.99999 17H7.04285C8.32433 18.2362 10.0899 19 12 19C15.5689 19 18.5153 16.3283 18.9458 12.8763C19.0141 12.3282 19.5138 11.9393 20.0618 12.0077Z" fill="currentColor"/>
                  </svg>
                  <span className="overflow-hidden text-clip whitespace-nowrap text-sm" style={{ opacity: 0, paddingLeft: 0, width: 0, willChange: 'auto' }}>4o</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-sm">
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 9.29289C5.68342 8.90237 6.31658 8.90237 6.70711 9.29289L12 14.5858L17.2929 9.29289C17.6834 8.90237 18.3166 8.90237 18.7071 9.29289C19.0976 9.68342 19.0976 10.3166 18.7071 10.7071L12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071L5.29289 10.7071C4.90237 10.3166 4.90237 9.68342 5.29289 9.29289Z" fill="currentColor"/>
                  </svg>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
