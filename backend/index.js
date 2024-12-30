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

// Import security middleware
const { createRateLimiter, secureCookies, validateToken } = require('./middleware/security');

const authRoute = require('./api/auth');
const userRoute = require('./api/user');
const getTokenRoute = require('./api/getToken');
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

// Apply rate limiting to all routes
app.use(createRateLimiter());

// Protected routes that require token validation
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

protectedRoutes.forEach(route => {
    app.use(route, validateToken);
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/getToken', getTokenRoute);
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
