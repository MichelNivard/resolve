const express = require('express');
const { Octokit } = require('@octokit/rest');

const router = express.Router();

router.get('/', async (req, res) => {
  console.log('Incoming request to /api/user');
  const token = req.cookies.token;
  
  if (!token) {
    console.error('No GitHub token found in cookies');
    return res.status(401).json({ error: 'No authentication token found' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    // Fetch the authenticated user's details
    const { data } = await octokit.users.getAuthenticated();
    console.log('GitHub user data:', data);

    // Send back the user information
    res.json({ 
      name: data.name || data.login,
      login: data.login,
      avatar_url: data.avatar_url 
    });
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

module.exports = router;
