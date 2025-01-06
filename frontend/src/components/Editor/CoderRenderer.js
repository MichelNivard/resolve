import React from 'react';

const CodeRenderer = ({ code }) => {
  const codeContent = Array.isArray(code) ? code.join('') : code;
  
  return (
    <pre>
      <code>{codeContent}</code>
    </pre>
  );
};

export default CodeRenderer;
