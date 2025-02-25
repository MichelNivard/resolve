import { Mark } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

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
      citationKey: { default: null },
      prefix: { default: null },
      suffix: { default: null },
      locator: { default: null },
      isInBrackets: { default: false },
      referenceDetails: { default: null }
    }
  },

  parseHTML() {
    console.log('CitationMark: parsing HTML');
    return [
      {
        tag: 'span[data-citation-key]',
        getAttrs: element => {
          const attrs = {
            citationKey: element.getAttribute('data-citation-key'),
            prefix: element.getAttribute('data-prefix'),
            suffix: element.getAttribute('data-suffix'),
            locator: element.getAttribute('data-locator'),
            isInBrackets: element.getAttribute('data-in-brackets') === 'true',
            referenceDetails: element.getAttribute('data-reference-details')
          };
          console.log('CitationMark: parsed attributes:', attrs);
          return attrs;
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    console.log('CitationMark: rendering HTML with attributes:', HTMLAttributes);
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

    console.log('CitationMark: final HTML attributes:', attrs);
    return ['span', attrs, 0]
  },

  addProseMirrorPlugins() {
    console.log('CitationMark: adding ProseMirror plugins');
    return [
      new Plugin({
        key: new PluginKey('citation-tooltip'),
        view(editorView) {
          console.log('CitationMark: initializing tooltip plugin view');
          // Keep track of elements that already have tooltips
          const tippyInstances = new WeakMap();
          
          // Function to create a tooltip for a single citation element
          const createTooltipForElement = (element) => {
            console.log('CitationMark: creating tooltip for element:', element);
            console.log('CitationMark: element classes:', element.className);
            console.log('CitationMark: citation key:', element.getAttribute('data-citation-key'));
            console.log('CitationMark: reference details:', element.getAttribute('data-reference-details'));
            
            // Skip if already has a tooltip
            if (tippyInstances.has(element)) {
              console.log('CitationMark: element already has tooltip, skipping');
              return;
            }
            
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
                console.log('CitationMark: tooltip showing, computing content');
                const referenceDetails = element.getAttribute('data-reference-details');
                console.log('CitationMark: reference details from attribute:', referenceDetails);
                
                let refData;
                
                if (referenceDetails) {
                  // Parse the stored reference details
                  try {
                    refData = JSON.parse(referenceDetails);
                    console.log('CitationMark: parsed reference data:', refData);
                  } catch (e) {
                    console.error('CitationMark: Failed to parse reference details:', e);
                  }
                } else {
                  console.log('CitationMark: No reference details in attribute, trying reference manager');
                }
                
                if (!refData) {
                  // Fallback to reference manager
                  const citationKey = element.getAttribute('data-citation-key');
                  console.log('CitationMark: looking up citation key in reference manager:', citationKey);
                  console.log('CitationMark: reference manager available:', !!editorView.state.schema.cached.referenceManager);
                  
                  const reference = editorView.state.schema.cached.referenceManager?.getReference(citationKey);
                  console.log('CitationMark: reference from manager:', reference);
                  
                  if (reference) {
                    refData = reference.entryTags;
                    console.log('CitationMark: reference entry tags:', refData);
                  }
                }
                
                if (refData) {
                  const { AUTHOR, YEAR, TITLE, JOURNAL } = refData;
                  console.log('CitationMark: extracted citation data:', { AUTHOR, YEAR, TITLE, JOURNAL });
                  
                  // Format authors (remove any '{' and '}' from BibTeX formatting)
                  const authors = AUTHOR ? AUTHOR.replace(/[{}]/g, '') : '';
                  
                  // Construct citation in academic format
                  const parts = [];
                  if (authors) parts.push(authors);
                  if (YEAR) parts.push(`(${YEAR})`);
                  if (TITLE) parts.push(TITLE.replace(/[{}]/g, ''));
                  if (JOURNAL) parts.push(`<em>${JOURNAL.replace(/[{}]/g, '')}</em>`);
                  
                  const content = `<div class="citation-tooltip">${parts.join(', ')}</div>`;
                  console.log('CitationMark: setting tooltip content:', content);
                  instance.setContent(content);
                } else {
                  console.log('CitationMark: No reference data found, showing fallback message');
                  instance.setContent('Reference details not available');
                }
              }
            });
            
            // Store the instance
            tippyInstances.set(element, instance);
            console.log('CitationMark: tooltip created and stored');
          };

          // Use MutationObserver to detect new citation elements
          console.log('CitationMark: setting up MutationObserver');
          const observer = new MutationObserver(mutations => {
            console.log('CitationMark: mutation observed, checking for new citations');
            for (const mutation of mutations) {
              if (mutation.type === 'childList') {
                // Check for new citation elements
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check the node itself
                    if (node.classList && node.classList.contains('citation')) {
                      console.log('CitationMark: found new citation element:', node);
                      createTooltipForElement(node);
                    }
                    // Check children
                    const citations = node.querySelectorAll('.citation');
                    console.log('CitationMark: found', citations.length, 'citation elements in added node');
                    citations.forEach(createTooltipForElement);
                  }
                });
              }
            }
          });

          // Start observing
          console.log('CitationMark: starting to observe DOM for changes');
          observer.observe(editorView.dom, { 
            childList: true, 
            subtree: true 
          });

          // Initialize tooltips for existing citations
          const existingCitations = editorView.dom.querySelectorAll('.citation');
          console.log('CitationMark: found', existingCitations.length, 'existing citation elements');
          existingCitations.forEach(createTooltipForElement);

          return {
            update(view, prevState) {
              console.log('CitationMark: plugin view update called');
              // No need to do anything here, the MutationObserver handles new elements
            },
            destroy() {
              console.log('CitationMark: destroying plugin view');
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
