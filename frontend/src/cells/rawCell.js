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
      console.log('RawCell addNodeView called');
      return ({ node, getPos, editor }) => {
        console.log('RawCell nodeView rendering with node:', node);
        const dom = document.createElement('div');
        dom.setAttribute('data-type', 'raw-cell');
        dom.classList.add('raw-cell');

        const handlePropertyChange = (key, value) => {
          const currentYaml = node.attrs.parsedYaml || {};
          const updatedYaml = { ...currentYaml, [key]: value };
          
          // Convert to YAML string
          const yamlString = `---\n${yaml.dump(updatedYaml)}---`;
          
          editor.chain()
            .updateAttributes('rawCell', {
              content: yamlString,
              parsedYaml: updatedYaml,
              formattedYaml: yaml.dump(updatedYaml)
            })
            .run();
        };

        const setupInputHandlers = () => {
          if (!node.attrs.isYamlHeader || !node.attrs.isAcademicArticle) return;

          const inputs = dom.querySelectorAll('input, textarea, select');
          inputs.forEach(input => {
            const property = input.dataset.property;
            if (!property) return;

            // Handle changes
            input.addEventListener('change', (e) => {
              handlePropertyChange(property, e.target.value);
            });

            // Handle input for real-time updates
            input.addEventListener('input', (e) => {
              handlePropertyChange(property, e.target.value);
            });

            // Handle tab navigation
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const allInputs = Array.from(dom.querySelectorAll('input, textarea, select'));
                const currentIndex = allInputs.indexOf(input);
                const nextInput = allInputs[currentIndex + 1] || allInputs[0];
                nextInput.focus();
              }
            });
          });
        };

        const update = (node) => {
          // Let renderHTML handle the content
          setupInputHandlers();
          return true;
        };

        update(node);

        return {
          dom,
          update,
          destroy: () => {
            // Cleanup if needed
          }
        };
      };
    }
});