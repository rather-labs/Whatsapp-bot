import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    whatsappNumber: string;
    username?: string;
    type?: string;
  };
}

// Authentication middleware for JWT tokens
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    req.user = user as { whatsappNumber: string; username?: string; type?: string };
    next();
  });
}

export {
  authenticateToken,
  type AuthenticatedRequest
}; 