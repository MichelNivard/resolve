import { Mark } from '@tiptap/core';

export const CitationMark = Mark.create({
  name: 'citation',

  addOptions() {
    console.log('CitationMark: initializing options');
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    console.log('CitationMark: setting up attributes');
    return {
      citationKey: { default: null }
    }
  },

  parseHTML() {
    console.log('CitationMark: parsing HTML');
    return [
      {
        tag: 'span[data-citation-key]',
        getAttrs: element => {
          const attrs = {
            citationKey: element.getAttribute('data-citation-key')
          };
          console.log('CitationMark: parsed attributes:', attrs);
          return attrs;
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    console.log('CitationMark: rendering HTML with attributes:', HTMLAttributes);
    return ['span', { 
      class: 'citation',
      'data-citation-key': HTMLAttributes.citationKey 
    }, 0]
  }
});
