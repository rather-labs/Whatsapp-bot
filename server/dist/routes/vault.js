"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Deposit to vault
router.post('/deposit', auth_1.authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        // Check wallet balance
        database_1.default.get('SELECT wallet_balance FROM users WHERE whatsapp_number = ?', [req.user?.whatsappNumber], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (user.wallet_balance < amount) {
                return res.status(400).json({ error: 'Insufficient USDC balance' });
            }
            const depositId = (0, uuid_1.v4)();
            const txId = (0, uuid_1.v4)();
            // Create vault deposit
            database_1.default.run('INSERT INTO vault_deposits (id, user_whatsapp_number, amount) VALUES (?, ?, ?)', [depositId, req.user?.whatsappNumber, amount]);
            // Create transaction record
            database_1.default.run('INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)', [txId, req.user?.whatsappNumber, 'vault_deposit', amount, 'confirmed']);
            // Update wallet balances
            database_1.default.run('UPDATE users SET wallet_balance = wallet_balance - ?, vault_balance = vault_balance + ? WHERE whatsapp_number = ?', [amount, amount, req.user?.whatsappNumber]);
            res.json({
                message: 'Deposited to vault successfully',
                depositId: depositId,
                transactionId: txId,
                amount: amount,
                apy: 0.05 // 5% APY
            });
        });
    }
    catch (error) {
        console.error('Vault deposit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Withdraw from vault
router.post('/withdraw', auth_1.authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        // Check vault balance
        database_1.default.get('SELECT vault_balance FROM users WHERE whatsapp_number = ?', [req.user?.whatsappNumber], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (user.vault_balance < amount) {
                return res.status(400).json({ error: 'Insufficient vault balance' });
            }
            const txId = (0, uuid_1.v4)();
            // Create transaction record
            database_1.default.run('INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)', [txId, req.user?.whatsappNumber, 'vault_withdraw', amount, 'confirmed']);
            // Update wallet balances
            database_1.default.run('UPDATE users SET wallet_balance = wallet_balance + ?, vault_balance = vault_balance - ? WHERE whatsapp_number = ?', [amount, amount, req.user?.whatsappNumber]);
            res.json({
                message: 'Withdrawn from vault successfully',
                transactionId: txId,
                amount: amount
            });
        });
    }
    catch (error) {
        console.error('Vault withdraw error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get vault deposits
router.get('/deposits', auth_1.authenticateToken, (req, res) => {
    database_1.default.all('SELECT * FROM vault_deposits WHERE user_whatsapp_number = ? ORDER BY created_at DESC', [req.user?.whatsappNumber], (err, deposits) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(deposits);
    });
});
exports.default = router;
//# sourceMappingURL=vault.js.map