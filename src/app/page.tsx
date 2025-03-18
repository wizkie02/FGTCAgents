'use client';

import { useState } from 'react';
import { ChatSection } from '../components/ChatSection/ChatSection';
import { TavilyModal } from '../components/Modal/TavilyModal';
import { ChatInput } from '../components/ChatInput/ChatInput';
import { useChat } from '../hooks/useChat';
import { useUpload } from '../hooks/useUpload';
import { TopBar } from '../components/TopBar/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { SuggestionType } from '@/types/types';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [showTavilyModal, setShowTavilyModal] = useState(false);
  const [selectedMessageData, setSelectedMessageData] = useState<{tavily?: any}>({});
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const {
    messages,
    input,
    isLoading,
    error,
    chatSections,
    setInput,
    handleSubmit,
    hasSubmitted
  } = useChat(selectedModel, searchEnabled);

  const {
    selectedFile,
    uploadProgress,
    handleFileChange
  } = useUpload();

  const suggestions: SuggestionType[] = [
    { label: "Podcast Outline", prefix: "Create a detailed podcast outline for: " },
    { label: "YouTube Video Research", prefix: "Research and outline a YouTube video about: " },
    { label: "Short Form Hook Ideas", prefix: "Generate engaging hook ideas for short-form content about: " },
    { label: "Newsletter Draft", prefix: "Write a newsletter draft about: " }
  ];

  const handleSuggestionClick = (suggestion: SuggestionType) => {
    setSelectedSuggestion(suggestion.label);
    if (input) {
      setInput(suggestion.prefix + input);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const rerunLastQuery = async () => {
    if (chatSections.length > 0) {
      const lastSection = chatSections[chatSections.length - 1];
      setInput(lastSection.query);
      // Đợi state update
      setTimeout(() => {
        handleSubmit(new Event('submit') as any);
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {hasSubmitted && <div className="chat-background" />}
      <TopBar 
        selectedModel={selectedModel} 
        setSelectedModel={setSelectedModel}
        rerunLastQuery={rerunLastQuery}
        lastQuery={chatSections.length > 0 ? chatSections[chatSections.length - 1].query : ''}
      />
      
      <div className="pt-14 min-h-[calc(100vh-3.5rem)] flex flex-col">
        <main className="flex-1 max-w-[700px] mx-auto w-full px-4 py-5 pb-16 flex flex-col justify-start">
          <AnimatePresence>
            {!hasSubmitted ? (
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-12">
                  <div className="inline-block px-4 py-1.5 shining-bg text-white rounded-full text-sm font-medium mt-8">
                    Powered by For Generations To Come
                  </div>

                  <h1 className="text-5xl font-serif text-gray-900 mb-4 tracking-tight mt-8">
                    Your AI Powered Content Research Assistant
                  </h1>
                  <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
                    Do research for content in seconds, so you can spend more time going viral.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-[700px] mx-4">
                  <div className="relative bg-gray-50 rounded-xl shadow-md border border-gray-300 min-h-[120px]">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a question..."
                      className="w-full p-5 pb-5 pr-5 rounded-xl border-2 border-transparent focus:border-gray-100 focus:shadow-lg focus:outline-none resize-none bg-gray-50 transition-all duration-200"
                      style={{ minHeight: '50px', maxHeight: '300px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    {/* Input buttons */}
                    <div className="absolute left-3 bottom-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSearchEnabled(!searchEnabled)}
                        className={`p-2 rounded-lg ${searchEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'} hover:bg-opacity-90`}
                        title={searchEnabled ? 'Tắt tìm kiếm web' : 'Bật tìm kiếm web'}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z" />
                        </svg>
                      </button>

                      <label className={`p-2 rounded-lg cursor-pointer ${uploadProgress > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".txt,.pdf,.doc,.docx"
                        />
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="absolute right-3 bottom-3 px-6 py-2.5 bg-[#FFCB19] text-white rounded-lg hover:bg-[#E6B80E] disabled:opacity-50"
                    >
                      {isLoading ? 'Thinking...' : 'Send'}
                    </button>
                  </div>

                  {/* Suggestions */}
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.label}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedSuggestion === suggestion.label
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6 pb-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {chatSections.map((section, index) => (
                  <ChatSection 
                    key={index}
                    section={section}
                    onCopy={handleCopy}
                  />
                ))}

                <ChatInput
                  input={input}
                  setInput={setInput}
                  isLoading={isLoading}
                  handleSubmit={handleSubmit}
                  searchEnabled={searchEnabled}
                  setSearchEnabled={setSearchEnabled}
                  handleFileChange={async (e) => { await handleFileChange(e); }}
                  uploadProgress={uploadProgress}
                  selectedFile={selectedFile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <TavilyModal 
        isOpen={showTavilyModal}
        onClose={() => setShowTavilyModal(false)}
        data={selectedMessageData?.tavily}
      />
    </div>
  );
}