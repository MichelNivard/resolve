import React from 'react';

const CodeRenderer = ({ code }) => {
  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
};

export default CodeRenderer;
