import { Mark, mergeAttributes } from '@tiptap/core';

export const CommentMark = Mark.create({
  name: 'comment',
  priority: 1000000, // Higher priority ensures this mark is applied last

  addAttributes() {
    return {
      commentId: {
        default: null
      },
      username: {
        default: null
      },
      avatarUrl: {
        default: null
      },
      text: {
        default: ''
      },
      timestamp: {
        default: new Date().toISOString()
      },
      resolved: {
        default: false
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
        priority: 1000,
        getAttrs: (element) => ({
          commentId: element.getAttribute('data-comment-id'),
          username: element.getAttribute('data-username'),
          avatarUrl: element.getAttribute('data-avatar-url'),
          text: element.getAttribute('data-text'),
          timestamp: element.getAttribute('data-timestamp'),
          resolved: element.getAttribute('data-resolved') === 'true'
        })
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Get theme from localStorage if available
    let theme = 'comment-theme-red'; // Default to red
    const savedThemes = localStorage.getItem('userThemes');
    if (savedThemes) {
      const themesMap = new Map(JSON.parse(savedThemes));
      if (themesMap.has(HTMLAttributes.username)) {
        theme = `comment-theme-${themesMap.get(HTMLAttributes.username)}`;
      }
    }

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-comment-id': HTMLAttributes.commentId,
        'data-username': HTMLAttributes.username,
        'data-avatar-url': HTMLAttributes.avatarUrl,
        'data-text': HTMLAttributes.text,
        'data-timestamp': HTMLAttributes.timestamp,
        'data-resolved': HTMLAttributes.resolved,
        'data-hoverable': 'true',
        class: `comment-mark ${theme}${HTMLAttributes.resolved ? ' resolved' : ''}`,
      }),
    ];
  },

  addCommands() {
    return {
      addComment: (attrs) => ({ commands }) => {
        return commands.setMark(this.name, attrs);
      },
      unsetComment: (commentId) => ({ tr, state }) => {
        // Search through the entire document for the comment mark
        state.doc.descendants((node, pos) => {
          if (node.marks) {
            node.marks.forEach(mark => {
              if (mark.type.name === this.name && mark.attrs.commentId === commentId) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
              }
            });
          }
        });
        return true;
      }
    };
  }
});