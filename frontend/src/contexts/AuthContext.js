import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { fetchUser, checkAuth } from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.resolve.pub';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // First check if we're authenticated
        const isAuthed = await checkAuth(`${API_BASE_URL}/api/auth/check`);
        setIsAuthenticated(isAuthed);

        if (isAuthed) {
          // If authenticated, fetch user data
          const userData = await fetchUser(`${API_BASE_URL}/api/auth/user`);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setIsAuthenticated(false);
        setUser(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error during logout:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      isAuthenticated,
      setIsAuthenticated,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
