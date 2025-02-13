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

    console.log('Saving file with session token');

    const octokit = new Octokit({ auth: token });

    // Get default branch
    const { data: repo_data } = await octokit.repos.get({
      owner,
      repo
    });
    const defaultBranch = repo_data.default_branch;

    // Get the latest commit SHA from the default branch
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    const newBranchName = `update-${sanitizedPath.replace(/\//g, '-')}-${Date.now()}`;
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranchName}`,
      sha: baseSha
    });

    // Get the current file's SHA if it exists
    let sha;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: sanitizedPath,
        ref: newBranchName
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

    // Create or update file in the new branch
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: sanitizedPath,
      message: 'Update content',
      content: Buffer.from(fileContent).toString('base64'),
      branch: newBranchName,
      ...(sha && { sha }) // Include SHA if we have it
    });

    // Create a pull request
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `Update ${sanitizedPath}`,
      head: newBranchName,
      base: defaultBranch,
      body: 'Automated update of content'
    });

    // If there are no conflicts, merge immediately
    const { data: prCheck } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pr.number
    });

    if (prCheck.mergeable && !prCheck.merged) {
      await octokit.pulls.merge({
        owner,
        repo,
        pull_number: pr.number,
        merge_method: 'squash'
      });
    }

    res.json({ 
      success: true, 
      data: {
        pr_url: pr.html_url,
        branch: newBranchName,
        status: prCheck.mergeable ? 'merged' : 'pending_review'
      }
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
