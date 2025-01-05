// backend/api/getRepositories.js
import express from 'express';
import { Octokit } from '@octokit/rest';

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

    // Format repositories
    const repositories = repos.map(repo => ({
      id: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      owner: {
        login: repo.owner.login
      }
    }));

    res.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

export default router;
