// Common types for the server

export interface User {
  whatsappNumber: string;
  username?: string;
  encryptedPin: string;
  walletAddress?: string;
  riskProfile: number;
  authProfile: number;
  walletBalance: number;
  vaultBalance: number;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userWhatsappNumber: string;
  txHash?: string;
  type: string;
  amount: number;
  recipient?: string;
  status: string;
  gasUsed?: number;
  gasPrice?: string;
  blockNumber?: number;
  createdAt: string;
}

export interface Contact {
  id: string;
  userWhatsappNumber: string;
  name: string;
  contactUserid: string;
  createdAt: string;
}

export interface VaultDeposit {
  id: string;
  userWhatsappNumber: string;
  amount: number;
  apy: number;
  status: string;
  createdAt: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
} 