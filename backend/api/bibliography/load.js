const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');

async function loadBibliography(req, res) {
  try {
    const { repository, notebookPath } = req.query;
    if (!repository || !notebookPath) {
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

    // Define possible bib file locations
    const possiblePaths = [
      // Same directory as notebook
      `${notebookPath.substring(0, notebookPath.lastIndexOf('/'))}/references.bib`,
      // Root of repo
      'references.bib',
      // References directory
      'references/main.bib'
    ];

    // Try each path until we find the .bib file
    for (const bibPath of possiblePaths) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: bibPath,
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return res.json({ content, path: bibPath, sha: data.sha });
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        // Continue to next path if file not found
      }
    }

    // No .bib file found
    res.status(404).json({ error: 'No bibliography file found' });
  } catch (error) {
    console.error('Error loading bibliography:', error);
    res.status(500).json({ error: error.message });
  }
}

router.get('/', loadBibliography);

module.exports = router;
