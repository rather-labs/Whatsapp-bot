"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentNetwork = exports.VAULT_ABI = exports.VAULT_CONTRACT_ADDRESS = exports.USDC_ABI = exports.USDC_CONTRACT_ADDRESS = exports.networkConfig = exports.publicClient = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const TokenVaultWithRelayer_json_1 = __importDefault(require("../utils/TokenVaultWithRelayer.json"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Define Hardhat localhost chain
const hardhat = (0, viem_1.defineChain)({
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
        chain: chains_1.baseSepolia,
        name: 'Base Sepolia Testnet'
    },
    base: {
        rpc: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
        chain: chains_1.base,
        name: 'Base Mainnet'
    },
    hardhat: {
        rpc: process.env.HARDHAT_RPC || 'http://127.0.0.1:8545',
        chain: hardhat,
        name: 'Hardhat Localhost'
    }
};
const currentNetwork = process.env.NETWORK || 'baseSepolia';
exports.currentNetwork = currentNetwork;
const networkConfig = NETWORK_CONFIG[currentNetwork];
exports.networkConfig = networkConfig;
// USDC contract configuration - Base Sepolia USDC
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7c'; // Base Sepolia USDC
exports.USDC_CONTRACT_ADDRESS = USDC_CONTRACT_ADDRESS;
const USDC_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
];
exports.USDC_ABI = USDC_ABI;
// Vault contract configuration
const VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
exports.VAULT_CONTRACT_ADDRESS = VAULT_CONTRACT_ADDRESS;
const VAULT_ABI = TokenVaultWithRelayer_json_1.default.abi;
exports.VAULT_ABI = VAULT_ABI;
// Initialize public client
let publicClient;
try {
    if (networkConfig) {
        exports.publicClient = publicClient = (0, viem_1.createPublicClient)({
            chain: networkConfig.chain,
            transport: (0, viem_1.http)(networkConfig.rpc)
        });
        console.log(`✅ Connected to ${networkConfig.name}`);
    }
}
catch (error) {
    console.error('❌ Failed to connect to blockchain:', error instanceof Error ? error.message : 'Unknown error');
}
//# sourceMappingURL=blockchain.js.map