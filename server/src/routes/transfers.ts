import express, { type Response, type Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import ContractService from '../services/contractService';
import { authProfiles, isValidAddress } from '../utils/vault';

const router = express.Router();

// Deposit to vault
router.post('/pay', async (req: Request, res: Response) => {
  try {
    const { whatsapp_number, recipient, amount } = req.body;

    if (Number.isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: `❌ *Invalid Amount*

Please provide a valid positive number for the payment amount.`});
    }

    const userData = await ContractService.getUserOnChainData(whatsapp_number);
    
    if (userData.assets < amount) {
      return res.status(400).json({ error: `❌ *Insufficient Balance*

Your balance: ${userData.assets} USDC
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
router.post('/withdraw', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Check vault balance
    db.get('SELECT vault_balance FROM users WHERE whatsapp_number = ?', [req.user?.whatsappNumber], (err: any, user: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.vault_balance < amount) {
        return res.status(400).json({ error: 'Insufficient vault balance' });
      }

      const txId = uuidv4();
      
      // Create transaction record
      db.run(
        'INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user?.whatsappNumber, 'vault_withdraw', amount, 'confirmed']
      );

      // Update wallet balances
      db.run(
        'UPDATE users SET wallet_balance = wallet_balance + ?, vault_balance = vault_balance - ? WHERE whatsapp_number = ?',
        [amount, amount, req.user?.whatsappNumber]
      );

      res.json({
        message: 'Withdrawn from vault successfully',
        transactionId: txId,
        amount: amount
      });
    });
  } catch (error) {
    console.error('Vault withdraw error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vault deposits
router.get('/deposits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  db.all(
    'SELECT * FROM vault_deposits WHERE user_whatsapp_number = ? ORDER BY created_at DESC',
    [req.user?.whatsappNumber],
    (err: any, deposits: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(deposits);
    }
  );
});

export default router; 
