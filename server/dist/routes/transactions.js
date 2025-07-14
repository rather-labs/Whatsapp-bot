"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get transaction history
router.get('/', auth_1.authenticateToken, (req, res) => {
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = Number.parseInt(req.query.offset) || 0;
    database_1.default.all('SELECT * FROM transactions WHERE user_whatsapp_number = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user?.whatsappNumber, limit, offset], (err, transactions) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(transactions);
    });
});
exports.default = router;
//# sourceMappingURL=transactions.js.map