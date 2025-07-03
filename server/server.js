/**
 * WhatsApp Bot Backend Server
 * 
 * TIMESTAMP POLICY: All timestamps are stored in UTC/ISO 8601 format
 * - Database columns use TEXT type with UTC datetime defaults
 * - All timestamp operations use new Date().toISOString()
 * - This ensures consistent timezone handling across all environments
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { ecb } = require('@noble/ciphers/aes');
const axios = require('axios');
const { constants } = require('node:buffer');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3002;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      whatsapp_number TEXT PRIMARY KEY,
      username TEXT,
      encrypted_pin TEXT NOT NULL,
      wallet_address TEXT,
      risk_profile INTEGER DEFAULT 1,
      auth_profile INTEGER DEFAULT 1,
      wallet_balance REAL DEFAULT 0,
      vault_balance REAL DEFAULT 0,
      last_activity TEXT,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      updated_at TEXT DEFAULT (datetime('now', 'utc'))
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_whatsapp_number TEXT NOT NULL,
      name TEXT NOT NULL,
      contact_userid TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number),
      UNIQUE(user_whatsapp_number, contact_userid)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_whatsapp_number TEXT NOT NULL,
      tx_hash TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      recipient TEXT,
      status TEXT DEFAULT 'pending',
      gas_used INTEGER,
      gas_price TEXT,
      block_number INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number)
    )`,
    `CREATE TABLE IF NOT EXISTS vault_deposits (
      id TEXT PRIMARY KEY,
      user_whatsapp_number TEXT NOT NULL,
      amount REAL NOT NULL,
      apy REAL DEFAULT 0.05,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'utc')),
      FOREIGN KEY (user_whatsapp_number) REFERENCES users (whatsapp_number)
    )`
  ];

  for (const table of tables) {
    db.run(table, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  }
  
}


// Blockchain configuration
const NETWORK_CONFIG = {
  sepolia: {
    rpc: process.env.SEPOLIA_RPC || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 11155111,
    name: 'Sepolia Testnet'
  },
  polygon: {
    rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon Mainnet'
  }
};

const currentNetwork = process.env.NETWORK || 'sepolia';
const networkConfig = NETWORK_CONFIG[currentNetwork];

// Initialize provider
let provider;
try {
  provider = new ethers.JsonRpcProvider(networkConfig.rpc);
  console.log(`✅ Connected to ${networkConfig.name}`);
} catch (error) {
  console.error('❌ Failed to connect to blockchain:', error.message);
}

// USDC contract (example - replace with actual USDC contract address)
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Sepolia USDC
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Utility functions
function encryptUserPin(pin, secret) {
  return ecb(Buffer.from(secret)).encrypt(Buffer.from(pin.toString())).toString();
}

function decryptUserPin(encryptedPin, secret) {
  return Number(ecb(Buffer.from(secret)).decrypt(Buffer.from(encryptedPin)));
} 

function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

// Utility function to format UTC timestamps in user's locale
function formatTimestamp(utcTimestamp, options = {}) {
  if (!utcTimestamp) return null;
  
  try {
    const date = new Date(utcTimestamp);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };
    
    return date.toLocaleString(undefined, { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return null;
  }
}

// Session management functions
const updateUserActivity = (whatsappNumber) => {
  return new Promise((resolve, reject) => {
    const utcTimestamp = new Date().toISOString();
    db.run(
      'UPDATE users SET last_activity = ? WHERE whatsapp_number = ?',
      [utcTimestamp, whatsappNumber],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

function isSessionExpired(lastActivity) {
  if (!lastActivity) return true;
  
  const lastActivityTime = new Date(lastActivity);
  const currentTime = new Date();
  const timeDifference = currentTime - lastActivityTime;
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return timeDifference > fiveMinutes;
}

function getUserSessionStatus(whatsappNumber) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT last_activity FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          resolve({ exists: false, expired: true });
        } else {
          const expired = isSessionExpired(user.last_activity);
          const lastActivityTime = new Date(user.last_activity);
          const expirationTime = new Date(lastActivityTime.getTime() + (5 * 60 * 1000)); // 5 minutes from last activity
          resolve({ 
            exists: true, 
            expired, 
            lastActivity: user.last_activity,
            expirationTime: expirationTime.toISOString()
          });
        }
      }
    );
  });
}

// Enhanced session management with PIN validation
function validateUserPin(whatsappNumber, pin) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT encrypted_pin FROM users WHERE whatsapp_number = ?',
      [whatsappNumber],
      (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          resolve({ valid: false, message: 'User not found' });
        } else {
          try {
            const encryptedPin = encryptUserPin(pin, process.env.JWT_SECRET);
            const isValid = user.encrypted_pin === encryptedPin;
            resolve({ 
              valid: isValid, 
              message: isValid ? 'PIN validated successfully' : 'Invalid PIN' 
            });
          } catch (error) {
            reject(error);
          }
        }
      }
    );
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: networkConfig.name,
    database: 'connected',
    blockchain: provider ? 'connected' : 'disconnected'
  });
});

// User registration
app.post('/api/users/register', async (req, res) => {
  try {
    console.log("Registering user");
    const { whatsapp_number, username, pin, wallet_address } = req.body;
    console.log("Whatsapp number:", whatsapp_number);
    console.log("Username:", username);
    console.log("PIN:", pin);
    if (!whatsapp_number || !pin) {
      return res.status(400).json({ error: 'WhatsApp number and PIN are required' });
    }

    // Validate PIN format (4-6 digits)
    const pinNumber = Number.parseInt(pin, 10);
    if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
      return res.status(400).json({ error: 'PIN must be a 4-6 digit number' });
    }

    // Check if user already exists
    db.get('SELECT whatsapp_number FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Create new user
      const encryptedPin = encryptUserPin(pinNumber, process.env.JWT_SECRET);

      db.run(
        'INSERT INTO users (whatsapp_number, username, encrypted_pin, wallet_address, wallet_balance, vault_balance) VALUES (?, ?, ?, ?, ?, ?)',
        [whatsapp_number, username, encryptedPin, wallet_address, 0, 0], 
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          res.status(201).json({
            message: 'User created successfully',
            whatsappNumber: whatsapp_number,
            walletAddress: wallet_address,
            walletBalance: 0,
            vaultBalance: 0
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/users/login', (req, res) => {
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
app.post('/api/users/session/check', async (req, res) => {
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
app.post('/api/users/session/update', async (req, res) => {
  try {
    const { whatsapp_number } = req.body;
    
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    await updateUserActivity(whatsapp_number);
    
    res.json({
      message: 'Activity updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Activity update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced session management - Check session and handle PIN validation
app.post('/api/users/session/validate', async (req, res) => {
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
app.get('/api/users/session/status/:whatsapp_number', async (req, res) => {
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
app.get('/api/users/profile', authenticateToken, (req, res) => {
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

// Get wallet balance
app.get('/api/wallet/balance', authenticateToken, async (req, res) => {
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
app.post('/api/wallet/pay', authenticateToken, async (req, res) => {
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
app.post('/api/wallet/buy', authenticateToken, async (req, res) => {
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
app.post('/api/wallet/sell', authenticateToken, async (req, res) => {
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

// Deposit to vault
app.post('/api/vault/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

          // Check wallet balance
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

        const depositId = uuidv4();
        const txId = uuidv4();
        
        // Create vault deposit
        db.run(
          'INSERT INTO vault_deposits (id, user_whatsapp_number, amount) VALUES (?, ?, ?)',
          [depositId, req.user.whatsappNumber, amount]
        );

        // Create transaction record
        db.run(
          'INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)',
          [txId, req.user.whatsappNumber, 'vault_deposit', amount, 'confirmed']
        );

        // Update wallet balances
        db.run(
          'UPDATE users SET wallet_balance = wallet_balance - ?, vault_balance = vault_balance + ? WHERE whatsapp_number = ?',
          [amount, amount, req.user.whatsappNumber]
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
app.post('/api/vault/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Check vault balance
    db.get('SELECT vault_balance FROM users WHERE whatsapp_number = ?', [req.user.whatsappNumber], (err, user) => {
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
        [txId, req.user.whatsappNumber, 'vault_withdraw', amount, 'confirmed']
      );

      // Update wallet balances
      db.run(
        'UPDATE users SET wallet_balance = wallet_balance + ?, vault_balance = vault_balance - ? WHERE whatsapp_number = ?',
        [amount, amount, req.user.whatsappNumber]
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



// Get transaction history
app.get('/api/transactions', authenticateToken, (req, res) => {
  const limit = Number.parseInt(req.query.limit) || 10;
  const offset = Number.parseInt(req.query.offset) || 0;

  db.all(
    'SELECT * FROM transactions WHERE user_whatsapp_number = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user.whatsappNumber, limit, offset],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(transactions);
    }
  );
});

// Get vault deposits
app.get('/api/vault/deposits', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM vault_deposits WHERE user_whatsapp_number = ? ORDER BY created_at DESC',
    [req.user.whatsappNumber],
    (err, deposits) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(deposits);
    }
  );
});

// Contact Management Endpoints

// Add a contact
app.post('/api/contacts', authenticateToken, (req, res) => {
  const { name, contact_userid } = req.body;

  if (!name || !contact_userid) {
    return res.status(400).json({ error: 'Name and contact_userid are required' });
  }

  const contactId = uuidv4();
  
  db.run(
    'INSERT INTO contacts (id, user_whatsapp_number, name, contact_userid) VALUES (?, ?, ?, ?)',
    [contactId, req.user.whatsappNumber, name, contact_userid],
    (err) => {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Contact already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        message: 'Contact added successfully',
        contactId: contactId,
        name: name,
        contact_userid: contact_userid
      });
    }
  );
});

// Get all contacts for a user
app.get('/api/contacts', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE user_whatsapp_number = ? ORDER BY name',
    [req.user.whatsappNumber],
    (err, contacts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(contacts);
    }
  );
});

// Get a specific contact
app.get('/api/contacts/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  
  db.get(
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE id = ? AND user_whatsapp_number = ?',
    [contactId, req.user.whatsappNumber],
    (err, contact) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json(contact);
    }
  );
});

// Update a contact
app.put('/api/contacts/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  const { name, contact_userid } = req.body;

  if (!name || !contact_userid) {
    return res.status(400).json({ error: 'Name and contact_userid are required' });
  }

  db.run(
    'UPDATE contacts SET name = ?, contact_userid = ? WHERE id = ? AND user_whatsapp_number = ?',
    [name, contact_userid, contactId, req.user.whatsappNumber],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json({
        message: 'Contact updated successfully',
        contactId: contactId,
        name: name,
        contact_userid: contact_userid
      });
    }
  );
});

// Delete a contact
app.delete('/api/contacts/:contactId', authenticateToken, (req, res) => {
  const { contactId } = req.params;
  
  db.run(
    'DELETE FROM contacts WHERE id = ? AND user_whatsapp_number = ?',
    [contactId, req.user.whatsappNumber],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      res.json({
        message: 'Contact deleted successfully',
        contactId: contactId
      });
    }
  );
});

// Update risk profile (integer)
app.post('/api/users/risk-profile', authenticateToken, (req, res) => {
  const { risk_profile } = req.body;

  if (!risk_profile || ![1, 2, 3].includes(Number.parseInt(risk_profile))) {
    return res.status(400).json({ error: 'Valid risk profile is required (1=low, 2=moderate, 3=high)' });
  }

  const utcTimestamp = new Date().toISOString();
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
app.post('/api/users/auth-profile', authenticateToken, (req, res) => {
  const { auth_profile } = req.body;

  if (!auth_profile || ![1, 2, 3].includes(Number.parseInt(auth_profile))) {
    return res.status(400).json({ error: 'Valid auth profile is required (1=basic, 2=enhanced, 3=premium)' });
  }

  const utcTimestamp = new Date().toISOString();
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: ${networkConfig.name}`);
  console.log("💾 Database: SQLite");
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
}); 