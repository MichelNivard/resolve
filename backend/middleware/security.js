import rateLimit from 'express-rate-limit';
import path from 'path';

// Rate limiting middleware
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return rateLimit({
        windowMs,
        max,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Path sanitization middleware
export const sanitizePath = (filePath) => {
    if (!filePath) return '';
    // Normalize the path and remove any attempts to traverse up
    return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
};

// Enhanced cookie security middleware
export const secureCookies = (req, res, next) => {
    // Set secure cookie options in production
    if (process.env.NODE_ENV === 'production') {
        res.cookie('token', req.cookies.token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }
    next();
};

// Token validation middleware
export const validateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Add any additional token validation logic here
    // For example, checking token format, expiration, etc.
    
    req.token = token;
    next();
};
