import express from 'express';
import { Octokit } from '@octokit/rest';

const router = express.Router();

// Send invitation and generate share link
router.post('/invite', async (req, res) => {
  const { username, repository } = req.body;
  const token = req.session?.githubToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const octokit = new Octokit({ auth: token });
    const [owner, repo] = repository.split('/');
    
    // Send GitHub invitation
    await octokit.repos.addCollaborator({
      owner,
      repo,
      username,
      permission: 'write'
    });

    // Generate share link - using the frontend URL from env
    const frontendUrl = process.env.FRONTEND_URL || 'https://resolve.pub';
    const shareLink = `${frontendUrl}/document/${owner}/${repo}`;
    
    res.json({ 
      success: true, 
      shareLink,
      message: `Invitation sent to ${username}`
    });
  } catch (error) {
    console.error('Failed to send invitation:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation',
      details: error.message 
    });
  }
});

// Get pending invitations
router.get('/invitations', async (req, res) => {
  const token = req.session?.githubToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data: invitations } = await octokit.repos.listInvitationsForAuthenticatedUser();
    
    res.json(invitations);
  } catch (error) {
    console.error('Failed to fetch invitations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invitations',
      details: error.message 
    });
  }
});

// Accept invitation
router.post('/accept-invite', async (req, res) => {
  const { invitationId } = req.body;
  const token = req.session?.githubToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const octokit = new Octokit({ auth: token });
    await octokit.repos.acceptInvitation({ invitation_id: invitationId });
    
    res.json({ 
      success: true, 
      message: 'Invitation accepted' 
    });
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    res.status(500).json({ 
      error: 'Failed to accept invitation',
      details: error.message 
    });
  }
});

export default router;
