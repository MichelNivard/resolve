// backend/api/listNotebooks.js
const express = require('express');
const { Octokit } = require('@octokit/rest');

const router = express.Router();

async function listNotebooks(req, res) {
  try {
    const { repository } = req.query;
    if (!repository) {
      return res.status(400).json({ error: 'Repository parameter is required' });
    }

    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.error('No token found in cookies or headers');
      return res.status(401).json({ error: 'No token provided' });
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repository format' });
    }

    const octokit = new Octokit({ auth: token });

    // Get default branch
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    });
    const defaultBranch = repoData.default_branch;

    // Get tree
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 'true'
    });

    // Filter for .ipynb files
    const notebooks = treeData.tree
      .filter(item => item.type === 'blob' && item.path.endsWith('.ipynb'))
      .map(item => item.path);

    res.json({ notebooks });
  } catch (error) {
    console.error('Error listing notebooks:', error);
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Error listing notebooks' 
        : error.message 
    });
  }
}

router.get('/', listNotebooks);

module.exports = router;
