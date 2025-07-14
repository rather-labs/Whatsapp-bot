import express from 'express';
import type { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticateToken } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import ContractService from '../services/contractService';

interface UserRow {
  whatsapp_number: string;
  username?: string;
  wallet_address?: string;
  encrypted_pin?: string;
}

const router = express.Router();

// Check if user is registered
router.get('/check/:whatsapp_number', async (req: Request, res: Response) => {
  const { whatsapp_number } = req.params;

  if (!whatsapp_number) {
    return res.status(400).json({ error: 'WhatsApp number is required' });
  }

  try {
    const isRegisteredOnChain = await ContractService.isUserRegisteredOnChain(whatsapp_number);
    if (isRegisteredOnChain) {
      return res.json({
        registered: true,
        message: 'User registered on blockchain'
      });
    }
    return res.json({
      registered: false,
      message: 'User not registered on blockchain'
    });
  } catch (error) {
    console.error('❌ Registration check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration
router.post('/register', async (req: Request, res: Response) => {
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


    const isRegisteredOnChain = await ContractService.isUserRegisteredOnChain(whatsapp_number);
    if (isRegisteredOnChain) {
      return res.status(409).json({ error: 'User already exists' });
    }

    console.log("🔄 Starting registration...");
    // Register user on-chain
    console.log("🔄 Registering user on-chain...");
    await ContractService.registerUserOnChain(whatsapp_number, wallet_address);

    // Encrypt PIN and create user in database
    const encryptedPin = pinNumber.toString(); // Simplified for now
    const utcTimestamp = new Date().toISOString();
    db.run(
        'INSERT INTO users (whatsapp_number, username, encrypted_pin, wallet_address, wallet_balance, vault_balance, created_at, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [whatsapp_number, username, encryptedPin, wallet_address, 0, 0, utcTimestamp, utcTimestamp], 
        (err: Error | null) => {
          if (err) {
            console.error('❌ Database insertion failed:', err);
            return res.status(500).json({ error: 'Failed to create user in database' });
          }
        }
      );

    console.log("✅ User created successfully");
    res.status(201).json({
         message: 'User registered successfully',
         whatsappNumber: whatsapp_number,
         walletAddress: wallet_address,
         walletBalance: 0,
         vaultBalance: 0,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', async (req: Request, res: Response) => {
  const { whatsapp_number, pin } = req.body;

  if (!whatsapp_number || !pin) {
    return res.status(400).json({ error: 'WhatsApp number and PIN are required' });
  }

  // Validate PIN format
  const pinNumber = Number.parseInt(pin, 10);
  if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
    return res.status(400).json({ error: 'PIN must be a 4-6 digit number' });
  }

  db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err: Error | null, user: UserRow | undefined) => {
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

    // Get blockchain data
    try {
      const blockchainData = await ContractService.getUserOnChainData(whatsapp_number);
      
      res.json({
        message: 'Login successful',
        token: token,
        user: {
          whatsapp_number: user.whatsapp_number,
          username: user.username,
          wallet_address: user.wallet_address
        },
        blockchainData: {
          userId: blockchainData.userId,
          walletAddress: blockchainData.walletAddress,
          riskProfile: blockchainData.riskProfile,
          authProfile: blockchainData.authProfile,
          assets: blockchainData.assets,
          isRegistered: blockchainData.isRegistered,
          network: ContractService.getNetworkInfo()
        }
      });
    } catch (blockchainError) {
      console.error('❌ Blockchain data fetch error during login:', blockchainError);
      
      res.json({
        message: 'Login successful',
        token: token,
        user: {
          whatsapp_number: user.whatsapp_number,
          username: user.username,
          wallet_address: user.wallet_address
        },
        blockchainData: {
          error: 'Failed to fetch blockchain data',
          network: ContractService.getNetworkInfo()
        }
      });
    }
  });
});

export default router; 