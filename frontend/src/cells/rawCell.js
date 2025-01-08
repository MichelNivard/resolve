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

// Define valid YAML properties and their options
const YAML_PROPERTIES = {
  title: { type: 'text', label: 'Title', required: true },
  subtitle: { type: 'text', label: 'Subtitle' },
  author: { type: 'text', label: 'Author', required: true },
  date: { type: 'text', label: 'Date', required: true },
  abstract: { type: 'textarea', label: 'Abstract' },
  format: { 
    type: 'select', 
    label: 'Format',
    options: ['html', 'pdf', 'docx'] 
  },
  bibliography: { type: 'text', label: 'Bibliography' },
  jupyter: { type: 'text', label: 'Jupyter' }
};

export const RawCell = Node.create({
    name: 'rawCell',
    group: 'block',
    atom: true,
    editable: true,
    selectable: true,

    constructor() {
      console.log('RawCell extension created');
    },

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
      console.log('RawCell renderHTML called with node:', node);
      console.log('Node attributes:', node.attrs);
      
      const yaml = node.attrs.parsedYaml || {};
      const isYamlHeader = node.attrs.isYamlHeader;
      const isAcademicArticle = node.attrs.isAcademicArticle;

      console.log('YAML content:', yaml);
      console.log('isYamlHeader:', isYamlHeader);
      console.log('isAcademicArticle:', isAcademicArticle);

      if (isYamlHeader && isAcademicArticle) {
        return ['div', { 
          'data-type': 'raw-cell', 
          'data-yaml-header': 'true',
          'data-academic': 'true',
          class: 'raw-cell academic-frontpage'
        },
          ['div', { class: 'frontpage-content', contenteditable: 'true' },
            ['div', { class: 'title-section' },
              ['input', {
                class: 'title-input',
                type: 'text',
                value: yaml.title || '',
                placeholder: 'Title',
                'data-property': 'title'
              }],
              ['input', {
                class: 'subtitle-input',
                type: 'text',
                value: yaml.subtitle || '',
                placeholder: 'Subtitle',
                'data-property': 'subtitle'
              }]
            ],
            ['div', { class: 'author-section' },
              ['input', {
                class: 'author-input',
                type: 'text',
                value: yaml.author || '',
                placeholder: 'Author',
                'data-property': 'author'
              }],
              ['input', {
                class: 'date-input',
                type: 'text',
                value: yaml.date || '',
                placeholder: 'Date',
                'data-property': 'date'
              }]
            ],
            ['div', { class: 'abstract-section' },
              ['div', { class: 'abstract-label' }, 'Abstract'],
              ['textarea', {
                class: 'abstract-input',
                rows: '6',
                'data-property': 'abstract',
                placeholder: 'Enter abstract...'
              }, yaml.abstract || '']
            ],
            ['div', { class: 'metadata-section' },
              ['div', { class: 'metadata-row' },
                ['select', {
                  class: 'format-select',
                  'data-property': 'format'
                },
                  ['option', { value: 'html', selected: yaml.format === 'html' }, 'HTML'],
                  ['option', { value: 'pdf', selected: yaml.format === 'pdf' }, 'PDF'],
                  ['option', { value: 'docx', selected: yaml.format === 'docx' }, 'DOCX']
                ],
                ['input', {
                  class: 'bibliography-input',
                  type: 'text',
                  value: yaml.bibliography || '',
                  placeholder: 'Bibliography file',
                  'data-property': 'bibliography'
                }]
              ]
            ]
          ]
        ];
      }

      return ['div', { 
        'data-type': 'raw-cell',
        class: 'raw-cell',
        contenteditable: 'true'
      }, node.attrs.content || ''];
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
          
          // Create the properties table
          const table = document.createElement('div');
          table.classList.add('properties-table');
          
          // Helper function to create a property row
          const createPropertyRow = (label, value, property, type = 'text') => {
            const row = document.createElement('div');
            row.classList.add('property-row');
            
            const labelDiv = document.createElement('div');
            labelDiv.classList.add('property-label');
            labelDiv.textContent = label;
            
            const valueDiv = document.createElement('div');
            valueDiv.classList.add('property-value');
            
            let input;
            if (type === 'textarea') {
              input = document.createElement('textarea');
              input.rows = '4';
            } else {
              input = document.createElement('input');
              input.type = type;
            }
            
            input.value = value || '';
            input.setAttribute('data-property', property);
            input.addEventListener('input', (e) => {
              e.stopPropagation();
              const newYaml = { ...yaml };
              newYaml[property] = e.target.value;
              editor.commands.updateAttributes('rawCell', {
                parsedYaml: newYaml
              });
            });
            
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
          
          // Add all properties
          table.appendChild(createPropertyRow('Title', yaml.title, 'title'));
          table.appendChild(createPropertyRow('Subtitle', yaml.subtitle, 'subtitle'));
          table.appendChild(createPropertyRow('Author', yaml.author, 'author'));
          table.appendChild(createPropertyRow('Date', yaml.date, 'date'));
          table.appendChild(createPropertyRow('Abstract', yaml.abstract, 'abstract', 'textarea'));
          table.appendChild(createPropertyRow('Format', yaml.format, 'format'));
          table.appendChild(createPropertyRow('Bibliography', yaml.bibliography, 'bibliography'));
          
          dom.appendChild(table);
        } else {
          // For non-YAML content
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