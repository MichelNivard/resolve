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
          
          // Helper function to create a property row
          const createPropertyRow = (key, value) => {
            const row = document.createElement('div');
            row.classList.add('property-row');
            
            const labelDiv = document.createElement('div');
            labelDiv.classList.add('property-label');
            // Capitalize first letter of key for label
            labelDiv.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            
            const valueDiv = document.createElement('div');
            valueDiv.classList.add('property-value');
            
            let input;
            // Use textarea for abstract or if value is longer than 100 characters
            if (key === 'abstract' || (value && value.length > 100)) {
              input = document.createElement('textarea');
              input.rows = '4';
              
              // Auto-expand textarea
              const adjustHeight = () => {
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
              };
              
              input.addEventListener('input', (e) => {
                e.stopPropagation();
                adjustHeight();
                const newYaml = { ...yaml };
                newYaml[key] = e.target.value;
                editor.commands.updateAttributes('rawCell', {
                  parsedYaml: newYaml
                });
              });
              
              // Initial height adjustment
              setTimeout(adjustHeight, 0);
            } else {
              input = document.createElement('input');
              input.type = 'text';
              input.addEventListener('input', (e) => {
                e.stopPropagation();
                const newYaml = { ...yaml };
                newYaml[key] = e.target.value;
                editor.commands.updateAttributes('rawCell', {
                  parsedYaml: newYaml
                });
              });
            }
            
            input.value = value || '';
            input.setAttribute('data-property', key);
            
            // Prevent backspace from deleting the node
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Backspace' && e.target.value === '') {
                e.stopPropagation();
                e.preventDefault();
              }
            });
            
            valueDiv.appendChild(input);
            row.appendChild(labelDiv);
            row.appendChild(valueDiv);
            return row;
          };
          
          // Add all YAML properties dynamically
          Object.entries(yaml).forEach(([key, value]) => {
            table.appendChild(createPropertyRow(key, value));
          });
          
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