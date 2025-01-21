import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/document/:owner/:repo/*" element={<App />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
