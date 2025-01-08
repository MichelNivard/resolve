import { Node } from '@tiptap/core'
import yaml from 'js-yaml'
import '../styles/components/editor/_raw-cell.css'
import '../styles/components/editor/_yaml-table-editor.css'

function tryParseYaml(content) {
  try {
    if (content.trim().startsWith('---') && content.trim().endsWith('---')) {
      // Extract YAML content between fences, preserving internal whitespace
      const yamlContent = content.replace(/^---\n/, '').replace(/\n?---$/, '');
      const parsedYaml = yaml.load(yamlContent);
      
      if (parsedYaml) {
        // Format the YAML but don't include it in the parsed object
        const formattedYaml = yaml.dump(parsedYaml, {
          lineWidth: -1,
          noRefs: true,
          indent: 2,
          flowLevel: -1
        }).trim(); // Trim any trailing whitespace from the formatted YAML
        return {
          parsed: parsedYaml,
          formatted: formattedYaml
        };
      }
      return { parsed: parsedYaml || {}, formatted: yamlContent.trim() };
    }
  } catch (e) {
    console.error('Failed to parse YAML:', e);
  }
  return null;
}

export const RawCell = Node.create({
    name: 'rawCell',
    group: 'block',
    atom: false,
    selectable: true,
    draggable: false,

    addAttributes() {
      return {
        content: {
          default: ''
        },
        isYamlHeader: {
          default: false
        },
        parsedYaml: {
          default: null
        },
        formattedYaml: {
          default: null
        },
        isAcademicArticle: {
          default: false
        }
      }
    },

    parseHTML() {
      return [{
        tag: 'div[data-type="raw-cell"]',
        getAttrs: dom => ({
          content: dom.textContent,
          isYamlHeader: dom.getAttribute('data-yaml-header') === 'true',
          isAcademicArticle: dom.getAttribute('data-academic') === 'true'
        })
      }]
    }, 
 // hello?
    renderHTML({ node }) {
      const yaml = node.attrs.parsedYaml || {};
      const isYamlHeader = node.attrs.isYamlHeader;
      const isAcademicArticle = node.attrs.isAcademicArticle;

      if (isYamlHeader && isAcademicArticle) {
        return ['div', { 
          'data-type': 'raw-cell',
          'data-yaml-header': 'true',
          'data-academic': 'true',
          class: 'raw-cell academic-frontpage'
        }];
      }

      return ['div', { 
        'data-type': 'raw-cell',
        class: 'raw-cell'
      }];
    },

    addNodeView() {
      return ({ node, getPos, editor }) => {
        console.log('RawCell nodeView rendering with node:', node);
        const dom = document.createElement('div');
        dom.setAttribute('data-type', 'raw-cell');
        dom.classList.add('raw-cell');
        
        if (node.attrs.isYamlHeader && node.attrs.isAcademicArticle) {
          console.log('Rendering academic frontpage');
          dom.classList.add('academic-frontpage');
          const yaml = node.attrs.parsedYaml || {};
          
          const table = document.createElement('div');
          table.classList.add('properties-table');
          
          // Primary fields that should always be at the top
          const primaryFields = ['title', 'subtitle', 'author', 'authors', 'affiliations', 'date', 'abstract'];
          
          // Create primary fields section
          const primarySection = document.createElement('div');
          primarySection.classList.add('primary-fields');
          
          // Create additional fields section
          const additionalSection = document.createElement('div');
          additionalSection.classList.add('additional-fields');
          
          // Helper function to create a property row
          const createPropertyRow = (key, value, level = 0) => {
            const row = document.createElement('div');
            row.classList.add('property-row');
            row.setAttribute('data-property', key);
            row.setAttribute('data-level', level);

            const labelDiv = document.createElement('div');
            labelDiv.classList.add('property-label');
            labelDiv.textContent = key.charAt(0).toUpperCase() + key.slice(1);

            const valueDiv = document.createElement('div');
            valueDiv.classList.add('property-value');

            if (key === 'author' || key === 'authors') {
              // Handle author(s) specially
              if (Array.isArray(value)) {
                // Multiple authors
                const authorNames = value.map(author => author.name || '').join(', ');
                const authorInput = document.createElement('input');
                authorInput.type = 'text';
                authorInput.value = authorNames;
                authorInput.setAttribute('data-property', key);
                setupInputHandling(authorInput);
                valueDiv.appendChild(authorInput);

                // Create expandable details
                const detailsToggle = document.createElement('span');
                detailsToggle.classList.add('author-details-toggle');
                detailsToggle.textContent = '▼ Show Details';
                valueDiv.appendChild(detailsToggle);

                const detailsDiv = document.createElement('div');
                detailsDiv.classList.add('author-details', 'nested-fields');

                value.forEach((author, index) => {
                  if (typeof author === 'object') {
                    Object.entries(author).forEach(([subKey, subValue]) => {
                      if (subKey !== 'name') {
                        detailsDiv.appendChild(createPropertyRow(subKey, subValue, level + 1));
                      }
                    });
                  }
                });

                valueDiv.appendChild(detailsDiv);

                detailsToggle.addEventListener('click', () => {
                  detailsDiv.classList.toggle('expanded');
                  detailsToggle.textContent = detailsDiv.classList.contains('expanded') 
                    ? '▲ Hide Details' 
                    : '▼ Show Details';
                });
              } else if (typeof value === 'object') {
                // Single author
                const authorInput = document.createElement('input');
                authorInput.type = 'text';
                authorInput.value = value.name || '';
                authorInput.setAttribute('data-property', key);
                setupInputHandling(authorInput);
                valueDiv.appendChild(authorInput);

                // Create expandable details
                const detailsToggle = document.createElement('span');
                detailsToggle.classList.add('author-details-toggle');
                detailsToggle.textContent = '▼ Show Details';
                valueDiv.appendChild(detailsToggle);

                const detailsDiv = document.createElement('div');
                detailsDiv.classList.add('author-details', 'nested-fields');

                Object.entries(value).forEach(([subKey, subValue]) => {
                  if (subKey !== 'name') {
                    detailsDiv.appendChild(createPropertyRow(subKey, subValue, level + 1));
                  }
                });

                valueDiv.appendChild(detailsDiv);

                detailsToggle.addEventListener('click', () => {
                  detailsDiv.classList.toggle('expanded');
                  detailsToggle.textContent = detailsDiv.classList.contains('expanded') 
                    ? '▲ Hide Details' 
                    : '▼ Show Details';
                });
              }
            } else if (typeof value === 'object' && value !== null) {
              // Handle other nested objects
              const nestedContainer = document.createElement('div');
              nestedContainer.classList.add('nested-fields');

              if (Array.isArray(value)) {
                value.forEach((item, index) => {
                  if (typeof item === 'object') {
                    Object.entries(item).forEach(([subKey, subValue]) => {
                      nestedContainer.appendChild(createPropertyRow(subKey, subValue, level + 1));
                    });
                  } else {
                    const arrayRow = createPropertyRow(`${index + 1}`, item, level + 1);
                    nestedContainer.appendChild(arrayRow);
                  }
                });
              } else {
                Object.entries(value).forEach(([subKey, subValue]) => {
                  nestedContainer.appendChild(createPropertyRow(subKey, subValue, level + 1));
                });
              }

              valueDiv.appendChild(nestedContainer);
            } else {
              // Handle primitive values
              let input;
              if (key === 'abstract' || (value && value.length > 100)) {
                input = document.createElement('textarea');
                input.rows = '4';
                input.spellcheck = true;
              } else {
                input = document.createElement('input');
                input.type = 'text';
                input.spellcheck = false;
              }

              setupInputHandling(input);
              input.value = value || '';
              input.setAttribute('data-property', key);
              valueDiv.appendChild(input);
            }

            row.appendChild(labelDiv);
            row.appendChild(valueDiv);
            return row;
          };
          
          // Sort fields into primary and additional
          Object.entries(yaml).forEach(([key, value]) => {
            if (primaryFields.includes(key.toLowerCase())) {
              primarySection.appendChild(createPropertyRow(key, value));
            } else {
              additionalSection.appendChild(createPropertyRow(key, value));
            }
          });
          
          // Create additional fields header with dropdown
          const additionalHeader = document.createElement('div');
          additionalHeader.classList.add('additional-fields-header');
          additionalHeader.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Additional Fields
          `;
          
          const additionalContent = document.createElement('div');
          additionalContent.classList.add('additional-fields-content');
          
          // Add click handler for dropdown
          additionalHeader.addEventListener('click', () => {
            additionalHeader.classList.toggle('expanded');
            additionalContent.classList.toggle('expanded');
          });
          
          // Only add additional section if there are additional fields
          if (additionalSection.children.length > 0) {
            additionalContent.appendChild(additionalSection);
            table.appendChild(primarySection);
            table.appendChild(additionalHeader);
            table.appendChild(additionalContent);
          } else {
            table.appendChild(primarySection);
          }
          
          dom.appendChild(table);
        } else {
          const content = document.createElement('div');
          content.classList.add('raw-content');
          content.textContent = node.attrs.content || '';
          content.contentEditable = 'true';
          dom.appendChild(content);
        }

        return {
          dom,
          update: (updatedNode) => {
            if (updatedNode.type.name !== node.type.name) return false;
            return true;
          },
          destroy: () => {
            // Cleanup if needed
          }
        };
      };
    }
});

// Common input event handling setup
const setupInputHandling = (input) => {
  // Prevent deletion of the field itself
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      // If at start of field or field is empty, prevent deletion
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    // Prevent deletion via Cut or Delete
    if (e.key === 'Delete' || (e.key === 'x' && (e.ctrlKey || e.metaKey))) {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });

  // Handle click events to maintain focus
  input.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  
  input.addEventListener('click', (e) => {
    e.stopPropagation();
    input.focus();
  });
  
  // Make the input non-draggable
  input.draggable = false;

  // Add input event handler
  input.addEventListener('input', (e) => {
    const newYaml = { ...yaml };
    
    // Handle nested properties
    const path = e.target.getAttribute('data-property').split('.');
    let current = newYaml;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = e.target.value;

    // For textareas, adjust height
    if (e.target.tagName.toLowerCase() === 'textarea') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
    
    // Format the YAML
    const formattedYaml = Object.entries(newYaml)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`)
      .join('\n');
    
    const yamlContent = `---\n${formattedYaml}\n---`;
    
    // Get the current position
    const pos = getPos();
    
    // Create a transaction to update the node
    const tr = editor.state.tr;
    
    // Update the node's attributes and content
    if (typeof pos === 'number') {
      console.log('Updating YAML at position:', pos, 'with content:', yamlContent);
      tr.setNodeMarkup(pos, undefined, {
        content: yamlContent,
        parsedYaml: newYaml,
        formattedYaml: formattedYaml,
        isYamlHeader: true,
        isAcademicArticle: true
      });
      
      // Dispatch the transaction
      editor.view.dispatch(tr);
      console.log('Transaction dispatched');
    }
  });
};