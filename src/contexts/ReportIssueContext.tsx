'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReportIssueContextType {
  isOpen: boolean;
  botId: string | null;
  openModal: (botId?: string) => void;
  closeModal: () => void;
}

const ReportIssueContext = createContext<ReportIssueContextType | undefined>(undefined);

export const useReportIssue = () => {
  const context = useContext(ReportIssueContext);
  if (context === undefined) {
    throw new Error('useReportIssue must be used within a ReportIssueProvider');
  }
  return context;
};

interface ReportIssueProviderProps {
  children: ReactNode;
}

export const ReportIssueProvider: React.FC<ReportIssueProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);

  const openModal = (newBotId?: string) => {
    setBotId(newBotId || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setBotId(null);
  };

  return (
    <ReportIssueContext.Provider value={{ isOpen, botId, openModal, closeModal }}>
      {children}
    </ReportIssueContext.Provider>
  );
};
