const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

const router = express.Router();

// Redirect user to GitHub OAuth
router.get('/', (req, res) => {
  try {
    console.log('Environment variables check:', {
      hasClientId: !!process.env.GITHUB_CLIENT_ID,
      hasRedirectUri: !!process.env.REDIRECT_URI,
      redirectUri: process.env.REDIRECT_URI
    });

    const params = querystring.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: process.env.REDIRECT_URI,
      scope: 'repo'
    });
    console.log('Redirecting to GitHub with params:', params);
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  } catch (error) {
    console.error('Error in initial redirect:', error);
    res.status(500).send('Error initiating GitHub OAuth');
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

// Callback to handle token exchange
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  console.log('Received code from GitHub:', { 
    hasCode: !!code,
    codeLength: code ? code.length : 0,
    sessionID: req.sessionID
  });
  
  if (!code) {
    console.error('No code received from GitHub');
    return res.status(400).send('No code received from GitHub');
  }

  try {
    const requestBody = {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.REDIRECT_URI
    };

    console.log('Token exchange request:', {
      url: 'https://github.com/login/oauth/access_token',
      hasClientId: !!requestBody.client_id,
      hasClientSecret: !!requestBody.client_secret,
      hasCode: !!requestBody.code,
      redirectUri: requestBody.redirect_uri
    });

    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      requestBody,
      {
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Token response:', {
      status: tokenRes.status,
      hasAccessToken: !!tokenRes.data.access_token,
      sessionID: req.sessionID
    });

    if (!tokenRes.data.access_token) {
      console.error('No access token in response:', tokenRes.data);
      return res.status(400).send('No access token received');
    }

    // Store token in session
    req.session.githubToken = tokenRes.data.access_token;
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).send('Error saving session');
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
  } catch (err) {
    console.error('Token exchange error:', {
      message: err.message,
      response: err.response ? {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      } : 'No response',
      requestError: err.request ? 'Request error occurred' : 'No request error'
    });
    res.status(500).send('Failed to exchange token');
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

module.exports = router;
