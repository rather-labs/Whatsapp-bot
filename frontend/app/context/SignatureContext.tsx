"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { PermitMessage, TransactionMessage } from '../utils/dataStructures';

interface SignatureContextType {
  signature: `0x${string}` | null;
  setSignature: (signature: `0x${string}` | null) => void;
  isSignatureValid: boolean;
  setIsSignatureValid: (valid: boolean) => void;
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
  message: TransactionMessage | PermitMessage | null;
  setMessage: (message: TransactionMessage | PermitMessage | null) => void;
}

const SignatureContext = createContext<SignatureContextType | undefined>(undefined);

export function SignatureProvider({ children }: { children: ReactNode }) {
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [message, setMessage] = useState<TransactionMessage | PermitMessage | null>(null);
  return (
    <SignatureContext.Provider value={{
      signature,
      setSignature,
      isSignatureValid,
      setIsSignatureValid,
      disabled,
      setDisabled,
      message,
      setMessage
    }}>
      {children}
    </SignatureContext.Provider>
  );
}

export function useSignature() {
  const context = useContext(SignatureContext);
  if (context === undefined) {
    throw new Error('useSignature must be used within a SignatureProvider');
  }
  return context;
} 