'use client';

import { ChatSection } from '@/components/ChatSection/ChatSection';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 overflow-hidden">
      <ChatSection 
        section={{
          query: '',
          response: '',
          reasoning: '',
          searchResults: [],
          isLoadingThinking: false,
          isLoadingSources: false
        }}
        onCopy={handleCopy}
      />
    </div>
  );
}