import express, { Response } from 'express';
import db from '../config/database';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get transaction history
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const offset = Number.parseInt(req.query.offset as string) || 0;

  db.all(
    'SELECT * FROM transactions WHERE user_whatsapp_number = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user?.whatsappNumber, limit, offset],
    (err: any, transactions: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(transactions);
    }
  );
});

export default router; 