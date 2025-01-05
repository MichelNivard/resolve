import React from 'react';
import { FaGithub } from 'react-icons/fa';

const LoginButton = () => {
  const handleLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return;
    }
    const loginUrl = `${apiUrl}/api/auth`;
    console.log('Redirecting to:', loginUrl);
    window.location.href = loginUrl;
  };

  return (
    <button onClick={handleLogin} className="login-button">
      <FaGithub />
      Continue with GitHub
    </button>
  );
};

export default LoginButton;