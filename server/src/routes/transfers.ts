import express, { type Response, type Request } from 'express';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import ContractService from '../services/contractService';
import { authProfiles, isValidAddress } from '../utils/vault';

const router = express.Router();

// Transfer to external wallet or other user inside the vault
router.post('/pay', async (req: Request, res: Response) => {
  try {
    const { whatsapp_number, recipient, amount } = req.body;

    if (Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: `❌ *Invalid Amount*

Please provide a valid positive number for the payment amount.`});
    }

    const userData = await ContractService.getUserOnChainData(whatsapp_number);
    
    if (userData.walletBalance + userData.vaultBalance < amount) {
      return res.status(400).json({ error: `❌ *Insufficient Balance*

Your wallet balance: ${userData.walletBalance} USDC
Your vault balance: ${userData.vaultBalance} USDC
Payment amount: ${amount} USDC

You don't have enough USDC for this payment to ${recipient}.`});
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: `❌ *Invalid Amount*

        Payment amount: ${amount} USDC`});
    }
    // Check if recipient is a valid wallet address

    const recipientIsAddress = isValidAddress(recipient);

    // Check auth profile - Serverside payment requires auth profile 1 for intra vault tx 
    // and 2 or higher for external tx
    if (
      Number(authProfiles[userData.authProfile.toLowerCase()]) > 2 
      ||( Number(authProfiles[userData.authProfile.toLowerCase()]) > 1 
         && !recipientIsAddress 
        )
    ) {
      return await ContractService.sendPayment(whatsapp_number, recipient, amount);
    }
    // Create URL for user authorized transaction
    return res.status(200).json({ externalUrl: `To *authorize the payment*, tap in the link below

${process.env.FRONTEND_URL}/payment?whatsappNumber=${whatsapp_number}&recipient=${recipient}&amount=${amount}

If you want to avoid this step, you can change your auth profile to *Low* with the */authprofile Low* instruction.
`});

  } catch (error) {
    console.error('Vault deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Withdraw from vault
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, amount, signature } = req.body;

    console.log(whatsappNumber, amount, signature);
  } catch (error) {
    console.error('Vault deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deposit to vault
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, amount, signature } = req.body;

    console.log(whatsappNumber, amount, signature);
  } catch (error) {
    console.error('Vault deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
