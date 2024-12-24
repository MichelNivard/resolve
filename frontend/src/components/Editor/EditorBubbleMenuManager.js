import React, { useState, useContext } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { getMarkRange } from '@tiptap/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faComment, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { createCitationMenu } from '../Citation/CitationComponents';
import '../Comments/CommentsSidebar.css';

export default function EditorBubbleMenuManager({ editor }) {
  const [isCommentInputVisible, setIsCommentInputVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { user } = useContext(AuthContext);

  const findTrackChangeMark = (view, pos) => {
    if (pos === undefined || pos === null) return null;
    
    const { doc, schema } = view.state;
    try {
      const $pos = doc.resolve(pos);
      
      // Try to find either insertion or deletion mark
      let range = getMarkRange($pos, schema.marks.insertion);
      let type = range ? 'insertion' : undefined;
      
      if (!range) {
        range = getMarkRange($pos, schema.marks.deletion);
        type = range ? 'deletion' : undefined;
      }
      
      if (!range) {
        range = getMarkRange($pos, schema.marks.comment);
        type = range ? 'comment' : undefined;
      }
      
      return range ? { ...range, type } : null;
    } catch (e) {
      console.error('Error finding mark:', e);
      return null;
    }
  };

  const handleAcceptChange = () => {
    const { from } = editor.state.selection;
    const markRange = findTrackChangeMark(editor.view, from);
    
    if (!markRange) return;
    
    const tr = editor.state.tr;
    
    if (markRange.type === 'insertion') {
      tr.removeMark(markRange.from, markRange.to, editor.schema.marks.insertion);
    } else if (markRange.type === 'deletion') {
      tr.delete(markRange.from, markRange.to);
    }
    
    editor.view.dispatch(tr);
  };

  const handleRejectChange = () => {
    const { from } = editor.state.selection;
    const markRange = findTrackChangeMark(editor.view, from);
    
    if (!markRange) return;
    
    const tr = editor.state.tr;
    
    if (markRange.type === 'insertion') {
      tr.delete(markRange.from, markRange.to);
    } else if (markRange.type === 'deletion') {
      tr.removeMark(markRange.from, markRange.to, editor.schema.marks.deletion);
    }
    
    editor.view.dispatch(tr);
  };

  const handleAddComment = () => {
    if (!editor || !user?.login) return;
    
    const { from, to } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);

    if (commentText.trim()) {
      editor.chain()
        .focus()
        .setMark('comment', {
          commentId: `comment-${Date.now()}`,
          username: user.name || user.login,
          avatarUrl: user.avatar_url,
          text: commentText,
          timestamp: new Date().toISOString()
        })
        .run();

      setCommentText('');
      setIsCommentInputVisible(false);
    }
  };

  const handleAddCitation = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return; // Require text selection for citation

    const coords = editor.view.coordsAtPos(from);
    const menuContainer = document.createElement('div');
    menuContainer.style.position = 'absolute';
    menuContainer.style.left = `${coords.left}px`;
    menuContainer.style.top = `${coords.bottom}px`;
    document.body.appendChild(menuContainer);

    // Get references from the correct storage location
    const bibMentionExt = editor.extensionManager.extensions.find(ext => ext.name === 'bibMention');
    console.log('BubbleMenu: Found bibMention extension:', bibMentionExt);
    const suggestion = bibMentionExt?.options?.suggestion;
    console.log('BubbleMenu: Got suggestion from extension:', suggestion);
    const referenceMap = suggestion?.referenceMap || {};
    console.log('BubbleMenu: Got referenceMap:', referenceMap);
    
    // Convert referenceMap to items array format
    const items = Object.entries(referenceMap).map(([key, entry]) => {
      const authors = entry.author ? entry.author.split(/\s+and\s+/) : [];
      return {
        id: key,
        bibKey: key,
        title: entry.title || '',
        authors: authors,
        firstAuthor: authors[0] || '',
        year: entry.year || ''
      };
    }).sort((a, b) => {
      // Sort by year (descending) then by key (ascending)
      if (b.year !== a.year) return b.year.localeCompare(a.year);
      return a.bibKey.localeCompare(b.bibKey);
    });

    console.log('BubbleMenu: Created items array:', items);

    const menu = createCitationMenu({
      editor,
      items,
      command: ({ citations }) => {
        if (!citations || citations.length === 0) return;
        
        const content = `[@${citations.join('; @')}]`;
        editor
          .chain()
          .focus()
          .insertContent(content)
          .run();

        menuContainer.remove();
      },
      onClose: () => {
        menuContainer.remove();
      }
    });

    menu.mount(menuContainer);
  };

  return (
    <>
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor, view, state, from, to }) => {
          const markType = findTrackChangeMark(view, from);
          return markType?.type === 'insertion' || markType?.type === 'deletion';
        }}
        tippyOptions={{ duration: 100 }}
      >
        <div className="bubble-menu-container">
          <button
            className="bubble-menu-button accept"
            onClick={handleAcceptChange}
            title="Accept change"
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
          <button
            className="bubble-menu-button reject"
            onClick={handleRejectChange}
            title="Reject change"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        shouldShow={({ state }) => {
          const { empty, from, to } = state.selection;
          return !empty && from !== to;
        }}
        tippyOptions={{ duration: 100 }}
      >
        <div className="bubble-menu-container">
          {isCommentInputVisible ? (
            <>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="bubble-menu-input"
                style={{ width: '150px', height: '24px', padding: '0 8px' }}
                autoFocus
              />
              <button
                className="bubble-menu-button"
                onClick={() => {
                  setIsCommentInputVisible(false);
                  setCommentText('');
                }}
                title="Cancel"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <button
                className="bubble-menu-button"
                onClick={handleAddComment}
                title="Add comment"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
            </>
          ) : (
            <>
              <button
                className="bubble-menu-button"
                onClick={() => setIsCommentInputVisible(true)}
                title="Add comment"
              >
                <FontAwesomeIcon icon={faComment} />
              </button>
              <button
                className="bubble-menu-button"
                onClick={handleAddCitation}
                title="Add citation"
              >
                <FontAwesomeIcon icon={faQuoteRight} />
              </button>
            </>
          )}
        </div>
      </BubbleMenu>
    </>
  );
}
