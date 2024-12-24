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
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notebooks');
    }

    const data = await response.json();
    return data.tree
      .filter(item => item.type === 'blob' && item.path.endsWith('.ipynb'))
      .map(item => item.path);
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    return [];
  }
};