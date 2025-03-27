'use client';

import ChatSection from '@/components/ChatSection/ChatSection';
import { useParams } from 'next/navigation';

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  return (
    <div className="flex-1 overflow-hidden">
      <ChatSection selectedModel="gpt-3.5-turbo" />
    </div>
  );
}