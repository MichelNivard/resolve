import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.resolve.pub';

// Configure axios defaults
axios.defaults.withCredentials = true;

export const checkAuth = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/auth/check`);
    return res.data.authenticated;
  } catch (err) {
    console.error('Error checking auth:', err);
    return false;
  }
};

export const fetchNotebook = async (path, repository) => {
  try {
    console.log('Fetching notebook:', { path, repository });
    const response = await axios.get(`${API_BASE_URL}/fetchFile`, {
      params: { path, repository }
    });
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
    return res.data.repositories || [];
  } catch (err) {
    console.error('Error fetching repositories:', err);
    return [];
  }
};

export const fetchNotebooksInRepo = async (repository) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/listNotebooks`, {
      params: { repository },
      withCredentials: true
    });
    return response.data.notebooks;
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    throw error;
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