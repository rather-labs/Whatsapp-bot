"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Message, Domain } from '../utils/dataStructures';

interface SignatureContextType {
  signature: `0x${string}` | null;
  setSignature: (signature: `0x${string}` | null) => void;
  isSignatureValid: boolean;
  setIsSignatureValid: (valid: boolean) => void;
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
  message: Message | null;
  setMessage: (message: Message | null) => void;
  domain: Domain | null;
  setDomain: (domain: Domain | null) => void;
  primaryType: string;
  setPrimaryType: (primaryType: string) => void;
  label: string;
  setLabel: (label: string) => void;
}

const SignatureContext = createContext<SignatureContextType | undefined>(undefined);

export function SignatureProvider({ children }: { children: ReactNode }) {
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [primaryType, setPrimaryType] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  return (
    <SignatureContext.Provider value={{
      signature,
      setSignature,
      isSignatureValid,
      setIsSignatureValid,
      disabled,
      setDisabled,
      message,
      setMessage,
      domain,
      setDomain,
      primaryType,
      setPrimaryType,
      label,
      setLabel,
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