import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Generate JWT token for backend-bot
router.post('/token/backend-bot', (req: Request, res: Response) => {
  const { secret } = req.body;
  
  if (!secret || secret !== process.env.BACKEND_BOT_SECRET) {
    return res.status(401).json({ error: 'Invalid backend bot secret' });
  }
  
  const token = jwt.sign(
    { 
      type: 'backend-bot',
      iat: Date.now() 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ token });
});

// Generate JWT token for frontend
router.post('/token/frontend', (req: Request, res: Response) => {
  const { secret } = req.body;
  
  if (!secret || secret !== process.env.FRONTEND_SECRET) {
    return res.status(401).json({ error: 'Invalid frontend secret' });
  }
  
  const token = jwt.sign(
    { 
      type: 'frontend',
      iat: Date.now() 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ token });
});

export default router; 