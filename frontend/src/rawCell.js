import { Node } from '@tiptap/core'
import yaml from 'js-yaml'
import './rawCell.css'

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
            class: 'raw-cell',
            'data-display-mode': 'edit'
          },
            ['textarea', { 
              class: 'raw-cell-editor',
              style: 'width: 100%; min-height: 200px; font-family: monospace;'
            }, node.attrs.content || ''] // Always use current content
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
        let popup = null;

        const createPopupEditor = () => {
          const overlay = document.createElement('div');
          overlay.className = 'yaml-editor-overlay';
          
          const popupEl = document.createElement('div');
          popupEl.className = 'yaml-editor-popup';
          
          const header = document.createElement('div');
          header.className = 'yaml-editor-header';
          
          const title = document.createElement('div');
          title.className = 'yaml-editor-title';
          title.textContent = 'Edit YAML Header';
          
          const closeBtn = document.createElement('button');
          closeBtn.className = 'yaml-editor-close';
          closeBtn.innerHTML = '×';
          closeBtn.onclick = () => {
            const currentContent = popup.textarea.value;
            const parsed = tryParseYaml(currentContent);
            editor.chain()
              .updateAttributes('rawCell', {
                content: currentContent,
                parsedYaml: parsed?.parsed || null,
                formattedYaml: parsed?.formatted || null,
                displayMode: 'view'
              })
              .run();
          };
          
          header.appendChild(title);
          header.appendChild(closeBtn);
          
          const textarea = document.createElement('textarea');
          textarea.className = 'yaml-editor-textarea';
          const initialContent = node.attrs.content;
          textarea.value = initialContent || '';
          
          textarea.addEventListener('input', (e) => {
            const newContent = e.target.value;
            const parsed = tryParseYaml(newContent);
            
            let content = newContent;
            if (parsed?.parsed) {
              content = `---\n${parsed.formatted}---`;
            }
            
            editor.chain()
              .updateAttributes('rawCell', {
                content,
                parsedYaml: parsed?.parsed || null,
                formattedYaml: parsed?.formatted || null
              })
              .run();
            
            requestAnimationFrame(() => {
              textarea.focus();
            });
          });

          textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
              textarea.selectionStart = textarea.selectionEnd = start + 2;
            } else if (e.key === 'Escape') {
              closeBtn.click();
            }
          });
          
          textarea.addEventListener('focus', (e) => {
            e.stopPropagation();
          });
          
          textarea.addEventListener('mousedown', (e) => {
            e.stopPropagation();
          });
          
          popupEl.appendChild(header);
          popupEl.appendChild(textarea);
          overlay.appendChild(popupEl);
          
          overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
              closeBtn.click();
            }
          });
          
          return {
            element: overlay,
            textarea,
            destroy: () => {
              if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
              }
            }
          };
        };

        if (typeof getPos === 'function' && editor && node.attrs.isAcademicArticle) {
          dom.addEventListener('click', () => {
            if (node.attrs.displayMode === 'view') {
              editor.chain()
                .updateAttributes('rawCell', {
                  displayMode: 'edit',
                  content: node.attrs.content, // Ensure we use the latest content
                })
                .run();
            }
          });
        }
        
        const update = (node) => {
          if (node.attrs.isYamlHeader && node.attrs.isAcademicArticle) {
            if (node.attrs.displayMode === 'edit') {
              if (!popup) {
                popup = createPopupEditor();
                document.body.appendChild(popup.element);
                
                popup.textarea.value = node.attrs.content || '';
                
                requestAnimationFrame(() => {
                  popup.textarea.focus();
                  popup.textarea.selectionStart = popup.textarea.selectionEnd = popup.textarea.value.length;
                });
              } else {
                popup.textarea.value = node.attrs.content || '';
              }
            } else {
              if (popup) {
                popup.destroy();
                popup = null;
              }
              
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
            if (popup) {
              popup.destroy();
              popup = null;
            }
          }
        };
      };
    }
  });