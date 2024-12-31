const path = require('path');
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
require('dotenv').config({ path: envPath });

console.log('Environment variables loaded:', {
  hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
  hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
  hasRedirectUri: !!process.env.REDIRECT_URI
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

// Import security middleware
const { createRateLimiter, secureCookies } = require('./middleware/security');

const authRoute = require('./api/auth');
const userRoute = require('./api/user');
const fetchFileRoute = require('./api/fetchFile');
const saveFileRoute = require('./api/saveFile');
const lockFileRoute = require('./api/lockFile');
const unlockFileRoute = require('./api/unlockFile');
const getRepositoriesRoute = require('./api/getRepositories');
const listNotebooksRoute = require('./api/listNotebooks');
const bibliographyRoute = require('./api/bibliography');

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
  store: new FileStore({
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
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/fetchFile', fetchFileRoute);
app.use('/api/saveFile', saveFileRoute);
app.use('/api/lockFile', lockFileRoute);
app.use('/api/unlockFile', unlockFileRoute);
app.use('/api/repositories', getRepositoriesRoute);
app.use('/api/listNotebooks', listNotebooksRoute);
app.use('/api/bibliography', bibliographyRoute);

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
