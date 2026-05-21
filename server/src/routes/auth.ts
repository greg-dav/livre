import { Router } from 'express';

const router = Router();

// POST /api/auth/login
router.post('/login', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
