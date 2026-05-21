import express from 'express';
import cors from 'cors';
import path from 'path';

if (!process.env.JWT_SECRET) {
  console.error('Fatal: JWT_SECRET is not set');
  process.exit(1);
}

import './db';

import authRoutes from './routes/auth';
import booksRoutes from './routes/books';
import shelvesRoutes from './routes/shelves';
import logRoutes from './routes/log';

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ?? 3001;

const app = express();

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/shelves', shelvesRoutes);
app.use('/api/log', logRoutes);

if (isProd) {
  const clientDir = path.join(__dirname, '..', 'public');
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Livre running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
});
