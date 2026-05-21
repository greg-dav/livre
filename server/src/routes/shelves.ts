import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/shelves/:status
router.get('/:status', requireAuth, (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
