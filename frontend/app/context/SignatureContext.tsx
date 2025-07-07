"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface SignatureContextType {
  signature: string | null;
  setSignature: (signature: string | null) => void;
  isSignatureValid: boolean;
  setIsSignatureValid: (valid: boolean) => void;
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
}

const SignatureContext = createContext<SignatureContextType | undefined>(undefined);

export function SignatureProvider({ children }: { children: ReactNode }) {
  const [signature, setSignature] = useState<string | null>(null);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  return (
    <SignatureContext.Provider value={{
      signature,
      setSignature,
      isSignatureValid,
      setIsSignatureValid,
      disabled,
      setDisabled
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