const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');
const db = require('../config/database');
const { provider, USDC_CONTRACT_ADDRESS, USDC_ABI } = require('../config/blockchain');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    db.get('SELECT * FROM users WHERE whatsapp_number = ?', [req.user.whatsappNumber], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get on-chain balances
      let ethBalance = '0';
      let usdcBalance = '0';

      if (provider) {
        try {
          ethBalance = ethers.formatEther(await provider.getBalance(user.wallet_address));
          
          const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
          const usdcBalanceRaw = await usdcContract.balanceOf(user.wallet_address);
          usdcBalance = ethers.formatUnits(usdcBalanceRaw, 6); // USDC has 6 decimals
        } catch (error) {
          console.error('Error fetching blockchain balances:', error);
        }
      }

      res.json({
        wallet_address: user.wallet_address,
        wallet_balance: Number.parseFloat(user.wallet_balance),
        vault_balance: Number.parseFloat(user.vault_balance),
        balance_eth: Number.parseFloat(ethBalance),
        onchain_usdc: Number.parseFloat(usdcBalance),
        risk_profile: user.risk_profile,
        auth_profile: user.auth_profile
      });
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send USDC payment
router.post('/pay', authenticateToken, async (req, res) => {
  try {
    const { amount, recipient } = req.body;

    if (!amount || !recipient) {
      return res.status(400).json({ error: 'Amount and recipient are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Get user wallet
    db.get('SELECT * FROM users WHERE whatsapp_number = ?', [req.user.whatsappNumber], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.wallet_balance < amount) {
        return res.status(400).json({ error: 'Insufficient USDC balance' });
      }

      // Create transaction record
      const txId = uuidv4();
      db.run(
        'INSERT INTO transactions (id, user_whatsapp_number, type, amount, recipient, status) VALUES (?, ?, ?, ?, ?, ?)',
        [txId, req.user.whatsappNumber, 'payment', amount, recipient, 'pending']
      );

      // Update local balance
      db.run(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE whatsapp_number = ?',
        [amount, req.user.whatsappNumber]
      );

      // If recipient exists in our system, update their balance
      db.get('SELECT whatsapp_number FROM users WHERE whatsapp_number = ?', [recipient], (err, recipientUser) => {
        if (recipientUser) {
          db.run(
            'UPDATE users SET wallet_balance = wallet_balance + ? WHERE whatsapp_number = ?',
            [amount, recipientUser.whatsapp_number]
          );
        }
      });

      // Send on-chain transaction if provider is available
      if (provider && user.wallet_address) {
        try {
          // Note: In a real implementation, you would decrypt the private key using the encrypted_pin
          // For now, we'll skip the blockchain transaction and just do off-chain
          console.log('Blockchain transaction skipped - wallet address not configured');
          
          // Update transaction record
          db.run(
            'UPDATE transactions SET status = ? WHERE id = ?',
            ['confirmed', txId]
          );

          res.json({
            message: 'Payment sent successfully (off-chain)',
            transactionId: txId,
            amount: amount,
            recipient: recipient
          });
        } catch (error) {
          console.error('Blockchain transaction error:', error);
          // Update transaction status to failed
          db.run('UPDATE transactions SET status = ? WHERE id = ?', ['failed', txId]);
          res.status(500).json({ error: 'Blockchain transaction failed', transactionId: txId });
        }
      } else {
        // Off-chain only
        db.run('UPDATE transactions SET status = ? WHERE id = ?', ['confirmed', txId]);
        res.json({
          message: 'Payment sent successfully (off-chain)',
          transactionId: txId,
          amount: amount,
          recipient: recipient
        });
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy USDC
router.post('/buy', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Simulate buying USDC with fiat
    const txId = uuidv4();
    
    db.run(
      'INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)',
      [txId, req.user.whatsappNumber, 'buy', amount, 'confirmed']
    );

    // Update wallet balance
    db.run(
      'UPDATE users SET wallet_balance = wallet_balance + ? WHERE whatsapp_number = ?',
      [amount, req.user.whatsappNumber]
    );

    res.json({
      message: 'USDC purchased successfully',
      transactionId: txId,
      amount: amount,
      newBalance: 'updated'
    });
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sell USDC
router.post('/sell', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Check balance
    db.get('SELECT wallet_balance FROM users WHERE whatsapp_number = ?', [req.user.whatsappNumber], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.wallet_balance < amount) {
        return res.status(400).json({ error: 'Insufficient USDC balance' });
      }

      const txId = uuidv4();
      
      db.run(
        'INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user.whatsappNumber, 'sell', amount, 'confirmed']
      );

      // Update wallet balance
      db.run(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE whatsapp_number = ?',
        [amount, req.user.whatsappNumber]
      );

      res.json({
        message: 'USDC sold successfully',
        transactionId: txId,
        amount: amount,
        newBalance: 'updated'
      });
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 