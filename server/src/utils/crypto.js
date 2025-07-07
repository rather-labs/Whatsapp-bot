const { ecb } = require('@noble/ciphers/aes');
const { ethers } = require('ethers');

// Utility functions for PIN encryption/decryption
function encryptUserPin(pin, secret) {
  return ecb(Buffer.from(secret)).encrypt(Buffer.from(pin.toString())).toString();
}

function decryptUserPin(encryptedPin, secret) {
  return Number(ecb(Buffer.from(secret)).decrypt(Buffer.from(encryptedPin)));
}

// Generate new wallet
function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

module.exports = {
  encryptUserPin,
  decryptUserPin,
  generateWallet
}; 