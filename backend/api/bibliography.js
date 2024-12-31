const express = require('express');
const { Octokit } = require('@octokit/rest');
const router = express.Router();

async function loadBibliography(req, res) {
  try {
    const { repository, notebookPath } = req.query;
    if (!repository || !notebookPath) {
      return res.status(400).json({ error: 'Repository and notebookPath parameters are required' });
    }

    const token = req.session?.githubToken;
    if (!token) {
      console.error('No GitHub token found in session');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repository.split('/');

    // Get the directory of the notebook
    const notebookDir = notebookPath.split('/').slice(0, -1).join('/');
    const bibPath = `${notebookDir}/references.bib`;

    try {
      // Try to get the .bib file
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: bibPath,
      });

      // Decode content from base64
      const content = Buffer.from(data.content, 'base64').toString();
      res.json({ content, path: bibPath, sha: data.sha });
    } catch (error) {
      if (error.status === 404) {
        // If .bib file doesn't exist, return empty content
        res.json({ content: '', path: bibPath });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading bibliography:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

async function saveBibliography(req, res) {
  try {
    const { content, path, repository, sha } = req.body;
    
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

    const octokit = new Octokit({ auth: token });

    const message = 'Update bibliography';
    const options = {
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
    };

    if (sha) {
      options.sha = sha;
    }

    await octokit.repos.createOrUpdateFileContents(options);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving bibliography:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

router.get('/load', loadBibliography);
router.post('/save', saveBibliography);

module.exports = router;
