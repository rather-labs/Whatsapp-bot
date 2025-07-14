"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const viem_1 = require("viem");
const database_1 = __importDefault(require("../config/database"));
const blockchain_1 = require("../config/blockchain");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get wallet balance
router.get('/balance', auth_1.authenticateToken, async (req, res) => {
    try {
        database_1.default.get('SELECT * FROM users WHERE whatsapp_number = ?', [req.user?.whatsappNumber], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Get on-chain balances
            let ethBalance = '0';
            let usdcBalance = '0';
            if (blockchain_1.publicClient) {
                try {
                    ethBalance = (0, viem_1.formatEther)(await blockchain_1.publicClient.getBalance({ address: (0, viem_1.getAddress)(user.wallet_address) }));
                    const usdcContract = (0, viem_1.getContract)({
                        address: blockchain_1.USDC_CONTRACT_ADDRESS,
                        abi: blockchain_1.USDC_ABI,
                        publicClient: blockchain_1.publicClient
                    });
                    const usdcBalanceRaw = await usdcContract.read.balanceOf([(0, viem_1.getAddress)(user.wallet_address)]);
                    usdcBalance = (0, viem_1.formatUnits)(usdcBalanceRaw, 6); // USDC has 6 decimals
                }
                catch (error) {
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
    }
    catch (error) {
        console.error('Balance check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Send USDC payment
router.post('/pay', auth_1.authenticateToken, async (req, res) => {
    try {
        const { amount, recipient } = req.body;
        if (!amount || !recipient) {
            return res.status(400).json({ error: 'Amount and recipient are required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }
        // Get user wallet
        database_1.default.get('SELECT * FROM users WHERE whatsapp_number = ?', [req.user?.whatsappNumber], async (err, user) => {
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
            const txId = (0, uuid_1.v4)();
            database_1.default.run('INSERT INTO transactions (id, user_whatsapp_number, type, amount, recipient, status) VALUES (?, ?, ?, ?, ?, ?)', [txId, req.user?.whatsappNumber, 'payment', amount, recipient, 'pending']);
            // Update local balance
            database_1.default.run('UPDATE users SET wallet_balance = wallet_balance - ? WHERE whatsapp_number = ?', [amount, req.user?.whatsappNumber]);
            // If recipient exists in our system, update their balance
            database_1.default.get('SELECT whatsapp_number FROM users WHERE whatsapp_number = ?', [recipient], (err, recipientUser) => {
                if (recipientUser) {
                    database_1.default.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE whatsapp_number = ?', [amount, recipientUser.whatsapp_number]);
                }
            });
            // Send on-chain transaction if publicClient is available
            if (blockchain_1.publicClient && user.wallet_address) {
                try {
                    // Note: In a real implementation, you would decrypt the private key using the encrypted_pin
                    // For now, we'll skip the blockchain transaction and just do off-chain
                    console.log('Blockchain transaction skipped - wallet address not configured');
                    // Update transaction record
                    database_1.default.run('UPDATE transactions SET status = ? WHERE id = ?', ['confirmed', txId]);
                    res.json({
                        message: 'Payment sent successfully (off-chain)',
                        transactionId: txId,
                        amount: amount,
                        recipient: recipient
                    });
                }
                catch (error) {
                    console.error('Blockchain transaction error:', error);
                    // Update transaction status to failed
                    database_1.default.run('UPDATE transactions SET status = ? WHERE id = ?', ['failed', txId]);
                    res.status(500).json({ error: 'Blockchain transaction failed', transactionId: txId });
                }
            }
            else {
                // Off-chain only
                database_1.default.run('UPDATE transactions SET status = ? WHERE id = ?', ['confirmed', txId]);
                res.json({
                    message: 'Payment sent successfully (off-chain)',
                    transactionId: txId,
                    amount: amount,
                    recipient: recipient
                });
            }
        });
    }
    catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Buy USDC
router.post('/buy', auth_1.authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        // Simulate buying USDC with fiat
        const txId = (0, uuid_1.v4)();
        database_1.default.run('INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)', [txId, req.user?.whatsappNumber, 'buy', amount, 'confirmed']);
        // Update wallet balance
        database_1.default.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE whatsapp_number = ?', [amount, req.user?.whatsappNumber]);
        res.json({
            message: 'USDC purchased successfully',
            transactionId: txId,
            amount: amount,
            newBalance: 'updated'
        });
    }
    catch (error) {
        console.error('Buy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Sell USDC
router.post('/sell', auth_1.authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        // Check balance
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
            const txId = (0, uuid_1.v4)();
            database_1.default.run('INSERT INTO transactions (id, user_whatsapp_number, type, amount, status) VALUES (?, ?, ?, ?, ?)', [txId, req.user?.whatsappNumber, 'sell', amount, 'confirmed']);
            // Update wallet balance
            database_1.default.run('UPDATE users SET wallet_balance = wallet_balance - ? WHERE whatsapp_number = ?', [amount, req.user?.whatsappNumber]);
            res.json({
                message: 'USDC sold successfully',
                transactionId: txId,
                amount: amount,
                newBalance: 'updated'
            });
        });
    }
    catch (error) {
        console.error('Sell error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=wallet.js.map