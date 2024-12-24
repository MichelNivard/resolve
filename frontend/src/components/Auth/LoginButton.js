import React from 'react';

const LoginButton = () => {
  const handleLogin = () => {
    // Redirect user to backend auth endpoint that starts GitHub OAuth
    window.location.href = 'http://localhost:3001/api/auth'; 
  };

  return (
    <button onClick={handleLogin}>Login with GitHub</button>
  );
};

export default LoginButton;
