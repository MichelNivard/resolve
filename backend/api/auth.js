import express from 'express';
import axios from 'axios';

const router = express.Router();

// Redirect user to GitHub OAuth
router.get('/', (req, res) => {
  try {
    console.log('Environment variables check:', {
      hasClientId: !!process.env.GITHUB_CLIENT_ID,
      hasRedirectUri: !!process.env.REDIRECT_URI,
      redirectUri: process.env.REDIRECT_URI
    });

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.REDIRECT_URI,
      scope: 'repo'
    }).toString();
    
    console.log('Redirecting to GitHub with params:', params);
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  } catch (error) {
    console.error('Error in auth redirect:', error);
    res.status(500).json({ error: 'Failed to initiate GitHub OAuth' });
  }
});

// Add a route to check session status
router.get('/check', (req, res) => {
  console.log('Session check:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    githubToken: !!req.session?.githubToken
  });
  res.json({ 
    authenticated: !!req.session?.githubToken,
    sessionID: req.sessionID
  });
});

// GitHub OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      console.error('No access token received:', tokenResponse.data);
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // Store token in session
    req.session.githubToken = access_token;
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      console.log('Session saved successfully:', {
        sessionID: req.sessionID,
        hasToken: !!req.session.githubToken
      });

      // Redirect to frontend
      const frontendUrl = process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000';
      
      res.redirect(frontendUrl);
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Add logout endpoint
router.post('/logout', (req, res) => {
  console.log('Logging out user:', {
    sessionID: req.sessionID,
    hasToken: !!req.session?.githubToken
  });

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
