import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './env';

import './db';

import { errorHandler } from './lib/errorHandler';
import { createAuthMiddleware } from './middleware/auth';
import { UsersRepository } from './repositories/UsersRepository';
import { ConfigRepository } from './repositories/ConfigRepository';
import { SetupRepository } from './repositories/SetupRepository';
import { BookCacheRepository } from './repositories/BookCacheRepository';
import { LibraryBooksRepository } from './repositories/LibraryBooksRepository';
import { ReadingLogRepository } from './repositories/ReadingLogRepository';
import { GoogleBooksAdapter } from './adapters/GoogleBooksAdapter';
import { GoogleBooksClientProvider } from './providers/GoogleBooksClientProvider';
import { GoogleBooksUsageStore } from './stores/GoogleBooksUsageStore';
import { OpenLibraryAdapter } from './adapters/OpenLibraryAdapter';
import { OpenLibraryImportLookup } from './strategies/OpenLibraryImportLookup';
import { GoogleBooksImportLookup } from './strategies/GoogleBooksImportLookup';
import { BookSourceRegistry } from './registries/BookSourceRegistry';
import { FormatRegistry } from './registries/FormatRegistry';
import { BookCacheProvider } from './providers/BookCacheProvider';
import { AuthService } from './services/AuthService';
import { AccountService } from './services/AccountService';
import { UsersService } from './services/UsersService';
import { BooksService } from './services/BooksService';
import { LibraryTransferService } from './services/LibraryTransferService';
import { LogService } from './services/LogService';
import { GoodreadsFormat } from './formats/GoodreadsFormat';
import { createAuthRouter } from './routes/auth';
import { createAccountRouter } from './routes/account';
import { createUsersRouter } from './routes/users';
import { createBooksRouter } from './routes/books';
import { createShelvesRouter } from './routes/shelves';
import { createLogRouter } from './routes/log';
import { createConfigRouter } from './routes/config';

const usersRepository = new UsersRepository();
const configRepository = new ConfigRepository();
const setupRepository = new SetupRepository();
const bookCacheRepository = new BookCacheRepository();
const libraryBooksRepository = new LibraryBooksRepository();
const readingLogRepository = new ReadingLogRepository();
const googleBooksUsageStore = new GoogleBooksUsageStore(configRepository);
const googleBooksClientProvider = new GoogleBooksClientProvider(configRepository);
const googleBooksAdapter = new GoogleBooksAdapter(googleBooksClientProvider, googleBooksUsageStore);
const openLibraryAdapter = new OpenLibraryAdapter();
// The one place concrete sources are named. The registry detects each source's capabilities from the
// ports it implements; Open Library is the keyless default for search, and Google Books takes over
// when a key is configured. The second list pairs each source with its import-lookup strategy.
const bookSourceRegistry = new BookSourceRegistry(
  [openLibraryAdapter, googleBooksAdapter],
  [
    new OpenLibraryImportLookup(openLibraryAdapter),
    new GoogleBooksImportLookup(googleBooksAdapter, googleBooksUsageStore),
  ]
);
const bookCacheProvider = new BookCacheProvider(bookCacheRepository);
const authService = new AuthService(usersRepository, setupRepository);
const accountService = new AccountService(usersRepository);
const usersService = new UsersService(usersRepository);
const booksService = new BooksService(
  bookSourceRegistry,
  bookCacheProvider,
  libraryBooksRepository,
  readingLogRepository
);
const formatRegistry = new FormatRegistry([GoodreadsFormat]);
const libraryTransferService = new LibraryTransferService(
  formatRegistry,
  libraryBooksRepository,
  readingLogRepository,
  bookSourceRegistry
);
const logService = new LogService(libraryBooksRepository, readingLogRepository);
const { requireAuth, requireAdmin } = createAuthMiddleware(usersRepository);

// Sweep expired book_cache entries on boot and every 24h thereafter.
bookCacheProvider.startPeriodicSweep();

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

app.use('/api/auth', authLimiter, createAuthRouter(authService, requireAuth));
app.use('/api/account', authLimiter, createAccountRouter(accountService, requireAuth));
app.use('/api/users', createUsersRouter(usersService, requireAdmin));
app.use('/api/books', createBooksRouter(booksService, libraryTransferService, requireAuth));
app.use('/api/shelves', createShelvesRouter(booksService, requireAuth));
app.use('/api/log', createLogRouter(logService, requireAuth));
app.use(
  '/api/config',
  createConfigRouter(configRepository, bookSourceRegistry.configurableSources(), requireAdmin)
);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

if (env.NODE_ENV === 'production') {
  const clientDir = path.join(__dirname, '..', 'public');
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

const server = app.listen(env.PORT, () => {
  console.log(`Livre running on port ${env.PORT} [${env.NODE_ENV}]`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
});
