import express, { type Response, type Request } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import ContractService from '../services/contractService';
import { isValidAddress, isValidNumber } from '../utils/vault';
import { getContactWhatsappNumber, getContactWalletAddress } from '../config/database';

const router = express.Router();

const recipientNotRegisteredMessage = `❌ *Recipient not identified*

Please provide a valid *recipient number*, *contact name* or *wallet address*.

To send a contact name, you must *share your contact* with me.
If the contact is not a user you must also *set a wallet address* for the contact.`;

// Transfer to external wallet or other user inside the vault
router.post('/pay', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, recipient, amount } = req.body;

    if (Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ message: `❌ *Invalid Amount*

Please provide a valid positive number for the payment amount.`});
    }

    const userData = await ContractService.getUserOnChainData(whatsappNumber);
    
    if (Number(userData.walletBalance) + Number(userData.vaultBalance) < Number(amount)) {
      return res.status(400).json({ message: `❌ *Insufficient Balance*

Your vault balance: ${userData.vaultBalance} USDC
Your wallet balance: ${userData.walletBalance} USDC
Payment amount: ${amount} USDC

You don't have enough USDC for this payment to ${recipient}.`});
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: `❌ *Invalid Amount*

        Payment amount: ${amount} USDC`});
    }

    let recipientId = recipient;
    if (!isValidNumber(recipientId) && !isValidAddress(recipientId)) {
      // Get recipient WhatsApp number from contacts table if recipient is a contact name
      recipientId = await getContactWhatsappNumber(userData.userId, recipientId);
      if (!recipientId) {
        return res.status(400).json({ message: recipientNotRegisteredMessage});
      }
    }

    const recipientIsRegistered = await ContractService.isUserRegisteredOnChain(recipientId);
    if (!recipientIsRegistered) {
      // if the recipient is not registered, get the wallet address from the contacts table
      const recipientWallet = await getContactWalletAddress(userData.userId, recipientId);
      if (recipientWallet) {
        recipientId = recipientWallet;
      }
    }

    // Check auth profile 
    if (Number(userData.authProfile) < 2 ) {
      return res.status(200).json({ message: `To *authorize the payment*, tap in the link below

        ${process.env.FRONTEND_URL}/actions/transfer?whatsappNumber=${userData.userId}&recipientName=${recipient}&recipient=${recipientId}&amount=${amount}
        
        If you want to avoid this step, you can change your auth profile to *Low* or set a *threshold*.`});   
    }
    // Create URL for user authorized transaction
    const result = await ContractService.sendPayment(whatsappNumber, recipientId, amount);
    let message = '';
    if (result.success) {
       message = `✅ *Payment of ${amount} USDC Successful to ${recipient}!*

🏦 Transaction: ${result.transactionHash}
`;
    } else {
      message = `❌ *Payment Failed*
      
Try again later.`;
    }
    return res.status(200).json({...result, message: message});

  } catch (error) {
    res.status(500).json({ message: `${error.message}` });
  }
});

// Withdraw from vault
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, amount } = req.body

    const userData = await ContractService.getUserOnChainData(whatsappNumber);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: `❌ *Invalid Amount*

Please provide a valid positive number for the withdrawal amount.`});
    }

    if (Number(userData.vaultBalance) < Number(amount)) {
      return res.status(400).json({ message: `❌ *Insufficient Balance*

Vault balance: ${userData.vaultBalance} USDC
Withdraw amount: ${amount} USDC

You don't have enough USDC for this withdrawal.`});
    }

    if (Number(userData.authProfile) < 1 ) {
      return res.status(200).json({ message: `To *authorize the withdrawal*, tap in the link below

${process.env.FRONTEND_URL}/actions/withdraw?whatsappNumber=${userData.userId}&amount=${amount}
        
If you want to avoid this step, you can change your auth profile to *Low*/*Medium* or set a *threshold*.`});
    }
    
    const result = await ContractService.withdraw(whatsappNumber, amount);

    let message = '';
    if (result.success) {
       message = `✅ *Vault Withdrawal of ${amount} USDC Successful!*

🏦 Transaction: ${result.transactionHash}
`;
    } else {
      message = `❌ *Vault Withdrawal Failed*
      
Try again later.`;
    }
    return res.status(200).json({...result, message: message});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Deposit to vault
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, amount } = req.body

    const userData = await ContractService.getUserOnChainData(whatsappNumber);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: `❌ *Invalid Amount*

Please provide a valid positive number for the deposit amount.`});
    }

    if (Number(userData.walletBalance) < Number(amount)) {
      return res.status(400).json({ message: `❌ *Insufficient Balance*

Your wallet balance: ${userData.walletBalance} USDC
Deposit amount: ${amount} USDC

You don't have enough USDC for this deposit.`});
    }

    if (Number(userData.authProfile) < 1 ) {
      return res.status(200).json({ message: `To *authorize the payment*, tap in the link below

${process.env.FRONTEND_URL}/actions/deposit?whatsappNumber=${userData.userId}&amount=${amount}
        
If you want to avoid this step, you can change your auth profile to *Low*/*Medium* or set a *threshold*.`});
    }
    
    const result = await ContractService.deposit(whatsappNumber, amount);

    let message = '';
    if (result.success) {
       message = `✅ *Vault Deposit of ${amount} USDC Successful!*

🏦 Transaction: ${result.transactionHash}

Your assets are generating yield!`;
    } else {
      message = `❌ *Vault Deposit Failed*
      
Try again later.`;
    }
    return res.status(200).json({...result, message: message});
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router; 
