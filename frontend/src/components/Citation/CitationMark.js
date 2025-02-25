import { Mark } from '@tiptap/core';

export const CitationMark = Mark.create({
  name: 'citation',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      citationKey: { default: null },
      prefix: { default: null },
      suffix: { default: null },
      locator: { default: null },
      isInBrackets: { default: false }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-key]',
        getAttrs: element => ({
          citationKey: element.getAttribute('data-citation-key'),
          prefix: element.getAttribute('data-prefix'),
          suffix: element.getAttribute('data-suffix'),
          locator: element.getAttribute('data-locator'),
          isInBrackets: element.getAttribute('data-in-brackets') === 'true'
        })
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = {
      class: 'citation',
      'data-citation-key': HTMLAttributes.citationKey,
    };

    if (HTMLAttributes.prefix) {
      attrs['data-prefix'] = HTMLAttributes.prefix;
    }
    if (HTMLAttributes.suffix) {
      attrs['data-suffix'] = HTMLAttributes.suffix;
    }
    if (HTMLAttributes.locator) {
      attrs['data-locator'] = HTMLAttributes.locator;
    }
    if (HTMLAttributes.isInBrackets) {
      attrs['data-in-brackets'] = 'true';
      attrs.class += ' citation-bracketed';
    }

    return ['span', attrs, 0]
  },

  // Regular expressions for citation patterns
  citationRegex: /^@([a-zA-Z0-9_][a-zA-Z0-9_:.#$%&\-+?<>~/]*|\{[^}]+\})/,
  locatorTerms: /\b(p|pp|page|pages|chapter|chap|section|sec|paragraph|para|figure|fig|volume|vol)\b\.?\s+([0-9]+(?:\s*[-–]\s*[0-9]+)?)/i,

  // Helper method to parse citation text
  parseCitationText(text) {
    const match = text.match(this.citationRegex);
    if (!match) return null;

    let citationKey = match[1];
    if (citationKey.startsWith('{') && citationKey.endsWith('}')) {
      citationKey = citationKey.slice(1, -1);
    }

    const parts = text.slice(match[0].length).split(',');
    const prefix = parts.length > 1 ? parts[0].trim() : '';
    const remainder = parts.slice(1).join(',').trim();

    const locatorMatch = remainder.match(this.locatorTerms);
    const locator = locatorMatch ? locatorMatch[0] : '';
    const suffix = locatorMatch ? remainder.replace(locatorMatch[0], '').trim() : remainder;

    return {
      citationKey,
      prefix,
      locator,
      suffix,
      isInBrackets: text.startsWith('[') && text.endsWith(']')
    };
  }
});
