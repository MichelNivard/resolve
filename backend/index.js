import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import session from 'express-session';
import FileStore from 'session-file-store';
import { createRateLimiter, secureCookies } from './middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

const FileStoreSession = FileStore(session);

console.log('Environment variables loaded:', {
  hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
  hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
  hasRedirectUri: !!process.env.REDIRECT_URI
});

const authRoute = await import('./api/auth.js');
const userRoute = await import('./api/user.js');
const fetchFileRoute = await import('./api/fetchFile.js');
const saveFileRoute = await import('./api/saveFile.js');
const lockFileRoute = await import('./api/lockFile.js');
const unlockFileRoute = await import('./api/unlockFile.js');
const getRepositoriesRoute = await import('./api/getRepositories.js');
const listNotebooksRoute = await import('./api/listNotebooks.js');
const bibliographyRoute = await import('./api/bibliography.js');

const app = express();

// CORS configuration based on environment
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGIN 
        : 'http://localhost:3000',
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(secureCookies);

// Configure express-session
app.use(session({
  store: new FileStoreSession({
    path: './sessions',
    ttl: 86400, // 1 day in seconds
    retries: 0,
    reapInterval: 3600, // 1 hour in seconds
    logFn: () => {}, // Disable verbose logging
    secret: process.env.SESSION_SECRET // Encrypt session files
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Forces cookie set on every response
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Protect against CSRF
  },
  name: 'sessionId'
}));

// Add session security middleware
app.use((req, res, next) => {
  if (req.session && req.session.githubToken) {
    // Add creation time if not exists
    if (!req.session.created) {
      req.session.created = Date.now();
    }

    // Regenerate session every hour
    const hour = 60 * 60 * 1000;
    if (Date.now() - req.session.created > hour) {
      const githubToken = req.session.githubToken;
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          next();
          return;
        }
        req.session.githubToken = githubToken;
        req.session.created = Date.now();
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Debug middleware for session
app.use((req, res, next) => {
  console.log('Session Debug:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    githubToken: !!req.session?.githubToken
  });
  next();
});

// Apply rate limiting to all routes
app.use(createRateLimiter());

// Protected routes that require session authentication
const protectedRoutes = [
    '/api/fetchFile',
    '/api/saveFile',
    '/api/lockFile',
    '/api/unlockFile',
    '/api/repositories',
    '/api/listNotebooks',
    '/api/bibliography/load',
    '/api/bibliography/save'
];

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session && req.session.githubToken) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

protectedRoutes.forEach(route => {
    app.use(route, requireAuth);
});

// Routes
app.use('/api/auth', authRoute.default);
app.use('/api/user', userRoute.default);
app.use('/api/fetchFile', fetchFileRoute.default);
app.use('/api/saveFile', saveFileRoute.default);
app.use('/api/lockFile', lockFileRoute.default);
app.use('/api/unlockFile', unlockFileRoute.default);
app.use('/api/repositories', getRepositoriesRoute.default);
app.use('/api/listNotebooks', listNotebooksRoute.default);
app.use('/api/bibliography', bibliographyRoute.default);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
