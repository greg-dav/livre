import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './env';

import './db';

import { errorHandler } from './lib/route';
import { UsersRepository } from './repositories/UsersRepository';
import { ConfigRepository } from './repositories/ConfigRepository';
import { SetupRepository } from './repositories/SetupRepository';
import { GoogleBooksClient } from './clients/GoogleBooksClient';
import { AuthService } from './services/AuthService';
import { BooksService } from './services/BooksService';
import { createAuthRouter } from './routes/auth';
import { createBooksRouter } from './routes/books';
import { createShelvesRouter } from './routes/shelves';
import { createLogRouter } from './routes/log';

const usersRepository = new UsersRepository();
const configRepository = new ConfigRepository();
const setupRepository = new SetupRepository();
const googleBooksClient = new GoogleBooksClient();
const authService = new AuthService(usersRepository, setupRepository, googleBooksClient);
const booksService = new BooksService(configRepository, googleBooksClient);

const app = express();

app.use(helmet());

if (env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, createAuthRouter(authService));
app.use('/api/books', createBooksRouter(booksService));
app.use('/api/shelves', createShelvesRouter());
app.use('/api/log', createLogRouter());

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

if (env.NODE_ENV === 'production') {
  const clientDir = path.join(__dirname, '..', 'public');
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

app.listen(env.PORT, () => {
  console.log(`Livre running on port ${env.PORT} [${env.NODE_ENV}]`);
});
