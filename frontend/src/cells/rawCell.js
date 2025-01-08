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
    content: '',

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
        },
        displayMode: {
          default: 'view',
          rendered: true
        }
      }
    },

    addCommands() {
      return {
        setRawCellAttribute: attributes => ({ chain }) => {
          return chain()
            .updateAttributes('rawCell', attributes)
            .run();
        }
      };
    },

    parseHTML() {
      return [{
        tag: 'div[data-type="raw-cell"]'
      }]
    },
  
    renderHTML({ node }) {
      if (node.attrs.isYamlHeader && node.attrs.isAcademicArticle) {
        if (node.attrs.displayMode === 'edit') {
          return ['div', { 
            'data-type': 'raw-cell', 
            class: 'raw-cell yaml-table-editor',
            'data-display-mode': 'edit'
          },
            ['table', { class: 'yaml-properties-table' },
              ['thead', {},
                ['tr', {},
                  ['th', {}, 'Property'],
                  ['th', {}, 'Value'],
                  ['th', {}, 'Description']
                ]
              ],
              ['tbody', {}, 
                Object.entries(YAML_PROPERTIES).map(([key, config]) => {
                  const value = (node.attrs.parsedYaml || {})[key] || '';
                  return ['tr', { 'data-property': key },
                    ['td', { class: 'property-name' }, config.label],
                    ['td', { class: 'property-value' },
                      config.type === 'select' 
                        ? ['select', { class: 'yaml-select' },
                            config.options.map(opt => 
                              ['option', { 
                                value: opt,
                                selected: value === opt ? 'selected' : null 
                              }, opt]
                            )
                          ]
                        : config.type === 'textarea'
                          ? ['textarea', { 
                              class: 'yaml-textarea',
                              rows: '4'
                            }, value]
                          : ['input', { 
                              type: 'text',
                              class: 'yaml-input',
                              value
                            }]
                    ],
                    ['td', { class: 'property-description' },
                      config.required ? '(Required)' : '(Optional)'
                    ]
                  ];
                })
              ]
            ],
            ['div', { class: 'yaml-actions' },
              ['button', { 
                class: 'yaml-save-btn',
                type: 'button'
              }, 'Save Changes']
            ]
          ];
        }
        const yaml = node.attrs.parsedYaml || {};
        return ['div', { 
          'data-type': 'raw-cell', 
          class: 'raw-cell',
          'data-display-mode': 'view'
        }, 
          ['div', { class: 'article-content' },
            ['h1', { class: 'article-title' }, yaml.title || ''],
            ['h2', { class: 'article-subtitle' }, yaml.subtitle || ''],
            ['div', { class: 'article-author' }, yaml.author || ''],
            ['div', { class: 'article-date' }, yaml.date || ''],
            ['h3', { class: 'article-abstract-header' }, 'Abstract'],
            ['div', { class: 'article-abstract' }, yaml.abstract || '']
          ]
        ];
      }
      
      return ['div', { 'data-type': 'raw-cell', class: 'raw-cell' }, node.attrs.content || ''];
    },

    addNodeView() {
      return ({ node, getPos, editor }) => {
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

        const setupTableHandlers = () => {
          const inputs = dom.querySelectorAll('.yaml-input, .yaml-select, .yaml-textarea');
          inputs.forEach(input => {
            const property = input.closest('tr').dataset.property;
            
            input.addEventListener('change', (e) => {
              handlePropertyChange(property, e.target.value);
            });
            
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const rows = Array.from(dom.querySelectorAll('tr'));
                const currentRow = input.closest('tr');
                const currentIndex = rows.indexOf(currentRow);
                const nextRow = rows[currentIndex + 1];
                
                if (nextRow) {
                  const nextInput = nextRow.querySelector('.yaml-input, .yaml-select, .yaml-textarea');
                  if (nextInput) nextInput.focus();
                }
              }
            });
          });

          const saveButton = dom.querySelector('.yaml-save-btn');
          if (saveButton) {
            saveButton.addEventListener('click', (e) => {
              e.stopPropagation();
              editor.chain()
                .updateAttributes('rawCell', {
                  displayMode: 'view'
                })
                .run();
            });
          }
        };

        // Setup click handler for view mode
        const setupViewModeHandler = () => {
          if (node.attrs.isYamlHeader && node.attrs.isAcademicArticle && node.attrs.displayMode === 'view') {
            const articleContent = dom.querySelector('.article-content');
            if (articleContent) {
              const handleClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (typeof getPos === 'function') {
                  editor.chain()
                    .setNodeSelection(getPos())
                    .updateAttributes('rawCell', {
                      displayMode: 'edit'
                    })
                    .run();
                }
              };

              articleContent.addEventListener('click', handleClick);
              return () => articleContent.removeEventListener('click', handleClick);
            }
          }
          return () => {};
        };

        const update = (node) => {
          if (node.attrs.isYamlHeader && node.attrs.isAcademicArticle) {
            if (node.attrs.displayMode === 'edit') {
              // Table is rendered via renderHTML
              setupTableHandlers();
            } else {
              const yaml = node.attrs.parsedYaml || {};
              dom.innerHTML = `
                <div class="article-content">
                  <h1 class="article-title">${yaml.title || ''}</h1>
                  <h2 class="article-subtitle">${yaml.subtitle || ''}</h2>
                  <div class="article-author">${yaml.author || ''}</div>
                  <div class="article-date">${yaml.date || ''}</div>
                  <h3 class="article-abstract-header">Abstract</h3>
                  <div class="article-abstract">${yaml.abstract || ''}</div>
                </div>
              `;
              
              // Setup click handler and store cleanup function
              const cleanup = setupViewModeHandler();
              // Store cleanup function for later
              dom.dataset.cleanup = cleanup;
            }
          } else {
            dom.textContent = node.attrs.content || '';
          }
          return true;
        };

        update(node);

        return {
          dom,
          update,
          destroy: () => {
            // Run cleanup function if it exists
            if (dom.dataset.cleanup) {
              dom.dataset.cleanup();
            }
          }
        };
      };
    }
  });