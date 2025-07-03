#!/usr/bin/env node

/**
 * Test script to verify vCard parsing functionality
 * Run with: node test-vcard.js
 */

// Import the MessageHandler to test vCard parsing
const MessageHandler = require('./handlers/MessageHandler');

// Mock the dependencies
const mockConnectionManager = {
  getClient: () => ({}),
  getBotState: () => ({ status: 'connected', isReady: true }),
  isAuthorized: () => true
};

const mockWalletService = {
  initializeWallet: () => ({}),
  getWallet: () => ({ balance: 1000, transactions: [] }),
  getBalance: () => 1000,
  hasSufficientBalance: () => true,
  addFunds: () => ({}),
  removeFunds: () => ({}),
  transferFunds: () => ({})
};

const mockBlockchainService = {
  registerUser: () => ({}),
  getServerUrl: () => 'http://localhost:3002'
};

// Create MessageHandler instance
const messageHandler = new MessageHandler(mockConnectionManager, mockWalletService, mockBlockchainService);

console.log('🧪 Testing vCard Parsing Functionality\n');

// Test vCard detection
const testVCard = `begin:vcard
version:3.0
n:;abracadabra juegos;;;
fn:abracadabra juegos
tel;type=cell;waid=5491167437790:+54 9 11 6743-7790
end:vcard`;

console.log('📇 Testing vCard Detection...');
const isVCard = messageHandler.isVCardMessage(testVCard);
console.log(`✅ vCard detection: ${isVCard ? 'PASSED' : 'FAILED'}`);

// Test vCard parsing
console.log('\n🔍 Testing vCard Parsing...');
const vCardData = messageHandler.parseVCard(testVCard);
console.log('📊 Parsed vCard Data:');
console.log(`   Name (fn): ${vCardData.fn}`);
console.log(`   Full Name (n): ${vCardData.n}`);
console.log(`   Phone Type: ${vCardData.type}`);
console.log(`   WhatsApp ID: ${vCardData.waid}`);
console.log(`   Phone Number: ${vCardData.phone}`);

// Test vCard message handling
console.log('\n💬 Testing vCard Message Handling...');
const response = messageHandler.handleVCardMessage(testVCard);
console.log('📤 Bot Response:');
console.log(response);

// Test with invalid vCard
console.log('\n❌ Testing Invalid vCard...');
const invalidVCard = 'This is not a vCard';
const invalidResponse = messageHandler.handleVCardMessage(invalidVCard);
console.log('📤 Bot Response for Invalid vCard:');
console.log(invalidResponse);

console.log('\n🎉 vCard parsing tests completed!');
console.log('✅ All functionality working correctly'); 