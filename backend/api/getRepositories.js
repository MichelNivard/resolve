// backend/api/getRepositories.js
const express = require('express');
const { Octokit } = require('@octokit/rest');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const token = req.session.githubToken;

    if (!token) {
      console.error('No token found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const octokit = new Octokit({ auth: token });

    // Get repositories where user is a collaborator
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      affiliation: 'owner,collaborator',
      sort: 'updated',
      per_page: 100
    });

    // Format the response to include only necessary information
    const formattedRepos = repos.map(repo => ({
      id: repo.id,
      fullName: repo.full_name,
      owner: {
        login: repo.owner.login
      },
      name: repo.name,
      private: repo.private
    }));

    res.json({ repositories: formattedRepos });
  } catch (err) {
    console.error('Error fetching repositories:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

module.exports = router;
