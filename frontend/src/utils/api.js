import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

export const getTokenFromBackend = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/getToken`);
    return res.data.token;
  } catch (err) {
    console.error('Error getting token:', err);
    return null;
  }
};

export const fetchNotebook = async (path, repository) => {
  try {
    console.log('Fetching notebook:', { path, repository });
    const url = new URL(`${API_BASE_URL}/fetchFile`);
    url.searchParams.append('path', path);
    if (repository) {
      url.searchParams.append('repository', repository);
    }
    
    const response = await axios.get(url.toString());
    return response.data.ipynb;
  } catch (error) {
    console.error('Error fetching notebook:', error);
    throw error;
  }
}; 

export const fetchUser = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/user`);
    return res.data;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
};

export const fetchRepositories = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/repositories`);
    
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
    }).filter(repo => repo.fullName && repo.owner.login);
  } catch (err) {
    console.error('Error fetching repositories:', err);
    return [];
  }
};

export const fetchNotebooksInRepo = async (repository) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/listNotebooks`, {
      params: { repository },
      withCredentials: true  // Ensure cookies are sent
    });
    return response.data.notebooks;
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    throw error; // Let the component handle the error
  }
};

export const saveNotebook = async (content, path, repository) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/saveFile`, {
      content,
      path,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Error saving notebook:', error);
    throw error;
  }
};