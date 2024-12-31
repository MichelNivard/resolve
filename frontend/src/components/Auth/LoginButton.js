import React from 'react';
import { FaGithub } from 'react-icons/fa';

const LoginButton = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/api/auth';
  };

  return (
    <button onClick={handleLogin} className="login-button">
      <FaGithub />
      Continue with GitHub
    </button>
  );
};

export default LoginButton;
