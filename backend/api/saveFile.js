const express = require('express');
const { Octokit } = require('@octokit/rest');
const { sanitizePath } = require('../middleware/security');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { content, path, repository } = req.body;
    
    const token = req.session?.githubToken;

    if (!token) {
      console.error('No GitHub token found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!content || !path || !repository) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Sanitize the file path
    const sanitizedPath = sanitizePath(path);
    if (!sanitizedPath) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repository format' });
    }

    console.log('Saving file with session token:', {
      sessionID: req.sessionID,
      path: sanitizedPath,
      repository: `${owner}/${repo}`
    });

    const octokit = new Octokit({ auth: token });

    // Check if file exists to get SHA
    let sha;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: sanitizedPath,
      });
      sha = fileData.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, which is fine
    }

    // Create or update file
    const contentStr = JSON.stringify(content, null, 2);
    const contentBase64 = Buffer.from(contentStr).toString('base64');

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: sanitizedPath,
      message: sha ? 'Update notebook' : 'Create notebook',
      content: contentBase64,
      ...(sha && { sha })
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error saving file:', error);
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Error saving file' 
        : error.message 
    });
  }
});

module.exports = router;
