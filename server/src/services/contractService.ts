import { 
    createWalletClient, 
    http, 
    getContract, 
    getAddress, 
    type PublicClient, 
    type WalletClient, 
    type Abi,
    type Account,
    erc20Abi, 
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { publicClient, networkConfig, VAULT_ABI } from '../config/blockchain';
import { isValidAddress } from '../utils/vault';

interface RegistrationResult {
  success: boolean;
  userId: string;
  walletAddress: string;
  transactionHash: string;
  blockNumber: string;
}
interface TransactionResult {
    success: boolean;
    userId: string;
    functionName: string;
    transactionHash: string;
    blockNumber: string;
  }

interface UserOnChainData {
  userId: string;
  walletAddress: string;
  riskProfile: string;
  authProfile: string;
  authThreshold: string;
  vaultBalance: string;
  walletBalance: string;
}

class ContractService {
  private publicClient: PublicClient | undefined;
  private networkConfig: any;
  private VAULT_CONTRACT_ADDRESS: string | undefined;
  private VAULT_ABI: Abi;
  private vaultContract: any;
  private relayerPrivateKey: string | undefined;
  private relayerAccount: Account;
  private relayerWalletClient: WalletClient | undefined;
  private relayerContract: any;
  private USDC_CONTRACT_ADDRESS: string | undefined;
  private USDC_ABI: Abi = erc20Abi;
  private usdcContract: any;

  constructor() {
    this.publicClient = publicClient;
    this.networkConfig = networkConfig;
    
    // Vault contract configuration
    this.VAULT_CONTRACT_ADDRESS = process.env.VAULT_CONTRACT_ADDRESS;
    this.VAULT_ABI = VAULT_ABI as Abi;
    
    // Initialize vault contract
    if (this.VAULT_CONTRACT_ADDRESS && this.publicClient) {
      // @ts-ignore - viem client type compatibility issue
      this.vaultContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS as `0x${string}`,
        abi: this.VAULT_ABI,
        // @ts-ignore - viem client type compatibility issue
        client: this.publicClient
      });
    }
    // USDC contract configuration
    this.USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
    this.USDC_ABI = erc20Abi;
    if (this.USDC_CONTRACT_ADDRESS && this.publicClient) {
      // @ts-ignore - viem client type compatibility issue
      this.usdcContract = getContract({
        address: this.USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: this.USDC_ABI,
        // @ts-ignore - viem client type compatibility issue
        client: this.publicClient
      });
    }

    // Relayer wallet (server wallet that can act as relayer)
    this.relayerPrivateKey = process.env.PRIVATE_KEY;
    if (this.relayerPrivateKey && this.networkConfig) {
      this.relayerAccount = privateKeyToAccount(this.relayerPrivateKey as `0x${string}`);
      this.relayerWalletClient = createWalletClient({
        account: this.relayerAccount,
        chain: this.networkConfig.chain,
        transport: http(this.networkConfig.rpc)
      }) as unknown as WalletClient;
      this.relayerContract = getContract({
        address: this.VAULT_CONTRACT_ADDRESS as `0x${string}`,
        abi: this.VAULT_ABI,
        // @ts-ignore - viem client type compatibility issue
        client: this.relayerWalletClient
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
   * Get the decimals of the USDC token
   * @returns Decimals as number
   */
    async getDecimals(): Promise<number> {
      return Number(await this.usdcContract.read.decimals());
    }
  
  /**
   * Check if user is registered on-chain
   * @param whatsappNumber - The WhatsApp number
   * @returns Whether user is registered
   */
  async isUserRegisteredOnChain(whatsappNumber: string): Promise<boolean> {
    const userId = this.generateUserId(whatsappNumber);
    const walletAddress = await this.vaultContract.read.getUserWallet([userId]);
    return walletAddress !== '0x0000000000000000000000000000000000000000';
  }

  /**
   * Register user on-chain
   * @param whatsappNumber - The WhatsApp number
   * @param walletAddress - The user's wallet address
   * @returns Registration result
   */
  async registerUserOnChain(whatsappNumber: string, walletAddress: string): Promise<RegistrationResult> {
    if (!this.relayerContract) {
      throw new Error('❌ Relayer wallet not configured');
    }
    if (!getAddress(walletAddress)) {
      throw new Error('❌ Invalid wallet address');
    }
    
    // Check if user is already registered
    if (await this.isUserRegisteredOnChain(whatsappNumber)) {
      throw new Error('❌ User already registered on-chain');
    }
    // Generate user ID
    const userId = this.generateUserId(whatsappNumber);
    // Call RegisterUser function
    const hash = await this.relayerContract.write.registerUser([userId, getAddress(walletAddress)]);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ User registered on-chain: User ID ${userId}, Wallet ${walletAddress}`);
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    return {
      success: true,
      userId: userId.toString(),
      walletAddress,
      transactionHash: receipt.transactionHash.toString(),
      blockNumber: Number(receipt.blockNumber).toString()
    };
  }

  /**
   * Get user's on-chain data
   * @param whatsappNumber - The WhatsApp number
   * @returns User's on-chain data
   */
  async getUserOnChainData(whatsappNumber: string): Promise<UserOnChainData> {
    const userId = this.generateUserId(whatsappNumber);

    const walletAddress = await this.vaultContract.read.getUserWallet([userId]);
      
    if (walletAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('❌ User not registered on-chain');
    }
    const [riskProfile, authProfile, authThreshold, assets] = await Promise.all([
      this.vaultContract.read.getUserRiskProfile([userId]),
        this.vaultContract.read.getUserAuthProfile([userId]),
        this.vaultContract.read.getUserAuthThreshold([userId]),
        this.vaultContract.read.getUserAssets([userId])
    ]);

    const decimals = Number(await this.usdcContract.read.decimals());
    const walletBalance = Number(await this.usdcContract.read.balanceOf([walletAddress]))/10**decimals;
    const vaultBalance = Number(assets)/10**decimals;

    return {
      userId: userId.toString(),
      walletAddress,
      riskProfile: riskProfile.toString(),
      authProfile: authProfile.toString(),
      authThreshold: authThreshold.toString(),
      vaultBalance: vaultBalance.toString(),
      walletBalance: walletBalance.toString(),
    };
  }

  /**
   * Send deposit
   * @param whatsappNumber - User's WhatsApp number
   * @param amount - The amount to deposit
   * @returns Transaction result
   */
    async deposit(whatsappNumber: string, amount: string): Promise<TransactionResult> {
        const userId = this.generateUserId(whatsappNumber);

        const nonce = await this.vaultContract.read.getNonce([userId]);

        const decimals = Number(await this.usdcContract.read.decimals());
        const amountToDeposit = Number(amount)*10**decimals;
        const hash = await this.relayerContract.write.deposit([userId, amountToDeposit, nonce]);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

        console.log(`✅ Deposit registered on-chain: User ID ${userId}, amount ${amount}`);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
  
        return {
          success: receipt.status === 'success',
          functionName: 'deposit',
          userId: userId.toString(),
          transactionHash: receipt.transactionHash.toString(),
          blockNumber: Number(receipt.blockNumber).toString()
        };
    }

  /**
   * Send withdrawal
   * @param whatsappNumber - User's WhatsApp number
   * @param amount - The amount to withdraw
   * @returns Transaction result
   */
  async withdraw(whatsappNumber: string, amount: string): Promise<TransactionResult> {
    const userId = this.generateUserId(whatsappNumber);

    const nonce = await this.vaultContract.read.getNonce([userId]);

    const decimals = Number(await this.usdcContract.read.decimals());
    const amountToWithdraw = Number(amount)*10**decimals;
    const hash = await this.relayerContract.write.withdraw([userId, amountToWithdraw, nonce]);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Withdrawal registered on-chain: User ID ${userId}, amount ${amount}`);
    console.log(`Transaction hash: ${receipt.transactionHash}`);

    return {
      success: receipt.status === 'success',
      functionName: 'withdraw',
      userId: userId.toString(),
      transactionHash: receipt.transactionHash.toString(),
      blockNumber: Number(receipt.blockNumber).toString()
    };
  }



  /**
   * Send payment
   * @param whatsappNumber - The WhatsApp number
   * @param recipient - The recipient's wallet address, contact name or whatsapp number
   * @param amount - The amount to send
   * @returns User's on-chain data
   */
    async sendPayment(whatsappNumber: string, recipient: string, amount: string): Promise<TransactionResult> {
        const recipientIsAddress = isValidAddress(recipient);
 
        const userId = this.generateUserId(whatsappNumber);
 
        const nonce = await this.vaultContract.read.getNonce([userId]);

        const decimals = Number(await this.usdcContract.read.decimals());
        const amountToSend = Number(amount)*10**decimals;
 
        let hash: `0x${string}`;
        if (recipientIsAddress) {
          hash = await this.relayerContract.write.transfer([userId, recipient, amountToSend, nonce]);
        } else {
          hash = await this.relayerContract.write.transferWithinVault([userId, recipient, amountToSend, nonce]);
        }
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ Payment registered on-chain: User ID ${userId}, Recipient ${recipient}, amount ${amount}`);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
  
        return {
          success: true,
          functionName: recipientIsAddress ? 'transfer' : 'transferWithinVault',
          userId: userId.toString(),
          transactionHash: receipt.transactionHash.toString(),
          blockNumber: Number(receipt.blockNumber).toString()
        };

   }

  /**
   * Get user's authorization profile
   * @param whatsappNumber - User's WhatsApp number
   * @returns Transaction result
   */
  async getAuthProfile(whatsappNumber: string): Promise<string>   {
    const userId = this.generateUserId(whatsappNumber);
    const profile = await this.relayerContract.read.getUserAuthProfile([userId]);
    return profile;
  }

  /**
   * Get user's authorization profile
   * @param whatsappNumber - User's WhatsApp number
   * @returns Transaction result
   */
    async getAuthThreshold(whatsappNumber: string): Promise<string>   {
      const userId = this.generateUserId(whatsappNumber);
      const threshold = await this.relayerContract.read.getUserAuthThreshold([userId]);
      return threshold;
    }
     
  /**
   * Set user's authorization profile
   * @param whatsappNumber - User's WhatsApp number
   * @param profile - The profile to set 
   * @returns Transaction result
   */
    async setAuthProfile(whatsappNumber: string, profile: string): Promise<TransactionResult> {
        const userId = this.generateUserId(whatsappNumber);

        const nonce = await this.vaultContract.read.getNonce([userId]);

        const hash = await this.relayerContract.write.changeAuthProfile([userId, Number(profile), nonce]);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ Auth profile registered on-chain: User ID ${userId}, profile ${profile}`);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
  
        return {
          success: receipt.status === 'success',
          functionName: 'setAuthProfile',
          userId: userId.toString(),
          transactionHash: receipt.transactionHash.toString(),
          blockNumber: Number(receipt.blockNumber).toString()
        };
    }


  /**
   * Get user's risk profile
   * @param whatsappNumber - User's WhatsApp number
   * @returns Transaction result
   */
  async getRiskProfile(whatsappNumber: string): Promise<string>   {
    const userId = this.generateUserId(whatsappNumber);
    const profile = await this.relayerContract.read.getUserRiskProfile([userId]);
    return profile;
  }
     
  /**
   * Set user's risk profile
   * @param whatsappNumber - User's WhatsApp number
   * @param profile - The profile to set 
   * @returns Transaction result
   */
    async setRiskProfile(whatsappNumber: string, profile: string): Promise<TransactionResult> {
        const userId = this.generateUserId(whatsappNumber);

        const nonce = await this.vaultContract.read.getNonce([userId]);

        const hash = await this.relayerContract.write.changeRiskProfile([userId, Number(profile), nonce]);
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ Risk profile registered on-chain: User ID ${userId}, profile ${profile}`);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
  
        return {
          success: receipt.status === 'success',
          functionName: 'setRiskProfile',
          userId: userId.toString(),
          transactionHash: receipt.transactionHash.toString(),
          blockNumber: Number(receipt.blockNumber).toString()
        };
    }
}

export default new ContractService(); 