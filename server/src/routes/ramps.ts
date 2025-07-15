import express, { type Response, type Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import { getWhatsappNumberFromId } from '../utils/vault';

const router = express.Router();

// Generate onRamp URL
router.post('/onramp', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // All on ramp actions require external user action
    return res.status(200).json({ externalUrl: `To *execute the onramp*, tap in the link below

${process.env.FRONTEND_URL}/onramp?whatsappNumber=${getWhatsappNumberFromId(whatsappNumber)}&amount=${amount}

`});
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

// Withdraw from vault
router.post('/offramp', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, amount } = req.body;

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

export default router; 