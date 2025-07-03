const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
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
      id TEXT PRIMARY KEY,
      whatsapp_number TEXT UNIQUE NOT NULL,
      username TEXT,
      pin INTEGER NOT NULL,
      wallet_address TEXT,
      private_key_encrypted TEXT,
      risk_profile INTEGER DEFAULT 1,
      auth_profile INTEGER DEFAULT 1,
      wallet_balance REAL DEFAULT 0,
      vault_balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      contact_userid TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, contact_userid)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tx_hash TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      recipient TEXT,
      status TEXT DEFAULT 'pending',
      gas_used INTEGER,
      gas_price TEXT,
      block_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    `CREATE TABLE IF NOT EXISTS vault_deposits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      apy REAL DEFAULT 0.05,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`
  ];

  tables.forEach(table => {
    db.run(table, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  });
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
function encryptPrivateKey(privateKey, password) {
  // In production, use a proper encryption library
  return Buffer.from(privateKey).toString('base64');
}

function decryptPrivateKey(encryptedKey, password) {
  // In production, use a proper decryption library
  return Buffer.from(encryptedKey, 'base64').toString();
}

function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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
    const { whatsapp_number, username, pin } = req.body;

    if (!whatsapp_number || !pin) {
      return res.status(400).json({ error: 'WhatsApp number and PIN are required' });
    }

    // Validate PIN format (4-6 digits)
    const pinNumber = Number.parseInt(pin, 10);
    if (Number.isNaN(pinNumber) || pinNumber < 1000 || pinNumber > 999999) {
      return res.status(400).json({ error: 'PIN must be a 4-6 digit number' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Create new user
      const userId = uuidv4();
      const wallet = generateWallet();
      const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, pin.toString());

      db.run(
        'INSERT INTO users (id, whatsapp_number, username, pin, wallet_address, private_key_encrypted, wallet_balance, vault_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, whatsapp_number, username, pinNumber, wallet.address, encryptedPrivateKey, 1000, 0], // Start with 1000 USDC in wallet
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          res.status(201).json({
            message: 'User created successfully',
            userId: userId,
            walletAddress: wallet.address,
            walletBalance: 1000,
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

    if (user.pin !== pinNumber) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, whatsapp_number: user.whatsapp_number },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        whatsapp_number: user.whatsapp_number,
        username: user.username,
        wallet_address: user.wallet_address
      }
    });
  });
});

