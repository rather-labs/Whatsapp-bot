const { ecb } = require('@noble/ciphers/aes');

// Utility functions for PIN encryption/decryption
function encryptUserPin(pin, secret) {
  return ecb(Buffer.from(secret)).encrypt(Buffer.from(pin.toString())).toString();
}

function decryptUserPin(encryptedPin, secret) {
  return Number(ecb(Buffer.from(secret)).decrypt(Buffer.from(encryptedPin)));
}

module.exports = {
  encryptUserPin,
  decryptUserPin
}; 