import { Mark } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

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
      isInBrackets: { default: false },
      referenceDetails: { default: null }
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
          isInBrackets: element.getAttribute('data-in-brackets') === 'true',
          referenceDetails: element.getAttribute('data-reference-details')
        })
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = {
      class: 'citation',
      'data-citation-key': HTMLAttributes.citationKey,
      'data-reference-details': HTMLAttributes.referenceDetails
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('citation-tooltip'),
        view(editorView) {
          // Keep track of elements that already have tooltips
          const tippyInstances = new WeakMap();
          
          // Function to create a tooltip for a single citation element
          const createTooltipForElement = (element) => {
            // Skip if already has a tooltip
            if (tippyInstances.has(element)) return;
            
            const instance = tippy(element, {
              content: 'Loading...',
              allowHTML: true,
              delay: [200, 0], // Show after 200ms, hide immediately
              placement: 'top',
              arrow: true,
              theme: 'light-border',
              interactive: true,
              appendTo: document.body,
              // Only compute content when the tooltip is shown
              onShow(instance) {
                const referenceDetails = element.getAttribute('data-reference-details');
                let refData;
                
                if (referenceDetails) {
                  // Parse the stored reference details
                  try {
                    refData = JSON.parse(referenceDetails);
                  } catch (e) {
                    console.error('Failed to parse reference details:', e);
                  }
                }
                
                if (!refData) {
                  // Fallback to reference manager
                  const citationKey = element.getAttribute('data-citation-key');
                  const reference = editorView.state.schema.cached.referenceManager?.getReference(citationKey);
                  if (reference) {
                    refData = reference.entryTags;
                  }
                }

                if (refData) {
                  const { AUTHOR, YEAR, TITLE, JOURNAL } = refData;
                  // Format authors (remove any '{' and '}' from BibTeX formatting)
                  const authors = AUTHOR ? AUTHOR.replace(/[{}]/g, '') : '';
                  
                  // Construct citation in academic format
                  const parts = [];
                  if (authors) parts.push(authors);
                  if (YEAR) parts.push(`(${YEAR})`);
                  if (TITLE) parts.push(TITLE.replace(/[{}]/g, ''));
                  if (JOURNAL) parts.push(`<em>${JOURNAL.replace(/[{}]/g, '')}</em>`);
                  
                  instance.setContent(`<div class="citation-tooltip">${parts.join(', ')}</div>`);
                } else {
                  instance.setContent('Reference details not available');
                }
              }
            });
            
            // Store the instance
            tippyInstances.set(element, instance);
          };

          // Use MutationObserver to detect new citation elements
          const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
              if (mutation.type === 'childList') {
                // Check for new citation elements
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check the node itself
                    if (node.classList && node.classList.contains('citation')) {
                      createTooltipForElement(node);
                    }
                    // Check children
                    node.querySelectorAll('.citation').forEach(createTooltipForElement);
                  }
                });
              }
            }
          });

          // Start observing
          observer.observe(editorView.dom, { 
            childList: true, 
            subtree: true 
          });

          // Initialize tooltips for existing citations
          editorView.dom.querySelectorAll('.citation').forEach(createTooltipForElement);

          return {
            update(view, prevState) {
              // No need to do anything here, the MutationObserver handles new elements
            },
            destroy() {
              // Stop observing
              observer.disconnect();
              
              // Clean up all tooltips
              document.querySelectorAll('.citation').forEach(element => {
                const instance = tippyInstances.get(element);
                if (instance) {
                  instance.destroy();
                }
              });
            }
          };
        }
      })
    ];
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