// Get user profile
app.get('/api/users/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, whatsapp_number, username, wallet_address, risk_profile, auth_profile, wallet_balance, vault_balance, created_at FROM users WHERE id = ?', 
    [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Get wallet balance
app.get('/api/wallet/balance', authenticateToken, async (req, res) => {
  try {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], async (err, user) => {
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
    db.get('SELECT * FROM wallets WHERE user_id = ?', [req.user.userId], async (err, wallet) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if (wallet.balance_usdc < amount) {
        return res.status(400).json({ error: 'Insufficient USDC balance' });
      }

      // Create transaction record
      const txId = uuidv4();
      db.run(
        'INSERT INTO transactions (id, user_id, type, amount, recipient, status) VALUES (?, ?, ?, ?, ?, ?)',
        [txId, req.user.userId, 'payment', amount, recipient, 'pending']
      );

      // Update local balance
      db.run(
        'UPDATE wallets SET balance_usdc = balance_usdc - ? WHERE user_id = ?',
        [amount, req.user.userId]
      );

      // If recipient exists in our system, update their balance
      db.get('SELECT user_id FROM users WHERE whatsapp_number = ?', [recipient], (err, recipientUser) => {
        if (recipientUser) {
          db.run(
            'UPDATE wallets SET balance_usdc = balance_usdc + ? WHERE user_id = ?',
            [amount, recipientUser.user_id]
          );
        }
      });

      // Send on-chain transaction if provider is available
      if (provider) {
        try {
          const privateKey = decryptPrivateKey(wallet.private_key_encrypted, user.pin.toString());
          const signer = new ethers.Wallet(privateKey, provider);
          const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, signer);

          // Convert amount to USDC units (6 decimals)
          const amountInUnits = ethers.parseUnits(amount.toString(), 6);
          
          const tx = await usdcContract.transfer(recipient, amountInUnits);
          const receipt = await tx.wait();

          // Update transaction record
          db.run(
            'UPDATE transactions SET tx_hash = ?, status = ?, gas_used = ?, gas_price = ?, block_number = ? WHERE id = ?',
            [tx.hash, 'confirmed', receipt.gasUsed.toString(), tx.gasPrice.toString(), receipt.blockNumber, txId]
          );

          res.json({
            message: 'Payment sent successfully',
            transactionId: txId,
            txHash: tx.hash,
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
      'INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, ?, ?, ?)',
      [txId, req.user.userId, 'buy', amount, 'confirmed']
    );

    // Update wallet balance
    db.run(
      'UPDATE wallets SET balance_usdc = balance_usdc + ? WHERE user_id = ?',
      [amount, req.user.userId]
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
    db.get('SELECT balance_usdc FROM wallets WHERE user_id = ?', [req.user.userId], (err, wallet) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      if (wallet.balance_usdc < amount) {
        return res.status(400).json({ error: 'Insufficient USDC balance' });
      }

      const txId = uuidv4();
      
      db.run(
        'INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user.userId, 'sell', amount, 'confirmed']
      );

      // Update wallet balance
      db.run(
        'UPDATE wallets SET balance_usdc = balance_usdc - ? WHERE user_id = ?',
        [amount, req.user.userId]
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
    db.get('SELECT balance_usdc FROM wallets WHERE user_id = ?', [req.user.userId], (err, wallet) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      if (wallet.balance_usdc < amount) {
        return res.status(400).json({ error: 'Insufficient USDC balance' });
      }

      const depositId = uuidv4();
      const txId = uuidv4();
      
      // Create vault deposit
      db.run(
        'INSERT INTO vault_deposits (id, user_id, amount) VALUES (?, ?, ?)',
        [depositId, req.user.userId, amount]
      );

      // Create transaction record
      db.run(
        'INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user.userId, 'vault_deposit', amount, 'confirmed']
      );

      // Update wallet balances
      db.run(
        'UPDATE wallets SET balance_usdc = balance_usdc - ?, vault_balance = vault_balance + ? WHERE user_id = ?',
        [amount, amount, req.user.userId]
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
    db.get('SELECT vault_balance FROM wallets WHERE user_id = ?', [req.user.userId], (err, wallet) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      if (wallet.vault_balance < amount) {
        return res.status(400).json({ error: 'Insufficient vault balance' });
      }

      const txId = uuidv4();
      
      // Create transaction record
      db.run(
        'INSERT INTO transactions (id, user_id, type, amount, status) VALUES (?, ?, ?, ?, ?)',
        [txId, req.user.userId, 'vault_withdraw', amount, 'confirmed']
      );

      // Update wallet balances
      db.run(
        'UPDATE wallets SET balance_usdc = balance_usdc + ?, vault_balance = vault_balance - ? WHERE user_id = ?',
        [amount, amount, req.user.userId]
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
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user.userId, limit, offset],
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
    'SELECT * FROM vault_deposits WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
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
    'INSERT INTO contacts (id, user_id, name, contact_userid) VALUES (?, ?, ?, ?)',
    [contactId, req.user.userId, name, contact_userid],
    function(err) {
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
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE user_id = ? ORDER BY name',
    [req.user.userId],
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
    'SELECT id, name, contact_userid, created_at FROM contacts WHERE id = ? AND user_id = ?',
    [contactId, req.user.userId],
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
    'UPDATE contacts SET name = ?, contact_userid = ? WHERE id = ? AND user_id = ?',
    [name, contact_userid, contactId, req.user.userId],
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
    'DELETE FROM contacts WHERE id = ? AND user_id = ?',
    [contactId, req.user.userId],
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

  db.run(
    'UPDATE users SET risk_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [Number.parseInt(risk_profile), req.user.userId],
    function(err) {
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

  db.run(
    'UPDATE users SET auth_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [Number.parseInt(auth_profile), req.user.userId],
    function(err) {
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
  console.log(`🚀 Blockchain Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: ${networkConfig.name}`);
  console.log(`💾 Database: SQLite`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down blockchain server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
}); 