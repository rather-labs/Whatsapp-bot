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

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    req.user = user as { whatsappNumber: string; username?: string; type?: string };
    next();
  });
}

// Origin validation middleware to ensure requests come from authorized sources
function validateOrigin(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = [
    "::1",
    process.env.WHATSAPP_BOT_URL,
    process.env.FRONTEND_URL,
  ];

  const origin = req.headers.origin || req.headers.referer || req.ip || req.headers['x-forwarded-for'];
  const isFromAllowedOrigin = allowedOrigins.some(allowed => 
    origin?.includes(allowed.replace('http://', '').replace('https://', ''))
  );
  
  if (isFromAllowedOrigin) {
    next();
  } else {
    res.status(403).json({ error: 'Request not allowed from this origin' });
  }
}

// Combined middleware for authentication and origin validation
function authenticateAndValidateOrigin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  validateOrigin(req, res, () => {
    authenticateToken(req, res, next);
  });
}

export {
  authenticateToken,
  validateOrigin,
  authenticateAndValidateOrigin,
  type AuthenticatedRequest
}; 