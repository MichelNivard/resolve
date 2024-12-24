import { Node } from '@tiptap/core'
import './rawCell.css'

export const RawCell = Node.create({
    name: 'rawCell',
    group: 'block',
    atom: true,

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
        isAcademicArticle: {
          default: false
        },
        displayMode: {
          default: 'view'
        }
      }
    },

    parseHTML() {
      return [{
        tag: 'div[data-type="raw-cell"]'
      }]
    },
  
    renderHTML({ node }) {
      const attrs = {
        'data-type': 'raw-cell',
        class: 'raw-cell'
      };

      if (node.attrs.isAcademicArticle && node.attrs.parsedYaml) {
        const yaml = node.attrs.parsedYaml;
        return ['div', attrs, [
          ['h1', { class: 'article-title' }, yaml.title || ''],
          ['h2', { class: 'article-subtitle' }, yaml.subtitle || ''],
          ['div', { class: 'article-author' }, yaml.author || ''],
          ['div', { class: 'article-date' }, yaml.date || ''],
          ['h3', { class: 'article-abstract-header' }, 'Abstract'],
          ['div', { class: 'article-abstract' }, yaml.abstract || ''],
          ['div', { class: 'article-metadata' }, [
            ['div', { class: 'article-bibliography' }, `Bibliography: ${yaml.bibliography || ''}`],
            ['div', { class: 'article-license' }, `License: ${yaml.license || ''}`],
            ['div', { class: 'article-format' }, `Format: ${yaml.format || ''}`]
          ]]
        ]];
      }
      
      return ['div', attrs, node.attrs.content];
    },

    addNodeView() {
      return ({ node, getPos }) => {
        const dom = document.createElement('div');
        dom.setAttribute('data-type', 'raw-cell');
        
        if (typeof getPos === 'function') {
          dom.addEventListener('click', () => {
            this.options.handleClick(node, getPos());
          });
        }
        
        const update = (node) => {
          dom.textContent = node.attrs.content;
          return true;
        };
        
        update(node);
        
        return {
          dom,
          update
        };
      };
    }
  });