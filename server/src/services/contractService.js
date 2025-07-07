const { createPublicClient, http, createWalletClient, custom, getContract, parseEther, formatEther, keccak256, toHex, stringToHex, getAddress } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base, baseSepolia } = require('viem/chains');
const { publicClient, networkConfig, currentNetwork, VAULT_ABI } = require('../config/blockchain');

class ContractService {
  constructor() {
    this.publicClient = publicClient;
    this.networkConfig = networkConfig;
    
    // Vault contract configuration
    this.VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
    this.VAULT_ABI = VAULT_ABI;
    
    // Initialize vault contract
    if (this.VAULT_CONTRACT_ADDRESS) {
      this.vaultContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS,
        abi: this.VAULT_ABI,
        publicClient: this.publicClient
      });
    }
    
    // Relayer wallet (server wallet that can call RegisterUser)
    this.relayerPrivateKey = process.env.PRIVATE_KEY;
    if (this.relayerPrivateKey) {
      this.relayerAccount = privateKeyToAccount(this.relayerPrivateKey);
      this.relayerWalletClient = createWalletClient({
        account: this.relayerAccount,
        chain: this.networkConfig.chain,
        transport: http(this.networkConfig.rpc)
      });
      this.relayerContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS,
        abi: this.VAULT_ABI,
        walletClient: this.relayerWalletClient
      });
    }
  }

  /**
   * Generate a user ID from WhatsApp number
   * @param {string} whatsappNumber - The WhatsApp number
   * @returns {bigint} - User ID as uint256
   */
  generateUserId(whatsappNumber) {
    // Remove any non-numeric characters and convert to number
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    // Use a hash function to generate a unique user ID
    const hash = keccak256(stringToHex(cleanNumber));
    // Convert to uint256 (take first 32 bytes)
    return BigInt(hash.slice(0, 66)); // 0x + 64 hex chars = 66 chars
  }

  /**
   * Register user on-chain
   * @param {string} whatsappNumber - The WhatsApp number
   * @param {string} walletAddress - The user's wallet address
   * @param {string} permit - The permit signature to allow the vault to manage assets from the user's wallet
   * @returns {Promise<object>} - Registration result
   */
  async registerUserOnChain(whatsappNumber, walletAddress, permit) {
    try {
      if (!this.relayerContract) {
        throw new Error('Relayer wallet not configured');
      }

      if (!getAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      // Generate user ID
      const userId = this.generateUserId(whatsappNumber);
      
      // Check if user is already registered
      const existingAddress = await this.vaultContract.read.userAddresses([userId]);
      if (existingAddress !== '0x0000000000000000000000000000000000000000') {
        throw new Error('User already registered on-chain');
      }

      // Call RegisterUser function
      const hash = await this.relayerContract.write.RegisterUser([userId, getAddress(walletAddress), permit]);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      console.log(`✅ User registered on-chain: User ID ${userId}, Wallet ${walletAddress}`);
      console.log(`Transaction hash: ${receipt.transactionHash}`);

      return {
        success: true,
        userId: userId.toString(),
        walletAddress,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ On-chain registration failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is registered on-chain
   * @param {string} whatsappNumber - The WhatsApp number
   * @returns {Promise<boolean>} - Whether user is registered
   */
  async isUserRegisteredOnChain(whatsappNumber) {
    try {
      const userId = this.generateUserId(whatsappNumber);
      const walletAddress = await this.vaultContract.read.userAddresses([userId]);
      return walletAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error('Error checking on-chain registration:', error);
      return false;
    }
  }

  /**
   * Get user's on-chain data
   * @param {string} whatsappNumber - The WhatsApp number
   * @returns {Promise<object>} - User's on-chain data
   */
  async getUserOnChainData(whatsappNumber) {
    try {
      const userId = this.generateUserId(whatsappNumber);
      
      const [walletAddress, riskProfile, authProfile, assets] = await Promise.all([
        this.vaultContract.read.userAddresses([userId]),
        this.vaultContract.read.userRiskProfile([userId]),
        this.vaultContract.read.userAuthProfile([userId]),
        this.vaultContract.read.getUserAssets([userId])
      ]);

      return {
        userId: userId.toString(),
        walletAddress,
        riskProfile: riskProfile.toString(),
        authProfile: authProfile.toString(),
        assets: assets.toString(),
        isRegistered: walletAddress !== '0x0000000000000000000000000000000000000000'
      };
    } catch (error) {
      console.error('Error getting on-chain user data:', error);
      throw error;
    }
  }

  /**
   * Get current network information
   * @returns {object} - Network information
   */
  getNetworkInfo() {
    return {
      network: currentNetwork,
      chainId: this.networkConfig.chain.id,
      name: this.networkConfig.name,
      rpc: this.networkConfig.rpc
    };
  }
}

module.exports = new ContractService(); 