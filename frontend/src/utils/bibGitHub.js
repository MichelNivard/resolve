// Utilities for handling .bib files with GitHub integration
import axios from 'axios';
import bibtexParse from 'bibtex-parser-js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.resolve.pub';

/**
 * Load a .bib file from GitHub repository
 * @param {string} selectedRepo - Repository in format "owner/repo"
 * @param {string} notebookPath - Path to the current notebook
 * @param {string} owner - Repository owner login
 * @returns {Promise<{content: string, path: string, sha: string} | null>}
 */
export async function loadBibFromGitHub(selectedRepo, notebookPath, owner) {
  console.log('🔍 Attempting to load .bib file from GitHub:', {
    repo: selectedRepo,
    notebook: notebookPath,
    owner
  });

  try {
    const response = await axios.get(`${API_BASE_URL}/bibliography/load`, {
      params: {
        repository: selectedRepo,
        notebookPath
      }
    });
    
    console.log('✅ Successfully loaded .bib file');
    return response.data;
  } catch (error) {
    console.error('❌ Error loading .bib file:', error);
    return null;
  }
}

/**
 * Save a .bib file to GitHub repository
 * @param {string} content - BibTeX content to save
 * @param {string} path - Path where to save the file
 * @param {string} sha - SHA of existing file (if updating)
 * @param {string} selectedRepo - Repository in format "owner/repo"
 * @returns {Promise<Object>} GitHub API response
 */
export async function saveBibToGitHub(content, path, sha, selectedRepo) {
  try {
    const response = await axios.post(`${API_BASE_URL}/bibliography/save`, {
      content,
      path,
      repository: selectedRepo,
      ...(sha && { sha })
    });

    console.log('✅ Successfully saved .bib file:', {
      path: response.data.content.path,
      sha: response.data.content.sha
    });

    return response.data;
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
