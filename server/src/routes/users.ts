import express from 'express';
import type { Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { authenticateToken } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import ContractService from '../services/contractService';
import { getUserSessionStatus } from '../services/sessionService';
import { encryptUserPin } from '../utils/crypto';
import e from 'express';
import { authProfiles, riskProfiles } from '../utils/vault';


const router = express.Router();

// Check if user is registered
router.get('/check/:whatsapp_number', async (req: Request, res: Response) => {
  const { whatsapp_number } = req.params;

  if (!whatsapp_number) {
    return res.status(400).json({ message: 'WhatsApp number is required' });
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
    return res.status(500).json({ message: error.message });
  }
});

// Get User Data
router.get('/data/:whatsapp_number', async (req: Request, res: Response) => {
  const { whatsapp_number } = req.params;

  if (!whatsapp_number) {
    return res.status(400).json({ message: 'WhatsApp number is required' });
  }

  try {
    const user = await ContractService.getUserOnChainData(whatsapp_number);
    // Get user creation time from database
    let createdAt: string | undefined = undefined;
    await new Promise<void>((resolve) => {
      db.get(
        'SELECT created_at FROM users WHERE whatsapp_number = ?',
        [whatsapp_number],
        (err: Error | null, row: { created_at?: string } | undefined) => {
          if (err) {
            console.error('❌ Error fetching user creation time:', err);
            return resolve(); // Don't block response on error
          }
          if (row?.created_at) {
            createdAt = row.created_at;
          }
          resolve();
        }
      );
    });
    if (createdAt) {
      (user as any).createdAt = createdAt;
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// User registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { whatsapp_number, username, pin, wallet_address } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ message: 'WhatsApp number is required' });
    }

    const isRegisteredOnChain = await ContractService.isUserRegisteredOnChain(whatsapp_number);
    if (isRegisteredOnChain) {
      const user = await ContractService.getUserOnChainData(whatsapp_number);
      return res.status(409).json({ message: `Your account is already registered!

💰 On Vault: ${user.vaultBalance} USDC ${Number(user.vaultBalance) > 0 ? '(Generating yields... 💰💰💰)' : '(Deposit to vault generate yields 💰💰💰)'}
💰 On Wallet: ${user.walletBalance} USDC` });
    }

    if (!pin) {
      return res.status(200).json({ message: `To register your account, tap in the link below

${process.env.FRONTEND_URL}/register?whatsappNumber=${whatsapp_number}&username=${username}`});
      }

    if (!wallet_address) {
      return res.status(400).json({ message: 'Wallet address is required for on-chain registration' });
    }

    // Validate PIN format (4-6 digits)
    const pinNumber = Number.parseInt(pin, 10);
    if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
      return res.status(400).json({ message: 'PIN must be a 4-6 digit number' });
    }

    console.log("🔄 Starting registration...");
    // Register user on-chain
    await ContractService.registerUserOnChain(whatsapp_number, wallet_address);

    // Encrypt PIN and create user in database
    const encryptedPin = encryptUserPin(pinNumber, process.env.JWT_SECRET);
    const utcTimestamp = new Date().toISOString();
    db.run(
        'INSERT INTO users (whatsapp_number, username, encrypted_pin, wallet_address, wallet_balance, vault_balance, created_at, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [whatsapp_number, username, encryptedPin, wallet_address, 0, 0, utcTimestamp, utcTimestamp], 
        (err: Error | null) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user in database' });
          }
        }
      );
    return res.status(200).json({
         message: '✅ User created successfully',
         whatsappNumber: whatsapp_number,
         walletAddress: wallet_address,
         walletBalance: 0,
         vaultBalance: 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Session status endpoint
router.get('/session/status/:whatsapp_number', async (req: Request, res: Response) => {
  try {
    const { whatsapp_number } = req.params;
    
    // Get session status using sessionService
    return res.json({sessionStatus: await getUserSessionStatus(whatsapp_number)});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validations
router.post('/session/validate', async (req: Request, res: Response) => {
  try {
    const { whatsapp_number, pin } = req.body;

    const sessionStatus = await getUserSessionStatus(whatsapp_number);
    if (!sessionStatus.exists) {
      return res.status(404).json({ message: '*User not found*, check that you have registered' });
    }

    // Get encrypted pin from database
    const user = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT encrypted_pin FROM users WHERE whatsapp_number = ?',
        [whatsapp_number],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);

    if (user.encrypted_pin !== encryptedPin) {
      return res.status(401).json({ 
        message: "*Invalid credentials*, use the PIN you set upon registration\n\nPlease enter your PIN to continue:\n\n*PIN:* (4-6 digits)" });
    }

    // update user activity    
    const utcTimestamp = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE users SET last_activity = ? WHERE whatsapp_number = ?',
        [utcTimestamp, whatsapp_number],
        (err: unknown) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get session status using sessionService
    return res.json({success: true});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/session/update', async (req: Request, res: Response) => {
  try {
    const { whatsapp_number } = req.body;

    const utcTimestamp = new Date().toISOString();
    // Update the user's last activity time in the database using this timestamp
    await new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE users SET last_activity = ? WHERE whatsapp_number = ?',
        [utcTimestamp, whatsapp_number],
        (err: unknown) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    return res.json({success: true});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get/Set user authentication profile endpoint
router.post('/authprofile', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, profile } = req.body;
    
    const currentProfile = await ContractService.getAuthProfile(whatsappNumber);

    const userId = ContractService.generateUserId(whatsappNumber);

    if (profile === '') {
      return res.status(200).json({message: `Your current authorization profile is: *${authProfiles[currentProfile]}*`});
    }
    if (Number(currentProfile) < 2 ) {
      return res.status(200).json({ message: `To *Change authorization profile*, tap in the link below

${process.env.FRONTEND_URL}/actions/changeAuth?whatsappNumber=${userId}&profile=${profile}
        
If you want to avoid this step, you can change your authorization profile to *Low*.
`});
    }
    
    const response = await ContractService.setAuthProfile(
      whatsappNumber, 
      authProfiles.indexOf(profile.toLowerCase()).toString(), 
    );
    return res.status(200).json({message: response.success 
      ? `✅ Authorization profile set successfully to *${profile}*` 
      : '❌ Authorization profile setting failed'
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.post('/riskprofile', async (req: Request, res: Response) => {
  try {
    const { whatsappNumber, profile } = req.body;
    
    const currentProfile = await ContractService.getRiskProfile(whatsappNumber);


    const userId = ContractService.generateUserId(whatsappNumber);

    if (profile === '') {
      return res.status(200).json({message: `Your current risk profile is: *${riskProfiles[currentProfile]}*`});
    }
    const currentAuthProfile = await ContractService.getAuthProfile(whatsappNumber);

    if (Number(currentAuthProfile) < 2 ) {
      return res.status(200).json({ message: `To *Change risk profile*, tap in the link below

${process.env.FRONTEND_URL}/actions/changeRisk?whatsappNumber=${userId}&profile=${profile}
        
If you want to avoid this step, you can change your authorization profile to *Low*.
`});
    }
    
    const response = await ContractService.setRiskProfile(
      whatsappNumber, 
      riskProfiles.indexOf(profile.toLowerCase()).toString(), 
    );
    return res.status(200).json({message: response.success 
      ? `✅ Risk profile set successfully to *${profile}*` 
      : '❌ Risk profile setting failed'
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 