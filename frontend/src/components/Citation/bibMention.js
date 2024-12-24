// bibMention.js
import { Mention } from '@tiptap/extension-mention'

export const BibMention = Mention.extend({
  name: 'bibMention',

  addAttributes() {
    return {
      bibKey: { default: null },
      label: { default: null },
      firstAuthor: { default: null },
      year: { default: null },
      title: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.bib-mention[data-bib-key]',
        getAttrs: element => {
          const el = element;
          // Extract the bibKey from data-bib-key
          const bibKey = el.getAttribute('data-bib-key') || null
          // If you ever store firstAuthor, year, etc. as separate data attributes:
          // const firstAuthor = el.getAttribute('data-first-author') || null
          // const year = el.getAttribute('data-year') || null
          // const title = el.getAttribute('data-title') || null

          return {
            bibKey,
            // label: null, // Or derive from tooltip if you want
            // firstAuthor, year, title
          }
        }
      }
    ]
  },

  renderHTML({ node }) {
    const firstAuthor = node.attrs.firstAuthor || ''
    const year = node.attrs.year || ''
    const title = node.attrs.title || ''

    // Construct tooltip if you have these fields
    const tooltipContent = `${firstAuthor} (${year}) ${title}`.trim()

    return [
      'span',
      {
        class: 'bib-mention',
        'data-bib-key': node.attrs.bibKey,
        'data-tooltip': tooltipContent || '',
      },
      `@${node.attrs.bibKey}`
    ]
  },
})
