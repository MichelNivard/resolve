import { getCurrentTime, get30MinutesAgo } from './timeUtils';

export async function saveToGitHub(newIpynb, filePath, token, selectedRepo, user) {
    if (!selectedRepo) {
      throw new Error('No repository selected');
    }

    // Initialize metadata if needed
    if (!newIpynb.metadata) {
      newIpynb.metadata = {};
    }
    if (!newIpynb.metadata.active_editors) {
      newIpynb.metadata.active_editors = [];
    }

    const thirtyMinutesAgo = get30MinutesAgo();
    
    // Remove editors that are older than 30 minutes
    newIpynb.metadata.active_editors = newIpynb.metadata.active_editors.filter(editor => 
      editor.timestamp > thirtyMinutesAgo
    );

    // Check if this user is already in the list
    const existingEditorIndex = newIpynb.metadata.active_editors.findIndex(
      editor => editor.name === (user.name || user.login)
    );

    const newEditor = {
      name: user.name || user.login,
      avatar_url: user.avatar_url,
      timestamp: getCurrentTime()
    };

    if (existingEditorIndex === -1) {
      // Add new editor to the list
      newIpynb.metadata.active_editors.push(newEditor);
    } else {
      // Update timestamp for existing editor
      newIpynb.metadata.active_editors[existingEditorIndex].timestamp = getCurrentTime();
    }

    const contentStr = JSON.stringify(newIpynb, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(contentStr)));
    
    // Handle both string format "owner/repo" and object format {fullName: "owner/repo"}
    let owner, repo;
    if (typeof selectedRepo === 'string') {
      [owner, repo] = selectedRepo.split('/');
    } else if (selectedRepo.fullName) {
      [owner, repo] = selectedRepo.fullName.split('/');
    }
    
    if (!owner || !repo) {
      throw new Error('Invalid repository format. Expected "owner/repo" or object with fullName property');
    }

    // Get file SHA if file exists
    let sha;
    try {
      const fileResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: {
          Authorization: `token ${token}`
        }
      });
      
      if (fileResp.status === 404) {
        // File doesn't exist yet, which is fine
        console.log('File does not exist yet, will create new file');
      } else {
        const fileData = await fileResp.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
      // Continue without SHA if we couldn't get it
    }
  
    // Create or update file
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`
      },
      body: JSON.stringify({
        message: sha ? 'Update notebook' : 'Create notebook',
        content: base64Content,
        ...(sha && { sha }) // Only include sha if we have it
      })
    });

    const result = await resp.json();

    if (!resp.ok) {
      console.error('GitHub API error:', result);
      throw new Error(`Error ${sha ? 'updating' : 'creating'} file: ${result.message}`);
    }

    return result;
}
