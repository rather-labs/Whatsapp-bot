const { createPublicClient, http, createWalletClient, custom } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { sepolia, polygon } = require('viem/chains');
require('dotenv').config();

// Blockchain configuration
const NETWORK_CONFIG = {
  sepolia: {
    rpc: process.env.SEPOLIA_RPC || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    chain: sepolia,
    name: 'Sepolia Testnet'
  },
  polygon: {
    rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    chain: polygon,
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

// Vault contract configuration
const VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
const VAULT_ABI = [
  'function RegisterUser(uint256 user, address wallet, bytes calldata signature) external',
  'function userAddresses(uint256) view returns (address)',
  'function userRiskProfile(uint256) view returns (uint8)',
  'function userAuthProfile(uint256) view returns (uint8)',
  'function getUserAssets(uint256 user) external view returns (uint256)',
  'function getNonce(uint256 user) external view returns (uint256)',
  'function RELAYER_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)'
];

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