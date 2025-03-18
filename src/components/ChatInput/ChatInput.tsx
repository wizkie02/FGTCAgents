'use client';
import { useRef, useEffect } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  searchEnabled: boolean;
  setSearchEnabled: (enabled: boolean) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadProgress: number;
  selectedFile: File | null;
}

export const ChatInput = ({
  input,
  setInput,
  isLoading,
  handleSubmit,
  searchEnabled,
  setSearchEnabled,
  handleFileChange,
  uploadProgress,
  selectedFile
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add textarea resize effect
  useEffect(() => {
    if (textareaRef.current) {
      const defaultHeight = 100; // Tăng chiều cao mặc định
      textareaRef.current.style.height = `${defaultHeight}px`;
      
      if (!input.trim() || textareaRef.current.scrollHeight <= defaultHeight) {
        textareaRef.current.style.height = `${defaultHeight}px`;
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        const newHeight = Math.min(250, Math.max(defaultHeight, textareaRef.current.scrollHeight));
        textareaRef.current.style.height = `${newHeight}px`;
        textareaRef.current.style.overflowY = newHeight === 250 && textareaRef.current.scrollHeight > 250 ? 'auto' : 'hidden';
      }
    }
  }, [input]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white py-3">
      <form onSubmit={handleSubmit} className="max-w-[700px] mx-auto px-4">
        <div className="relative bg-gray-50 rounded-xl shadow-md border border-gray-300">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="w-full p-6 pr-32 rounded-xl border-2 border-transparent focus:border-gray-130 focus:shadow-lg focus:outline-none resize-none min-h-[130px] max-h-[250px] bg-gray-50 transition-all duration-200 overflow-hidden text-base"
          />
          
          <div className="absolute left-3 bottom-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchEnabled(!searchEnabled)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                searchEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              } hover:bg-opacity-90`}
              title={searchEnabled ? 'Turn off web search' : 'Turn on web search'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </button>

            <label
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                uploadProgress > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              } cursor-pointer relative overflow-hidden`}
              title={selectedFile ? selectedFile.name : "Attach file"}
            >
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.pdf,.doc,.docx"
              />
              {uploadProgress > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full absolute">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium relative z-10">{uploadProgress}%</span>
                </div>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 px-6 py-2.5 bg-[#FFCB19] text-white rounded-lg hover:bg-[#E6B80E] active:bg-[#D1A00B] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};
