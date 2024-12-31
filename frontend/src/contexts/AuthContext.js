import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { fetchUser } from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

  useEffect(() => {
    // Check authentication status by attempting to fetch user data
    fetchUser()
      .then(userData => {
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
        setIsAuthenticated(false);
      });
  }, []);

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

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
