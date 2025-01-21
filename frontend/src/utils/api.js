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
    
    console.log('Raw response:', response.data);
    
    // Extract ipynb from response
    const ipynb = response.data.ipynb;
    if (!ipynb) {
      throw new Error('No notebook data in response');
    }
    
    console.log('Notebook data:', ipynb);
    return ipynb;
  } catch (error) {
    console.error('Error fetching notebook:', error);
    console.error('Full error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
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
    const response = await api.post('/api/saveFile', { content, path, repository });
    return response.data;
  } catch (error) {
    console.error('Failed to save notebook:', error);
    throw error;
  }
};

// Collaboration API functions
export const sendCollaborationInvite = async (username, repository) => {
  try {
    const response = await api.post('/api/collaboration/invite', {
      username,
      repository
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send invitation:', error);
    throw error;
  }
};

export const getPendingInvitations = async () => {
  try {
    const response = await api.get('/api/collaboration/invitations');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch invitations:', error);
    throw error;
  }
};

export const acceptInvitation = async (invitationId) => {
  try {
    const response = await api.post('/api/collaboration/accept-invite', {
      invitationId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    throw error;
  }
};

export const handleSharedDocument = async (owner, repo, path) => {
  try {
    // Check for pending invitations
    const invitations = await getPendingInvitations();
    const invitation = invitations.find(inv => 
      inv.repository.full_name === `${owner}/${repo}`
    );
    
    if (invitation) {
      // Return invitation info for UI handling
      return {
        hasInvitation: true,
        invitation,
        accept: async () => {
          await acceptInvitation(invitation.id);
          return await fetchNotebook(path, `${owner}/${repo}`);
        }
      };
    }
    
    // No invitation, just try to load the document
    return {
      hasInvitation: false,
      document: await fetchNotebook(path, `${owner}/${repo}`)
    };
  } catch (error) {
    console.error('Failed to handle shared document:', error);
    throw error;
  }
};