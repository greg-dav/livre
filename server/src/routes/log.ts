import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/log
router.post('/', requireAuth, (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
