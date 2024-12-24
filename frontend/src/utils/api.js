import axios from 'axios';

export const getTokenFromBackend = async () => {
  try {
    const res = await axios.get('http://localhost:3001/api/getToken', { withCredentials: true });
    return res.data.token;
  } catch (err) {
    console.error(err);
    return null;
  }
};



export const fetchNotebook = async (path, token, repository) => {
  try {
    console.log('Fetching notebook:', { path, repository });
    const url = new URL('http://localhost:3001/api/fetchFile');
    url.searchParams.append('path', path);
    if (repository) {
      url.searchParams.append('repository', repository);
    }
    
    const response = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });

    return response.data.ipynb;
  } catch (error) {
    console.error('Error fetching notebook:', error);
    throw error;
  }
}; 


// New Function to Fetch the User
export const fetchUser = async () => {
  try {
    const res = await axios.get('http://localhost:3001/api/user', { 
      withCredentials: true 
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
};

export const fetchRepositories = async (token) => {
  try {
    const res = await axios.get('http://localhost:3001/api/repositories', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Ensure repositories have the required format
    const repositories = res.data.repositories || [];
    return repositories.map(repo => {
      // Handle both snake_case and camelCase formats
      const fullName = repo.full_name || repo.fullName || '';
      const [ownerLogin, repoName] = fullName.split('/');
      
      return {
        id: repo.id,
        fullName,
        name: repoName || '',
        owner: {
          login: repo.owner?.login || ownerLogin || ''
        }
      };
    }).filter(repo => repo.fullName && repo.owner.login); // Only return valid repos
  } catch (err) {
    console.error('Error fetching repositories:', err);
    return [];
  }
};

export const fetchNotebooksInRepo = async (token, repository) => {
  try {
    const [owner, repo] = repository.split('/');
    
    // First, get the default branch
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoResponse.ok) {
      console.error('Failed to fetch repository info:', await repoResponse.text());
      return [];
    }

    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;

    // Then get the tree using the default branch
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!treeResponse.ok) {
      console.error('Failed to fetch tree:', await treeResponse.text());
      return [];
    }

    const data = await treeResponse.json();
    const notebooks = data.tree
      .filter(item => item.type === 'blob' && item.path.endsWith('.ipynb'))
      .map(item => item.path);

    console.log('Found notebooks:', notebooks);
    return notebooks;
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    return [];
  }
};