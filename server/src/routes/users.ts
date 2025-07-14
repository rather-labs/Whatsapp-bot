import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// User registration
router.post('/register', async (req: any, res: Response) => {
  try {
    console.log("Registering user");
    const { whatsapp_number, username, pin, wallet_address } = req.body;
    
    if (!whatsapp_number || !pin) {
      return res.status(400).json({ error: 'WhatsApp number and PIN are required' });
    }

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required for on-chain registration' });
    }

    // Validate PIN format (4-6 digits)
    const pinNumber = Number.parseInt(pin, 10);
    if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
      return res.status(400).json({ error: 'PIN must be a 4-6 digit number' });
    }

    // Check if user already exists in database
    db.get('SELECT whatsapp_number FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err: any, row: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      try {
        console.log("🔄 Starting registration...");
        
        // Encrypt PIN and create user in database
        const encryptedPin = pinNumber.toString(); // Simplified for now
        const utcTimestamp = new Date().toISOString();

        db.run(
          'INSERT INTO users (whatsapp_number, username, encrypted_pin, wallet_address, wallet_balance, vault_balance, created_at, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [whatsapp_number, username, encryptedPin, wallet_address, 0, 0, utcTimestamp, utcTimestamp], 
          (err: any) => {
            if (err) {
              console.error('❌ Database insertion failed:', err);
              return res.status(500).json({ error: 'Failed to create user in database' });
            }

            console.log("✅ User created successfully in database");

            res.status(201).json({
              message: 'User registered successfully',
              whatsappNumber: whatsapp_number,
              walletAddress: wallet_address,
              walletBalance: 0,
              vaultBalance: 0
            });
          }
        );
      } catch (error) {
        console.error('❌ Registration failed:', error);
        return res.status(500).json({ 
          error: 'Registration failed', 
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', (req: any, res: Response) => {
  const { whatsapp_number, pin } = req.body;

  if (!whatsapp_number || !pin) {
    return res.status(400).json({ error: 'WhatsApp number and PIN are required' });
  }

  // Validate PIN format
  const pinNumber = Number.parseInt(pin, 10);
  if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
    return res.status(400).json({ error: 'PIN must be a 4-6 digit number' });
  }

  db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err: any, user: any) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify PIN (simplified)
    if (user.encrypted_pin !== pinNumber.toString()) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { whatsappNumber: user.whatsapp_number },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        whatsapp_number: user.whatsapp_number,
        username: user.username,
        wallet_address: user.wallet_address
      }
    });
  });
});

export default router; 