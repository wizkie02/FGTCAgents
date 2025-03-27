'use client';

import { useState, useRef } from 'react';
import type { Message, ChatSection, SearchResult, TavilyResponse } from '../types/types';

function parseModelResponse(data: any, provider: string) {
  switch (provider) {
    case 'anthropic':
      return data.content[0].text;
    case 'google':
      return data.candidates[0].content.parts[0].text;
    case 'deepseek':
    case 'meta':
    case 'mistral':
    case 'openai':
      return data.choices[0].message.content;
    default:
      throw new Error('Unsupported model provider');
  }
}

function getProviderFromModel(model: string): string {
  if (model.startsWith('gpt-') || model.startsWith('openai-') || model.startsWith('chatgpt-')) {
    return 'openai';
  }
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  if (model.startsWith('gemini-')) {
    return 'google';
  }
  if (model.startsWith('deepseek-')) {
    return 'deepseek';
  }
  if (model.startsWith('llama-')) {
    return 'meta';
  }
  if (model.startsWith('mistral-') || model.startsWith('mixtral-')) {
    return 'mistral';
  }
  return 'openai'; // default to openai
}

export const useChat = (selectedModel: string, searchEnabled: boolean) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatSections, setChatSections] = useState<ChatSection[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setHasSubmitted(true);

    const userInput = input;
    setInput('');

    const sectionIndex = chatSections.length;
    const newSection: ChatSection = {
      query: userInput,
      searchResults: [],
      reasoning: '',
      response: '',
      isLoadingSources: searchEnabled,
      isLoadingThinking: true
    };

    setChatSections(prev => [...prev, newSection]);

    try {
      let searchContext = '';
      let searchResults: SearchResult[] = [];

      // Bước 1: Tìm kiếm Tavily
      if (searchEnabled) {
        const searchResponse = await fetch('/api/tavily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userInput.trim(),
            includeImages: true,
            includeImageDescriptions: true
          })
        });

        if (!searchResponse.ok) {
          throw new Error('Failed to fetch search results');
        }

        const searchData = await searchResponse.json();
        searchResults = searchData.results || [];

        // Format search context từ kết quả Tavily
        searchContext = searchResults
          .map((result: SearchResult, index: number) => 
            `[Source ${index + 1}]: ${result.title}\n${result.content}\nURL: ${result.url}\n`
          )
          .join('\n\n');

        // Lưu kết quả tìm kiếm vào section
        setChatSections(prev => {
          const updated = [...prev];
          updated[sectionIndex] = {
            ...newSection,
            searchResults: searchResults, // Lưu searchResults
            isLoadingSources: false
          };
          return updated;
        });
      }

      // Bước 2: Chỉ gọi GPT sau khi có kết quả tìm kiếm (nếu searchEnabled)
      const messages: Message[] = [
        { role: 'user', content: userInput }
      ];
      
      if (searchEnabled && searchContext) {
        messages.push({
          role: 'system',
          content: `Use this research data to provide a comprehensive response:\n${searchContext}`
        });
      }

      // Gọi GPT với context đầy đủ
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: selectedModel,
          searchEnabled
        })
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let accumulatedReasoning = '';
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.choices?.[0]?.delta) {
                const { content, reasoning_content } = data.choices[0].delta;
                
                if (reasoning_content) {
                  accumulatedReasoning += reasoning_content;
                }
                
                if (content) {
                  accumulatedResponse += content;
                }

                setChatSections(prev => {
                  const updated = [...prev];
                  updated[sectionIndex] = {
                    ...updated[sectionIndex],
                    reasoning: accumulatedReasoning,
                    response: accumulatedResponse,
                    isLoadingThinking: false,
                  };
                  return updated;
                });
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setChatSections(prev => {
        const updated = [...prev];
        updated[sectionIndex] = {
          ...newSection,
          error: err instanceof Error ? err.message : 'An error occurred',
          isLoadingThinking: false,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processMessageStream = async (response: Response) => {
    const data = await response.json();
    const provider = getProviderFromModel(selectedModel);
    const content = parseModelResponse(data, provider);
    
    // Update messages with the response
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content }
    ]);
    
    setIsLoading(false);
  };

  return {
    messages,
    input,
    isLoading,
    error,
    chatSections,
    currentReasoning,
    currentSearchResults,
    setInput,
    handleSubmit,
    hasSubmitted,
  };
};
