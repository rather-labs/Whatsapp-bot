"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Call, TransactionReceipt } from 'viem';

interface TransactionContextType {
  calls: Call[] | null;
  setCalls: (calls: Call[] | null) => void;
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
  label: string;
  setLabel: (label: string) => void;
  receipts: TransactionReceipt[] | null;
  setReceipts: (receipts: TransactionReceipt[] | null) => void;
  success: boolean;
  setSuccess: (success: boolean) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [label, setLabel] = useState<string>('Sign transaction');
  const [receipts, setReceipts] = useState<TransactionReceipt[] | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  return (
    <TransactionContext.Provider value={{
      calls,
      setCalls,
      disabled,
      setDisabled,
      label,
      setLabel,
      receipts,
      setReceipts,
      success,
      setSuccess,
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