'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReportIssueContextType {
  isOpen: boolean;
  openModal: () => void;
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

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <ReportIssueContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ReportIssueContext.Provider>
  );
};
