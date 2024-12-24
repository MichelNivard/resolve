// Utilities for handling .bib files with GitHub integration
import bibtexParse from 'bibtex-parser-js';

/**
 * Load a .bib file from GitHub repository
 * @param {string} token - GitHub access token
 * @param {string} selectedRepo - Repository in format "owner/repo"
 * @param {string} notebookPath - Path to the current notebook
 * @param {string} owner - Repository owner login
 * @returns {Promise<{content: string, path: string, sha: string} | null>}
 */
export async function loadBibFromGitHub(token, selectedRepo, notebookPath, owner) {
  console.log('🔍 Attempting to load .bib file from GitHub:', {
    repo: selectedRepo,
    notebook: notebookPath,
    owner
  });

  // Validate repository format
  const [repoOwner, repo] = selectedRepo.split('/');
  if (!repoOwner || !repo || repoOwner !== owner) {
    console.error('❌ Repository format mismatch:', {
      providedOwner: owner,
      repoOwner,
      repo
    });
    throw new Error('Repository owner mismatch');
  }

  const possiblePaths = [
    // Same directory as notebook
    `${notebookPath.substring(0, notebookPath.lastIndexOf('/'))}/references.bib`,
    // Root of repo
    'references.bib',
    // References directory
    'references/main.bib'
  ];

  console.log('🔍 Searching for .bib file in paths:', possiblePaths);

  // Try each path until we find the .bib file
  for (const bibPath of possiblePaths) {
    try {
      console.log(`📖 Checking path: ${bibPath}`);
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${bibPath}`,
        {
          headers: { 
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (response.ok) {
        console.log(`✅ Found .bib file at: ${bibPath}`);
        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        
        // Log the first 100 characters of content for debugging
        console.log('📄 First 100 chars of .bib content:', content.substring(0, 100));
        
        return { content, path: bibPath, sha: data.sha };
      } else {
        console.log(`❌ No .bib file at ${bibPath} (${response.status}: ${response.statusText})`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${bibPath}:`, error.message);
    }
  }
  
  console.log('❌ No .bib file found in any of the searched locations');
  return null;
}

/**
 * Save a .bib file to GitHub repository
 * @param {string} content - BibTeX content to save
 * @param {string} path - Path where to save the file
 * @param {string} sha - SHA of existing file (if updating)
 * @param {string} token - GitHub access token
 * @param {string} selectedRepo - Repository in format "owner/repo"
 * @param {string} owner - Repository owner login
 * @returns {Promise<Object>} GitHub API response
 */
export async function saveBibToGitHub(content, path, sha, token, selectedRepo, owner) {
  try {
    // Remove leading slash if present
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    const response = await fetch(
      `https://api.github.com/repos/${selectedRepo}/contents/${normalizedPath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: 'Update bibliography file',
          content: Buffer.from(content).toString('base64'),
          ...(sha && { sha })
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to save .bib file:', error);
      throw new Error(`Failed to save .bib file: ${error.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Successfully saved .bib file:', {
      path: result.content.path,
      sha: result.content.sha
    });

    return result;
  } catch (error) {
    console.error('❌ Error saving .bib file:', error);
    throw error;
  }
}

/**
 * Format a BibTeX entry as a string
 * @param {Object} entry - BibTeX entry object
 * @returns {string} Formatted BibTeX entry
 */
export function formatBibTeXEntry(entry) {
  console.log('📝 Formatting BibTeX entry:', {
    type: entry.entryType,
    key: entry.citationKey
  });

  const fields = Object.entries(entry.entryTags)
    .map(([key, value]) => `  ${key} = {${value}}`)
    .join(',\n');
    
  return `@${entry.entryType}{${entry.citationKey},\n${fields}\n}`;
}
