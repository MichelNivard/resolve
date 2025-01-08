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
        dom.contentEditable = 'true';

        if (node.attrs.isYamlHeader && node.attrs.isAcademicArticle) {
          console.log('Rendering academic frontpage');
          dom.classList.add('academic-frontpage');
          const yaml = node.attrs.parsedYaml || {};
          
          // Create the frontpage content
          const content = document.createElement('div');
          content.classList.add('frontpage-content');
          
          // Title section
          const titleSection = document.createElement('div');
          titleSection.classList.add('title-section');
          
          const titleInput = document.createElement('input');
          titleInput.classList.add('title-input');
          titleInput.type = 'text';
          titleInput.value = yaml.title || '';
          titleInput.placeholder = 'Title';
          titleInput.setAttribute('data-property', 'title');
          
          const subtitleInput = document.createElement('input');
          subtitleInput.classList.add('subtitle-input');
          subtitleInput.type = 'text';
          subtitleInput.value = yaml.subtitle || '';
          subtitleInput.placeholder = 'Subtitle';
          subtitleInput.setAttribute('data-property', 'subtitle');
          
          titleSection.appendChild(titleInput);
          titleSection.appendChild(subtitleInput);
          
          // Author section
          const authorSection = document.createElement('div');
          authorSection.classList.add('author-section');
          
          const authorInput = document.createElement('input');
          authorInput.classList.add('author-input');
          authorInput.type = 'text';
          authorInput.value = yaml.author || '';
          authorInput.placeholder = 'Author';
          authorInput.setAttribute('data-property', 'author');
          
          const dateInput = document.createElement('input');
          dateInput.classList.add('date-input');
          dateInput.type = 'text';
          dateInput.value = yaml.date || '';
          dateInput.placeholder = 'Date';
          dateInput.setAttribute('data-property', 'date');
          
          authorSection.appendChild(authorInput);
          authorSection.appendChild(dateInput);
          
          // Abstract section
          const abstractSection = document.createElement('div');
          abstractSection.classList.add('abstract-section');
          
          const abstractLabel = document.createElement('div');
          abstractLabel.classList.add('abstract-label');
          abstractLabel.textContent = 'Abstract';
          
          const abstractInput = document.createElement('textarea');
          abstractInput.classList.add('abstract-input');
          abstractInput.rows = '6';
          abstractInput.value = yaml.abstract || '';
          abstractInput.placeholder = 'Enter abstract...';
          abstractInput.setAttribute('data-property', 'abstract');
          
          abstractSection.appendChild(abstractLabel);
          abstractSection.appendChild(abstractInput);
          
          // Add all sections to content
          content.appendChild(titleSection);
          content.appendChild(authorSection);
          content.appendChild(abstractSection);
          
          // Add content to dom
          dom.appendChild(content);
          
          // Add event listeners for input changes
          const inputs = dom.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            input.addEventListener('input', () => {
              const property = input.getAttribute('data-property');
              if (property) {
                const newYaml = { ...yaml };
                newYaml[property] = input.value;
                editor.commands.updateAttributes('rawCell', {
                  parsedYaml: newYaml
                });
              }
            });
          });
        } else {
          // For non-YAML content
          dom.textContent = node.attrs.content || '';
        }

        return {
          dom,
          update: (updatedNode) => {
            console.log('Node update called with:', updatedNode);
            return true;
          },
          destroy: () => {
            // Cleanup if needed
          }
        };
      };
    }
});