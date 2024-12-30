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

    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

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

    res.json(data);
  } catch (error) {
    console.error('Error saving bibliography:', error);
    res.status(500).json({ error: error.message });
  }
}

router.post('/', saveBibliography);

module.exports = router;
