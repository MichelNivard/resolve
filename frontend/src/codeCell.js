import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export const CodeCell = Node.create({
  name: 'codeCell',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      source: { 
        default: '',
        parseHTML: element => element.getAttribute('data-source') || '',
        renderHTML: attributes => {
          return { 'data-source': attributes.source }
        }
      },
      outputs: { default: [] },
      executionCount: { default: null },
      metadata: { 
        default: {
          collapsed: true,
          scrolled: false
        }
      },
      folded: { default: true }, // UI state, not part of nbformat
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="code-cell"]' }];
  },

  renderHTML() {
    return ['div', { 'data-type': 'code-cell' }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeCellNodeView);
  },
});

function CodeCellNodeView({ node, editor, getPos }) {
  const { source, outputs, folded, metadata } = node.attrs;
  const [showCode, setShowCode] = useState(!folded);

  const toggleCode = () => {
    setShowCode((prev) => !prev);
    const pos = getPos();
    if (typeof pos === 'number') {
      // Update both folded UI state and metadata.collapsed
      editor.chain()
        .setTextSelection(pos)
        .updateAttributes('codeCell', { 
          folded: !showCode,
          metadata: { ...metadata, collapsed: !showCode }
        })
        .run();
    }
  };

  return (
    <NodeViewWrapper as="div" data-type="code-cell" className="code-cell">
      <button
        onClick={toggleCode}
        className="code-cell-toggle"
        title={showCode ? 'Hide Code' : 'Show Code'}
      >
        <FontAwesomeIcon icon={showCode ? faChevronUp : faChevronDown} />
        <span className="code-cell-toggle-text">{showCode ? 'Hide Code' : 'Show Code'}</span>
      </button>

      {showCode && (
        <pre className="code-cell-content">
          <code>{typeof source === 'string' ? source : Array.isArray(source) ? source.join('') : ''}</code>
        </pre>
      )}

      {outputs && outputs.map((out, i) => renderOutput(out, i))}
    </NodeViewWrapper>
  );
}

function renderOutput(output, index) {
  if (output.data) {
    if (output.data['image/png']) {
      const base64Data = output.data['image/png'];
      return (
        <div key={index} className="code-cell-output-image">
          <img src={`data:image/png;base64,${base64Data}`} alt="output" />
        </div>
      );
    } else if (output.data['text/plain']) {
      return (
        <pre key={index} className="code-cell-output-text">
          {output.data['text/plain'].join('')}
        </pre>
      );
    }
  }

  return (
    <pre key={index} className="code-cell-output-text">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
