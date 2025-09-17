'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatBotContextType {
  triggerChat: () => void;
  isTriggered: boolean;
  resetTrigger: () => void;
}

const ChatBotContext = createContext<ChatBotContextType | undefined>(undefined);

export const useChatBot = () => {
  const context = useContext(ChatBotContext);
  if (context === undefined) {
    throw new Error('useChatBot must be used within a ChatBotProvider');
  }
  return context;
};

interface ChatBotProviderProps {
  children: ReactNode;
}

export const ChatBotProvider: React.FC<ChatBotProviderProps> = ({ children }) => {
  const [isTriggered, setIsTriggered] = useState(false);

  const triggerChat = () => {
    setIsTriggered(true);
  };

  const resetTrigger = () => {
    setIsTriggered(false);
  };

  return (
    <ChatBotContext.Provider value={{ triggerChat, isTriggered, resetTrigger }}>
      {children}
    </ChatBotContext.Provider>
  );
};
