import React, { createContext, useState, useEffect, useContext } from 'react';
import { getTokenFromBackend, fetchUser } from '../utils/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getTokenFromBackend().then((tk) => {
      if (tk) setToken(tk);
    });
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser()
        .then(userData => {
          if (userData) {
            setUser(userData);
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
        });
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
