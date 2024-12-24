import React from 'react';

const OutputRenderer = ({ outputs }) => {
  return (
    <div className="outputs">
      {outputs && outputs.map((out, i) => (
        <pre key={i}>{JSON.stringify(out, null, 2)}</pre>
      ))}
    </div>
  );
};

export default OutputRenderer;
