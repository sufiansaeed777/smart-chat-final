'use client';

import React from 'react';
import ChatBot from './ChatBot';
import { useChatBot } from '@/contexts/ChatBotContext';

interface ChatBotWrapperProps {
  apiKey?: string;
}

const ChatBotWrapper: React.FC<ChatBotWrapperProps> = ({ apiKey }) => {
  const { isTriggered, resetTrigger } = useChatBot();
  
  return (
    <ChatBot 
      apiKey={apiKey} 
      externalTrigger={isTriggered}
      onTriggered={resetTrigger}
    />
  );
};

export default ChatBotWrapper;
