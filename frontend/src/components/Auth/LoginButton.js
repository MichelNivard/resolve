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
    <><p>
    Resolve is your seamless solution for collaborating on Quarto and Jupyter (`.ipynb`) documents. To get started, please sign in with your GitHub account.
  </p>
  <p>Don't have any .ipynb files to test Resolve? Go to GitHub and fork: https://github.com/MichelNivard/writing-together</p>
  <p>
    Don't have a GitHub account yet?{' '}
    <a href="https://github.com/join" style={{ fontWeight: 'bold' }}>
      Register here
    </a>{' '}
    and join our community!
  </p><button onClick={handleLogin} className="login-button">
      <FaGithub />
      Continue with GitHub
    </button></>
  );
};

export default LoginButton;