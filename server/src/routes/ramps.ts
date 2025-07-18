import express, { type Response, type Request } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';


const router = express.Router();

// Generate onRamp URL
router.post('/onramp', async (req: Request, res: Response) => {
  try {
    // All on ramp actions require external user action
    return res.status(200).json({ message: `To *execute the onramp*, tap in the link below

${process.env.FRONTEND_URL}/actions/onramp`});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate offRamp URL
router.post('/offramp', async (req: Request, res: Response) => {
  try {
    // All on ramp actions require external user action
    return res.status(200).json({ message: `To *execute the offramp*, tap in the link below

${process.env.FRONTEND_URL}/actions/offramp`});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 