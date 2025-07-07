const { ethers } = require('ethers');
require('dotenv').config();

// Blockchain configuration
const NETWORK_CONFIG = {
  sepolia: {
    rpc: process.env.SEPOLIA_RPC || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 11155111,
    name: 'Sepolia Testnet'
  },
  polygon: {
    rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon Mainnet'
  }
};

const currentNetwork = process.env.NETWORK || 'sepolia';
const networkConfig = NETWORK_CONFIG[currentNetwork];

// USDC contract configuration
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Sepolia USDC
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Initialize provider
let provider;
try {
  provider = new ethers.JsonRpcProvider(networkConfig.rpc);
  console.log(`✅ Connected to ${networkConfig.name}`);
} catch (error) {
  console.error('❌ Failed to connect to blockchain:', error.message);
}

module.exports = {
  provider,
  networkConfig,
  USDC_CONTRACT_ADDRESS,
  USDC_ABI,
  currentNetwork
}; 