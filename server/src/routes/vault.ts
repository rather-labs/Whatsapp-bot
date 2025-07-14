import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Deposit to vault
router.post('/deposit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Check wallet balance
    db.get('SELECT wallet_balance FROM users WHERE whatsapp_number = ?', [req.user?.whatsappNumber], (err: any, user: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.wallet_balance < amount) {
        return res.status(400).json({ error: 'Insufficient USDC balance' });
      }

      const depositId = uuidv4();
      const txId = uuidv4();
      
      // Create vault deposit
      db.run(
        'INSERT INTO vault_deposits (id, user_whatsapp_number, amount) VALUES (?, ?, ?)',
        [depositId, req.user?.whatsappNumber, amount]
      );

      // Create transaction record
      db.run(
        'INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user?.whatsappNumber, 'vault_deposit', amount, 'confirmed']
      );

      // Update wallet balances
      db.run(
        'UPDATE users SET wallet_balance = wallet_balance - ?, vault_balance = vault_balance + ? WHERE whatsapp_number = ?',
        [amount, amount, req.user?.whatsappNumber]
      );

      res.json({
        message: 'Deposited to vault successfully',
        depositId: depositId,
        transactionId: txId,
        amount: amount,
        apy: 0.05 // 5% APY
      });
    });
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