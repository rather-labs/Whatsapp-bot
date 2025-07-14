import { ecb } from '@noble/ciphers/aes';

// Utility functions for PIN encryption/decryption
function encryptUserPin(pin: string | number, secret: string): string {
  return ecb(Buffer.from(secret)).encrypt(Buffer.from(pin.toString())).toString();
}

function decryptUserPin(encryptedPin: string, secret: string): number {
  return Number(ecb(Buffer.from(secret)).decrypt(Buffer.from(encryptedPin)));
}

export {
  encryptUserPin,
  decryptUserPin
}; 