'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ChatBot from './ChatBot';
import { useChatBot } from '@/contexts/ChatBotContext';

interface ChatBotWrapperProps {
  apiKey?: string;
}

const ChatBotWrapper: React.FC<ChatBotWrapperProps> = ({ apiKey }) => {
  const { isTriggered, resetTrigger } = useChatBot();
  const pathname = usePathname();

  // Hide chatbot on playground/test-bot pages
  const shouldHideChatbot = pathname?.includes('/test-bot') || pathname?.includes('/playground');

  if (shouldHideChatbot) {
    return null;
  }

  return (
    <ChatBot
      apiKey={apiKey}
      externalTrigger={isTriggered}
      onTriggered={resetTrigger}
    />
  );
};

export default ChatBotWrapper;
