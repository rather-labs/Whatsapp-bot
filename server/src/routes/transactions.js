const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get transaction history
router.get('/', authenticateToken, (req, res) => {
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

module.exports = router; 