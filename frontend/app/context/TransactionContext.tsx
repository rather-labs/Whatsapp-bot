"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Call } from 'viem';

interface TransactionContextType {
  calls: Call[] | null;
  setCalls: (calls: Call[] | null) => void;
  success: boolean;
  setSuccess: (success: boolean) => void;
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  return (
    <TransactionContext.Provider value={{
      calls,
      setCalls,
      success,
      setSuccess,
      disabled,
      setDisabled,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
} 