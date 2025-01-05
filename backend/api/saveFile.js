import express from 'express';
import { Octokit } from '@octokit/rest';
import { sanitizePath } from '../middleware/security.js';

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

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repository format' });
    }

    const sanitizedPath = sanitizePath(path);
    if (!sanitizedPath) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    console.log('Saving file with session token:', {
      sessionID: req.sessionID,
      path: sanitizedPath,
      repository: `${owner}/${repo}`
    });

    const octokit = new Octokit({ auth: token });

    // Try to get the current file to get its SHA
    let sha;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: sanitizedPath,
      });
      sha = existingFile.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist yet, which is fine
    }

    // Prepare the content
    let fileContent;
    try {
      if (typeof content === 'string') {
        fileContent = content;
      } else {
        fileContent = JSON.stringify(content, null, 2);
      }
    } catch (error) {
      console.error('Error stringifying content:', error);
      return res.status(400).json({ error: 'Invalid content format' });
    }

    // Create or update file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: sanitizedPath,
      message: sha ? 'Update notebook' : 'Create notebook',
      content: Buffer.from(fileContent).toString('base64'),
      ...(sha && { sha })
    });

    res.json({ 
      success: true, 
      data: response.data
    });

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

export default router;
