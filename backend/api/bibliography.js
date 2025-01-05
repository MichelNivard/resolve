import express from 'express';
import { Octokit } from '@octokit/rest';
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
    const notebookDir = notebookPath.substring(0, notebookPath.lastIndexOf('/'));

    try {
      // Try to get bibliography.json from the same directory as the notebook
      const { data: bibFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: `${notebookDir}/bibliography.json`
      });

      const content = Buffer.from(bibFile.content, 'base64').toString('utf8');
      const bibliography = JSON.parse(content);
      res.json({ bibliography });
    } catch (error) {
      if (error.status === 404) {
        // If bibliography.json doesn't exist, return an empty bibliography
        res.json({ bibliography: {} });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading bibliography:', error);
    res.status(500).json({ error: 'Failed to load bibliography' });
  }
}

async function saveBibliography(req, res) {
  try {
    const { repository, notebookPath, bibliography } = req.body;
    if (!repository || !notebookPath || !bibliography) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const token = req.session?.githubToken;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repository.split('/');
    const notebookDir = notebookPath.substring(0, notebookPath.lastIndexOf('/'));
    const bibliographyPath = `${notebookDir}/bibliography.json`;

    // Convert bibliography to string
    const content = JSON.stringify(bibliography, null, 2);

    try {
      // Try to get existing file to get its SHA
      const { data: existingFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: bibliographyPath
      });

      // Update existing file
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: bibliographyPath,
        message: 'Update bibliography.json',
        content: Buffer.from(content).toString('base64'),
        sha: existingFile.sha
      });
    } catch (error) {
      if (error.status === 404) {
        // Create new file if it doesn't exist
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: bibliographyPath,
          message: 'Create bibliography.json',
          content: Buffer.from(content).toString('base64')
        });
      } else {
        throw error;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving bibliography:', error);
    res.status(500).json({ error: 'Failed to save bibliography' });
  }
}

router.get('/load', loadBibliography);
router.post('/save', saveBibliography);

export default router;
