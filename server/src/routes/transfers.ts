import express, { type Response, type Request } from 'express';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import ContractService from '../services/contractService';
import { authProfiles, isValidAddress } from '../utils/vault';

const router = express.Router();

// Transfer to external wallet or other user inside the vault
router.post('/pay', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, recipient, amount } = req.body;

    if (Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ message: `❌ *Invalid Amount*

Please provide a valid positive number for the payment amount.`});
    }

    const userData = await ContractService.getUserOnChainData(whatsappNumber);
    
    if (userData.walletBalance + userData.vaultBalance < amount) {
      return res.status(400).json({ message: `❌ *Insufficient Balance*

Your wallet balance: ${userData.walletBalance} USDC
Your vault balance: ${userData.vaultBalance} USDC
Payment amount: ${amount} USDC

You don't have enough USDC for this payment to ${recipient}.`});
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: `❌ *Invalid Amount*

        Payment amount: ${amount} USDC`});
    }

    // Check auth profile 
    if (Number(authProfiles[userData.authProfile.toLowerCase()]) < 2 ) {
      return res.status(200).json({ message: `To *authorize the payment*, tap in the link below

        ${process.env.FRONTEND_URL}/actions/payment?whatsappNumber=${whatsappNumber}&recipient=${recipient}&amount=${amount}
        
        If you want to avoid this step, you can change your auth profile to *Low* with the */authprofile Low* instruction.`});
        
    }
    // Create URL for user authorized transaction
    const result = await ContractService.sendPayment(whatsappNumber, recipient, amount);
    let message = '';
    if (result.success) {
       message = `✅ *Payment of ${amount} USDC Successful to ${recipient}!*

🏦 Transaction: ${result.transactionHash}
📅 Time: ${new Date().toLocaleString()}
`;
    } else {
      message = `❌ *Payment Failed*
      
Try again later.`;
    }
    return res.status(200).json({...result, message: message});

  } catch (error) {
    res.status(500).json({ message: `Internal server error ${error.message}` });
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

    const decimals = Number(await ContractService.getDecimals());
    const amountToWithdraw = Number(amount)*10**decimals;

    if (Number(userData.vaultBalance) < amountToWithdraw) {
      return res.status(400).json({ message: `❌ *Insufficient Balance*

Vault balance: ${userData.vaultBalance} USDC
Withdraw amount: ${amount} USDC

You don't have enough USDC for this withdrawal.`});
    }

    if (Number(userData.authProfile) < 1 ) {
      return res.status(200).json({ message: `To *authorize the withdrawal*, tap in the link below

${process.env.FRONTEND_URL}/actions/withdraw?whatsappNumber=${userData.userId}&amount=${amount}
        
If you want to avoid this step, you can change your auth profile to *Low* or *Medium*.`});
    }
    
    const result = await ContractService.withdraw(whatsappNumber, amount);

    let message = '';
    if (result.success) {
       message = `✅ *Vault Withdrawal of ${amount} USDC Successful!*

🏦 Transaction: ${result.transactionHash}
📅 Time: ${new Date().toLocaleString()}
`;
    } else {
      message = `❌ *Vault Withdrawal Failed*
      
Try again later.`;
    }
    return res.status(200).json({...result, message: message});
  } catch (error) {
    return res.status(500).json({ message: `Internal server error ${error.message}` });
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

    const decimals = Number(await ContractService.getDecimals());
    const amountToDeposit = Number(amount)*10**decimals;

    if (Number(userData.walletBalance) < amountToDeposit) {
      return res.status(400).json({ message: `❌ *Insufficient Balance*

Your wallet balance: ${userData.walletBalance} USDC
Deposit amount: ${amount} USDC

You don't have enough USDC for this deposit.`});
    }

    if (Number(userData.authProfile) < 1 ) {
      return res.status(200).json({ message: `To *authorize the payment*, tap in the link below

${process.env.FRONTEND_URL}/actions/deposit?whatsappNumber=${userData.userId}&amount=${amount}
        
If you want to avoid this step, you can change your auth profile to *Low* or *Medium*.`});
    }
    
    const result = await ContractService.deposit(whatsappNumber, amount);

    let message = '';
    if (result.success) {
       message = `✅ *Vault Deposit of ${amount} USDC Successful!*

🏦 Transaction: ${result.transactionHash}
📅 Time: ${new Date().toLocaleString()}
`;
    } else {
      message = `❌ *Vault Deposit Failed*
      
Try again later.`;
    }
    return res.status(200).json({...result, message: message});
  } catch (error) {
    return res.status(500).json({ message: `Internal server error ${error.message}` });
  }
});

export default router; 
