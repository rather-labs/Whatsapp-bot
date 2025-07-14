import express, { Response } from 'express';
import { networkConfig } from '../config/blockchain';

const router = express.Router();

// Health check
router.get('/health', (_req: any, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: networkConfig?.name || 'unknown',
    database: 'connected',
    blockchain: 'connected'
  });
});

export default router; 