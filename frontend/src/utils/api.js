import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.resolve.pub';

// Configure axios defaults
axios.defaults.withCredentials = true;

// Create an axios instance with specific config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Explicitly set credentials mode
  xhrFields: {
    withCredentials: true
  }
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    return Promise.reject(error);
  }
);

export const checkAuth = async () => {
  try {
    console.log('Checking auth with URL:', `${API_BASE_URL}/api/auth/check`);
    const res = await api.get('/api/auth/check');
    console.log('Auth check response:', res.data);
    return res.data.authenticated;
  } catch (err) {
    console.error('Error checking auth:', err);
    return false;
  }
};

export const fetchNotebook = async (path, repository) => {
  try {
    console.log('Fetching notebook:', { path, repository });
    const response = await api.get('/api/fetchFile', {
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
    const res = await api.get('/api/user');
    return res.data;
  } catch (err) {
    console.error('Error fetching user:', err);
    return null;
  }
};

export const fetchRepositories = async () => {
  try {
    const res = await api.get('/api/repositories');
    return res.data.repositories || [];
  } catch (err) {
    console.error('Error fetching repositories:', err);
    return [];
  }
};

export const fetchNotebooksInRepo = async (repository) => {
  try {
    const response = await api.get('/api/listNotebooks', {
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
    const response = await api.post('/api/saveFile', {
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