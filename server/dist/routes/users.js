"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
// User registration
router.post('/register', async (req, res) => {
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
        database_1.default.get('SELECT whatsapp_number FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err, row) => {
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
                database_1.default.run('INSERT INTO users (whatsapp_number, username, encrypted_pin, wallet_address, wallet_balance, vault_balance, created_at, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [whatsapp_number, username, encryptedPin, wallet_address, 0, 0, utcTimestamp, utcTimestamp], (err) => {
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
                });
            }
            catch (error) {
                console.error('❌ Registration failed:', error);
                return res.status(500).json({
                    error: 'Registration failed',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    catch (error) {
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
    database_1.default.get('SELECT * FROM users WHERE whatsapp_number = ?', [whatsapp_number], async (err, user) => {
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
        const token = jsonwebtoken_1.default.sign({ whatsappNumber: user.whatsapp_number }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
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
exports.default = router;
//# sourceMappingURL=users.js.map