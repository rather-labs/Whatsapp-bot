import { createPublicClient, http, createWalletClient, parseAbi, getContract, parseEther, formatEther, keccak256, toHex, stringToHex, getAddress, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { publicClient, networkConfig, currentNetwork, VAULT_ABI } from '../config/blockchain';

interface RegistrationResult {
  success: boolean;
  userId: string;
  walletAddress: string;
  transactionHash: string;
  blockNumber: bigint;
}

interface UserOnChainData {
  userId: string;
  walletAddress: string;
  riskProfile: string;
  authProfile: string;
  assets: string;
  isRegistered: boolean;
}

interface NetworkInfo {
  network: string;
  chainId: number;
  name: string;
  rpc: string;
}

class ContractService {
  private publicClient: PublicClient | undefined;
  private networkConfig: any;
  private VAULT_CONTRACT_ADDRESS: string | undefined;
  private VAULT_ABI: any;
  private vaultContract: any;
  private relayerPrivateKey: string | undefined;
  private relayerAccount: any;
  private relayerWalletClient: WalletClient | undefined;
  private relayerContract: any;

  constructor() {
    this.publicClient = publicClient;
    this.networkConfig = networkConfig;
    
    // Vault contract configuration
    this.VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
    this.VAULT_ABI = VAULT_ABI;
    
    // Initialize vault contract
    if (this.VAULT_CONTRACT_ADDRESS && this.publicClient) {
      this.vaultContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS as `0x${string}`,
        abi: this.VAULT_ABI,
        client: this.publicClient
      });
    }
    
    // Relayer wallet (server wallet that can call RegisterUser)
    this.relayerPrivateKey = process.env.PRIVATE_KEY;
    if (this.relayerPrivateKey && this.networkConfig) {
      this.relayerAccount = privateKeyToAccount(this.relayerPrivateKey as `0x${string}`);
      this.relayerWalletClient = createWalletClient({
        account: this.relayerAccount,
        chain: this.networkConfig.chain,
        transport: http(this.networkConfig.rpc)
      });
      this.relayerContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS as `0x${string}`,
        abi: this.VAULT_ABI,
        client: this.relayerWalletClient as WalletClient
      });
    }
  }

  /**
   * Generate a user ID from WhatsApp number
   * @param whatsappNumber - The WhatsApp number
   * @returns User ID as uint256
   */
  generateUserId(whatsappNumber: string): bigint {
    // Remove any non-numeric characters and convert to number
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    // Convert to uint256 (take first 32 bytes)
    return BigInt(cleanNumber); 
  }
  
  /**
   * Check if user is registered on-chain
   * @param whatsappNumber - The WhatsApp number
   * @returns Whether user is registered
   */
  async isUserRegisteredOnChain(whatsappNumber: string): Promise<boolean> {
    try {
      const userId = this.generateUserId(whatsappNumber);
      const walletAddress = await this.vaultContract.read.getUserWallet([userId]);
      return walletAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error('Error checking on-chain registration:', error);
      return false;
    }
  }

  /**
   * Register user on-chain
   * @param whatsappNumber - The WhatsApp number
   * @param walletAddress - The user's wallet address
   * @returns Registration result
   */
  async registerUserOnChain(whatsappNumber: string, walletAddress: string): Promise<RegistrationResult> {
    try {
      if (!this.relayerContract) {
        throw new Error('Relayer wallet not configured');
      }

      if (!getAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }
      
      // Check if user is already registered
      if (await this.isUserRegisteredOnChain(whatsappNumber)) {
        throw new Error('User already registered on-chain');
      }

      // Generate user ID
      const userId = this.generateUserId(whatsappNumber);
      // Call RegisterUser function
      const hash = await this.relayerContract.write.RegisterUser([userId, getAddress(walletAddress)]);
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
   * Get user's on-chain data
   * @param whatsappNumber - The WhatsApp number
   * @returns User's on-chain data
   */
  async getUserOnChainData(whatsappNumber: string): Promise<UserOnChainData> {
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
   * @returns Network information
   */
  getNetworkInfo(): NetworkInfo {
    return {
      network: currentNetwork,
      chainId: this.networkConfig.chain.id,
      name: this.networkConfig.name,
      rpc: this.networkConfig.rpc
    };
  }
}

export default new ContractService(); 