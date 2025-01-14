import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import React, { useState } from 'react';

// Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export const CodeCell = Node.create({
  name: 'codeCell',
  group: 'block', // Ensure it belongs to the block group
  atom: true, // Makes it a single, indivisible unit
  isolating: true, // Prevents merging with other nodes

  addAttributes() {
    return {
      source: { 
        default: [],
        parseHTML: element => {
          const source = element.getAttribute('data-source');
          return source ? source.split('\n').map(line => line + '\n') : [];
        },
        renderHTML: attributes => {
          const source = Array.isArray(attributes.source) ? attributes.source.join('') : attributes.source;
          return { 'data-source': source };
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
    return ['div', { 'data-type': 'code-cell', contenteditable: false }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeCellNodeView);
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
  
        console.log('Backspace triggered');
        console.log('Cursor position:', $from.pos);
  
        // Directly calculate the previous position
        const posBefore = $from.pos - 1;
        const prevNode = posBefore >= 0 ? state.doc.nodeAt(posBefore) : null;
  
        console.log('Position before cursor:', posBefore);
        console.log('Previous node:', prevNode);
  
        // Check if the previous node is a codeCell
        if (prevNode?.type.name === 'codeCell') {
          console.log('Backspace blocked: Adjacent to a codeCell');
          editor.commands.setTextSelection(posBefore); // Move the cursor to the codeCell
          return true; // Block Backspace
        }
  
        console.log('Backspace allowed: Default behavior');
        return false;
      },
  
      Delete: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
  
        console.log('Delete triggered');
        console.log('Cursor position:', $from.pos);
  
        // Directly calculate the next position
        const posAfter = $from.pos + 1;
        const nextNode = posAfter < state.doc.content.size ? state.doc.nodeAt(posAfter) : null;
  
        console.log('Position after cursor:', posAfter);
        console.log('Next node:', nextNode);
  
        // Check if the next node is a codeCell
        if (nextNode?.type.name === 'codeCell') {
          console.log('Delete blocked: Adjacent to a codeCell');
          editor.commands.setTextSelection(posAfter + 1); // Move the cursor to the codeCell
          return true; // Block Delete
        }
  
        console.log('Delete allowed: Default behavior');
        return false;
      },
    };
  }
  
  
  
  
  
  
  
  
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
          <code>{Array.isArray(source) ? source.join('') : source}</code>
        </pre>
      )}

      {outputs && outputs.map((out, i) => renderOutput(out, i))}
    </NodeViewWrapper>
  );
}

function renderOutput(output, index) {
  // Handle stream output (like stdout)
  if (output.output_type === 'stream') {
    return (
      <pre key={index} className="code-cell-output-stream">
        <code>{Array.isArray(output.text) ? output.text.join('') : output.text}</code>
      </pre>
    );
  }

  // Handle data output
  if (output.data) {
    // Handle HTML output
    if (output.data['text/html']) {
      const htmlContent = Array.isArray(output.data['text/html']) 
        ? output.data['text/html'].join('') 
        : output.data['text/html'];
      return (
        <div 
          key={index} 
          className="code-cell-output-html"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }
    
    // Handle PNG images
    if (output.data['image/png']) {
      const base64Data = output.data['image/png'];
      return (
        <div key={index} className="code-cell-output-image">
          <img src={`data:image/png;base64,${base64Data}`} alt="output" />
        </div>
      );
    }
    
    // Handle plain text
    if (output.data['text/plain']) {
      return (
        <pre key={index} className="code-cell-output-text">
          <code>
            {Array.isArray(output.data['text/plain']) 
              ? output.data['text/plain'].join('') 
              : output.data['text/plain']}
          </code>
        </pre>
      );
    }
  }

  // For any other output type, show the raw JSON for debugging
  return (
    <pre key={index} className="code-cell-output-json">
      <code>{JSON.stringify(output, null, 2)}</code>
    </pre>
  );
}
