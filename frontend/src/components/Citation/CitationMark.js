import { Mark } from '@tiptap/core';

export const CitationMark = Mark.create({
  name: 'citation',

  addAttributes() {
    return {
      citationKey: { default: null }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-key]',
        getAttrs: element => ({
          citationKey: element.getAttribute('data-citation-key')
        })
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { 
      class: 'citation',
      'data-citation-key': HTMLAttributes.citationKey 
    }, 0]
  }
});
