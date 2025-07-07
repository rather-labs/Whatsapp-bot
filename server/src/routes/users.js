const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { encryptUserPin, decryptUserPin } = require('../utils/crypto');
const { formatTimestamp, getCurrentUTCTimestamp } = require('../utils/timestamp');
const { updateUserActivity, getUserSessionStatus, validateUserPin } = require('../services/sessionService');
const { authenticateToken } = require('../middleware/auth');
const contractService = require('../services/contractService');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    console.log("Registering user");
    const { whatsapp_number, username, pin, wallet_address, permit } = req.body;
    console.log("Whatsapp number:", whatsapp_number);
    console.log("Username:", username);
    console.log("PIN:", pin);
    console.log("Wallet address:", wallet_address);
    console.log("Permit:", permit);
    
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
    db.get('SELECT whatsapp_number FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      try {
        // Check if user is already registered on-chain
        const isRegisteredOnChain = await contractService.isUserRegisteredOnChain(whatsapp_number);
        if (isRegisteredOnChain) {
          return res.status(409).json({ error: 'User already registered on-chain' });
        }

        console.log("🔄 Starting on-chain registration...");
        
        // Register user on-chain first
        const onChainResult = await contractService.registerUserOnChain(whatsapp_number, wallet_address, permit);
        
        console.log("✅ On-chain registration successful:", onChainResult);

        // Now encrypt PIN and create user in database
        const encryptedPin = encryptUserPin(pinNumber, process.env.JWT_SECRET);
        const utcTimestamp = getCurrentUTCTimestamp();

        db.run(
          'INSERT INTO users (whatsapp_number, username, encrypted_pin, wallet_address, wallet_balance, vault_balance, created_at, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [whatsapp_number, username, encryptedPin, wallet_address, 0, 0, utcTimestamp, utcTimestamp], 
          (err) => {
            if (err) {
              console.error('❌ Database insertion failed:', err);
              return res.status(500).json({ error: 'Failed to create user in database' });
            }

            console.log("✅ User created successfully in database");

            res.status(201).json({
              message: 'User registered successfully on-chain and in database',
              whatsappNumber: whatsapp_number,
              walletAddress: wallet_address,
              walletBalance: 0,
              vaultBalance: 0,
              onChainData: {
                userId: onChainResult.userId,
                transactionHash: onChainResult.transactionHash,
                blockNumber: onChainResult.blockNumber
              }
            });
          }
        );
      } catch (onChainError) {
        console.error('❌ On-chain registration failed:', onChainError);
        return res.status(500).json({ 
          error: 'On-chain registration failed', 
          details: onChainError.message 
        });
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', (req, res) => {
  const { whatsapp_number, pin } = req.body;

  if (!whatsapp_number || !pin) {
    return res.status(400).json({ error: 'WhatsApp number and PIN are required' });
  }

  // Validate PIN format
  const pinNumber = Number.parseInt(pin, 10);
  if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
    return res.status(400).json({ error: 'PIN must be a 4-6 digit number' });
  }

  db.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Decrypt and verify PIN
    try {
      const decryptedPin = decryptUserPin(user.encrypted_pin, process.env.JWT_SECRET || 'your-secret-key');
      if (decryptedPin !== pinNumber.toString()) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('PIN decryption error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last activity
    try {
      await updateUserActivity(whatsapp_number);
    } catch (error) {
      console.error('Error updating user activity:', error);
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

// Check session status and update activity
router.post('/session/check', async (req, res) => {
  try {
    const { whatsapp_number } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    const sessionStatus = await getUserSessionStatus(whatsapp_number);
    
    if (!sessionStatus.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update activity if session is not expired
    if (!sessionStatus.expired) {
      await updateUserActivity(whatsapp_number);
    }

    res.json({
      exists: sessionStatus.exists,
      expired: sessionStatus.expired,
      lastActivity: sessionStatus.lastActivity
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user activity (called when user interacts)
router.post('/session/update', async (req, res) => {
  try {
    const { whatsapp_number } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    await updateUserActivity(whatsapp_number);
    
    res.json({
      message: 'Activity updated successfully',
      timestamp: getCurrentUTCTimestamp()
    });
  } catch (error) {
    console.error('Activity update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced session management - Check session and handle PIN validation
router.post('/session/validate', async (req, res) => {
  try {
    const { whatsapp_number, pin } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    const sessionStatus = await getUserSessionStatus(whatsapp_number);
    
    if (!sessionStatus.exists) {
      return res.status(404).json({ 
        error: 'User not found',
        requiresRegistration: true 
      });
    }

    console.log("Session status:", sessionStatus);
    console.log("PIN:", pin);
    console.log("Expired:", sessionStatus.expired);
    
    // If session is expired and PIN is provided, validate it
    if (sessionStatus.expired && pin) {
      const pinValidation = await validateUserPin(whatsapp_number, pin);
      
      if (pinValidation.valid) {
        // PIN is correct, update activity and restore session
        await updateUserActivity(whatsapp_number);
        
        // Get updated session status with expiration time
        const updatedSessionStatus = await getUserSessionStatus(whatsapp_number);
        
        return res.json({
          success: true,
          message: 'PIN validated successfully',
          sessionRestored: true,
          requiresPin: false,
          expirationTime: updatedSessionStatus.expirationTime
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN',
        requiresPin: true,
        sessionExpired: true
      });
    }

    // If session is expired and no PIN provided, prompt for PIN
    if (sessionStatus.expired) {
      return res.json({
        success: false,
        message: 'Session expired, PIN required',
        requiresPin: true,
        sessionExpired: true
      });
    }

    // Session is valid, update activity
    await updateUserActivity(whatsapp_number);
    
    // Get updated session status with expiration time
    const updatedSessionStatus = await getUserSessionStatus(whatsapp_number);
    
    return res.json({
      success: true,
      message: 'Session is valid',
      requiresPin: false,
      sessionExpired: false,
      expirationTime: updatedSessionStatus.expirationTime
    });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comprehensive session status
router.get('/session/status/:whatsapp_number', async (req, res) => {
  try {
    const { whatsapp_number } = req.params;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    const sessionStatus = await getUserSessionStatus(whatsapp_number);
    
    if (!sessionStatus.exists) {
      return res.status(404).json({ 
        error: 'User not found',
        exists: false,
        requiresRegistration: true 
      });
    }

    res.json({
      exists: true,
      expired: sessionStatus.expired,
      lastActivity: sessionStatus.lastActivity,
      lastActivityFormatted: formatTimestamp(sessionStatus.lastActivity),
      expirationTime: sessionStatus.expirationTime,
      expirationTimeFormatted: formatTimestamp(sessionStatus.expirationTime),
      requiresPin: sessionStatus.expired,
      requiresRegistration: false
    });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT whatsapp_number, username, wallet_address, risk_profile, auth_profile, wallet_balance, vault_balance, created_at, last_activity FROM users WHERE whatsapp_number = ?', 
    [req.user.whatsappNumber], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add formatted timestamps
    const response = {
      ...user,
      created_at_formatted: formatTimestamp(user.created_at),
      last_activity_formatted: formatTimestamp(user.last_activity)
    };
    
    res.json(response);
  });
});

// Update risk profile (integer)
router.post('/risk-profile', authenticateToken, (req, res) => {
  const { risk_profile } = req.body;

  if (!risk_profile || ![1, 2, 3].includes(Number.parseInt(risk_profile))) {
    return res.status(400).json({ error: 'Valid risk profile is required (1=low, 2=moderate, 3=high)' });
  }

  const utcTimestamp = getCurrentUTCTimestamp();
  db.run(
    'UPDATE users SET risk_profile = ?, updated_at = ? WHERE whatsapp_number = ?',
    [Number.parseInt(risk_profile), utcTimestamp, req.user.whatsappNumber],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        message: 'Risk profile updated successfully',
        risk_profile: Number.parseInt(risk_profile)
      });
    }
  );
});

// Update auth profile (integer)
router.post('/auth-profile', authenticateToken, (req, res) => {
  const { auth_profile } = req.body;

  if (!auth_profile || ![1, 2, 3].includes(Number.parseInt(auth_profile))) {
    return res.status(400).json({ error: 'Valid auth profile is required (1=basic, 2=enhanced, 3=premium)' });
  }

  const utcTimestamp = getCurrentUTCTimestamp();
  db.run(
    'UPDATE users SET auth_profile = ?, updated_at = ? WHERE whatsapp_number = ?',
    [Number.parseInt(auth_profile), utcTimestamp, req.user.whatsappNumber],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        message: 'Auth profile updated successfully',
        auth_profile: Number.parseInt(auth_profile)
      });
    }
  );
});

// Check if user is registered on-chain
router.get('/onchain-status/:whatsapp_number', async (req, res) => {
  try {
    const { whatsapp_number } = req.params;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    const isRegistered = await contractService.isUserRegisteredOnChain(whatsapp_number);
    
    res.json({
      whatsappNumber: whatsapp_number,
      isRegisteredOnChain: isRegistered
    });
  } catch (error) {
    console.error('Error checking on-chain status:', error);
    res.status(500).json({ 
      error: 'Failed to check on-chain status', 
      details: error.message 
    });
  }
});

// Get network information
router.get('/network-info', (req, res) => {
  try {
    const networkInfo = contractService.getNetworkInfo();
    res.json(networkInfo);
  } catch (error) {
    console.error('Error getting network info:', error);
    res.status(500).json({ 
      error: 'Failed to get network info', 
      details: error.message 
    });
  }
});

module.exports = router; 