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

// Callback to handle token exchange
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  console.log('Received code from GitHub:', { 
    hasCode: !!code,
    codeLength: code ? code.length : 0 
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
      data: tokenRes.data
    });

    if (!tokenRes.data.access_token) {
      console.error('No access token in response:', tokenRes.data);
      return res.status(400).send('No access token received');
    }

    res.cookie('token', tokenRes.data.access_token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.redirect('http://localhost:3000');
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

module.exports = router;
