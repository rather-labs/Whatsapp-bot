const { createPublicClient, http, createWalletClient, custom, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base, baseSepolia } = require('viem/chains');
const TokenVaultWithRelayer = require('../utils/TokenVaultWithRelayer.json');
require('dotenv').config();

// Define Hardhat localhost chain
const hardhat = defineChain({
  id: 31337,
  name: 'Hardhat Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
});

// Blockchain configuration
const NETWORK_CONFIG = {
  baseSepolia: {
    rpc: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    chain: baseSepolia,
    name: 'Base Sepolia Testnet'
  },
  base: {
    rpc: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
    chain: base,
    name: 'Base Mainnet'
  },
  hardhat: {
    rpc: process.env.HARDHAT_RPC || 'http://127.0.0.1:8545',
    chain: hardhat,
    name: 'Hardhat Localhost'
  }
};

const currentNetwork = process.env.NETWORK || 'baseSepolia';
const networkConfig = NETWORK_CONFIG[currentNetwork];

// USDC contract configuration - Base Sepolia USDC
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7c'; // Base Sepolia USDC
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Vault contract configuration
const VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
const VAULT_ABI = TokenVaultWithRelayer.abi;

// Initialize public client
let publicClient;
try {
  publicClient = createPublicClient({
    chain: networkConfig.chain,
    transport: http(networkConfig.rpc)
  });
  console.log(`✅ Connected to ${networkConfig.name}`);
} catch (error) {
  console.error('❌ Failed to connect to blockchain:', error.message);
}

module.exports = {
  publicClient,
  networkConfig,
  USDC_CONTRACT_ADDRESS,
  USDC_ABI,
  VAULT_CONTRACT_ADDRESS,
  VAULT_ABI,
  currentNetwork
}; 