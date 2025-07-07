const { createPublicClient, http, createWalletClient, custom, getContract, parseEther, formatEther, keccak256, toHex, stringToHex, getAddress } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { sepolia, polygon } = require('viem/chains');
const { publicClient, networkConfig } = require('../config/blockchain');
const TokenVaultWithRelayer = require('../config/TokenVaultWithRelayer.json');

class ContractService {
  constructor() {
    this.publicClient = publicClient;
    this.networkConfig = networkConfig;
    
    // Vault contract configuration
    this.VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
    this.VAULT_ABI = TokenVaultWithRelayer.abi;
    
    // Initialize vault contract
    if (this.VAULT_CONTRACT_ADDRESS) {
      this.vaultContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS,
        abi: this.VAULT_ABI,
        publicClient: this.publicClient
      });
    }
    
    // Relayer wallet (server wallet that can call RegisterUser)
    this.relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
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
   * Create EIP712 signature for user registration
   * @param {bigint} userId - The user ID
   * @param {string} walletAddress - The user's wallet address
   * @returns {Promise<object>} - Signature data
   */
  async createRegistrationSignature(userId, walletAddress) {
    if (!this.vaultContract) {
      throw new Error('Vault contract not configured');
    }

    // EIP712 domain
    const domain = {
      name: 'TokenVaultWithRelayer',
      version: '1',
      chainId: this.networkConfig.chain.id,
      verifyingContract: this.VAULT_CONTRACT_ADDRESS
    };

    // EIP712 types
    const types = {
      RegisterUser: [
        { name: 'user', type: 'uint256' },
        { name: 'wallet', type: 'address' }
      ]
    };

    // EIP712 message
    const message = {
      user: userId,
      wallet: getAddress(walletAddress)
    };

    // Create signature using viem
    const signature = await this.relayerWalletClient.signTypedData({
      domain,
      types,
      primaryType: 'RegisterUser',
      message
    });
    
    return {
      signature,
      domain,
      types,
      message
    };
  }

  /**
   * Register user on-chain
   * @param {string} whatsappNumber - The WhatsApp number
   * @param {string} walletAddress - The user's wallet address
   * @returns {Promise<object>} - Registration result
   */
  async registerUserOnChain(whatsappNumber, walletAddress) {
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

      // Create signature
      const { signature } = await this.createRegistrationSignature(userId, walletAddress);

      // Call RegisterUser function
      const hash = await this.relayerContract.write.RegisterUser([userId, getAddress(walletAddress), signature]);
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
}

module.exports = new ContractService(); 