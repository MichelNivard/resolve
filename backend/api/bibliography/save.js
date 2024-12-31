const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');

async function saveBibliography(req, res) {
  try {
    const { content, path, repository } = req.body;
    if (!content || !path || !repository) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const [owner, repo] = repository.split('/');
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Invalid repository format' });
    }

    const token = req.session?.githubToken;
    if (!token) {
      console.error('No GitHub token found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('Saving bibliography with session token:', {
      sessionID: req.sessionID,
      path,
      repository: `${owner}/${repo}`
    });

    const octokit = new Octokit({ auth: token });

    // Check if file exists to get SHA
    let sha;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      sha = fileData.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, which is fine
    }

    // Create or update file
    const contentBase64 = Buffer.from(content).toString('base64');

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: sha ? 'Update bibliography file' : 'Create bibliography file',
      content: contentBase64,
      ...(sha && { sha })
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error saving bibliography:', error);
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: 'Repository or file not found' });
    }
    res.status(500).json({ error: 'Failed to save bibliography' });
  }
}

router.post('/', saveBibliography);

module.exports = router;
