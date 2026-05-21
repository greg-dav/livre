import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/books/search?q=
router.get('/search', requireAuth, (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
