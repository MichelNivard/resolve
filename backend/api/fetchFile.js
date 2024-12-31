// backend/api/fetchFile.js
const express = require('express');
const { Octokit } = require('@octokit/rest');
const { sanitizePath } = require('../middleware/security');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { path: filePath, repository } = req.query;
    
    // Use the token from the session
    const token = req.session.githubToken;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!repository) {
      console.error('No repository provided');
      return res.status(400).json({ error: 'Repository not specified' });
    }

    // Sanitize the file path
    const sanitizedPath = sanitizePath(filePath);
    if (!sanitizedPath) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    console.log('Using session token for GitHub API');
    const octokit = new Octokit({ auth: token });

    // Extract owner and repo from repository (format: owner/repo)
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repository format. Expected "owner/repo"' });
    }

    console.log(`Fetching file ${sanitizedPath} from ${owner}/${repo}`);
    // Fetch the file content
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: sanitizedPath,
    });

    const content = Buffer.from(response.data.content, 'base64').toString();
    const ipynb = JSON.parse(content);

    res.json({ ipynb });
  } catch (error) {
    console.error('Error fetching file:', error);
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: 'File not found' });
    }
    // Generic error message in production
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Error fetching file' 
        : error.message 
    });
  }
});

module.exports = router;
