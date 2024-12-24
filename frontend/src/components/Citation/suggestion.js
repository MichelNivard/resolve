import tippy from 'tippy.js';
import { ReactRenderer } from '@tiptap/react';
import { MentionList } from './CitationComponents';

export const suggestionFactory = (referenceManager) => {
  console.log(' Creating suggestion with reference manager:', referenceManager);

  const searchReferences = async (query) => {
    console.log(' Searching with query:', query);
    console.log(' Using reference manager:', referenceManager);

    if (!referenceManager) {
      console.warn(' No reference manager available');
      return [];
    }

    try {
      const items = await referenceManager.search(query);
      console.log(' Found items:', items);

      if (!Array.isArray(items)) {
        console.warn(' Search result is not an array:', items);
        return [];
      }

      return items.map(entry => {
        if (!entry || !entry.entryTags) {
          console.warn(' Invalid entry:', entry);
          return null;
        }

        const authors = entry.entryTags.author || '';
        const authorList = authors.split(/\s+and\s+/);
        const firstAuthor = authorList[0]?.trim() || '';
        const year = entry.entryTags.year || '';
        const title = entry.entryTags.title || '';

        return {
          id: entry.citationKey,
          bibKey: entry.citationKey,
          title,
          authors: authorList,
          firstAuthor,
          year,
          journal: entry.entryTags.journal || entry.entryTags.booktitle || '',
          type: entry.entryType
        };
      }).filter(Boolean); // Remove any null entries
    } catch (error) {
      console.error(' Error searching references:', error);
      return [];
    }
  };

  return {
    char: '@',
    allowSpaces: true,
    command: ({ editor, range, props }) => {
      if (!props) {
        console.warn('No props provided');
        return;
      }

      // Handle multiple citations
      if (props.multiple && props.ids) {
        const citations = props.ids;
        if (citations.length === 0) return;

        // Get the text before to check context
        const beforeText = editor.state.doc.textBetween(Math.max(0, range.from - 50), range.from);
        const isInsideBrackets = beforeText.includes('[') && !beforeText.includes(']');
        
        let content = '';
        if (isInsideBrackets) {
          // If we're already inside brackets, just add the citations
          content = citations.join('; ');
        } else {
          // Otherwise, wrap in brackets
          content = `[${citations.join('; ')}]`;
        }

        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(content)
          .run();
        return;
      }

      // Handle single citation
      const key = props.id || props.bibKey;
      if (!key) {
        console.warn('No citation key provided');
        return;
      }

      // Get the text before and after to check context
      const beforeText = editor.state.doc.textBetween(Math.max(0, range.from - 50), range.from);
      const afterText = editor.state.doc.textBetween(range.to, Math.min(editor.state.doc.content.size, range.to + 50));
      
      const isInsideBrackets = beforeText.endsWith('[') && afterText.startsWith(']');
      const isStartingBrackets = beforeText.endsWith('[');
      const hasExistingCitation = beforeText.includes('[@') && !beforeText.includes(']');

      let content = '';
      if (hasExistingCitation) {
        // If there's already a citation, add a semicolon and the new citation
        content = `; @${key}`;
      } else if (isInsideBrackets) {
        // If we're inside [], just insert the @key
        content = `@${key}`;
      } else if (isStartingBrackets) {
        // If we have a [ before, just close it
        content = `@${key}]`;
      } else {
        // Otherwise, wrap in []
        content = `[@${key}]`;
      }

      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(content)
        .run();
    },

    items: async ({ query }) => {
      return await searchReferences(query);
    },

    render: () => {
      let component;
      let popup;

      return {
        onStart: props => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor
          });

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate(props) {
          component.updateProps(props);

          popup[0].setProps({
            getReferenceClientRect: props.clientRect
          });
        },

        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            popup[0].hide();
            return true;
          }

          return component.ref?.onKeyDown(props);
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
};
