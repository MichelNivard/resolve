import React, { useState, useContext } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { getMarkRange } from '@tiptap/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faComment, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../contexts/AuthContext';
import '../Comments/CommentsSidebar.css';

export default function EditorBubbleMenuManager({ editor }) {
  const [isCommentInputVisible, setIsCommentInputVisible] = useState(false);
  const [isCitationInputVisible, setIsCitationInputVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [doiInput, setDoiInput] = useState('');
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

  const handleAddCitation = async () => {
    if (!editor) return;
    
    const doi = doiInput.trim();
    if (!doi.startsWith('doi:')) {
      console.error('Invalid DOI format');
      return;
    }

    try {
      const citationKey = await editor.referenceManager.addReferenceFromDOI(doi.substring(4));
      editor.chain()
        .focus()
        .setMark('citation', { citationKey })
        .insertContent(`[@${citationKey}]`)
        .run();

      setDoiInput('');
      setIsCitationInputVisible(false);
    } catch (error) {
      console.error('Error adding citation:', error);
    }
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
                onClick={() => setIsCitationInputVisible(true)}
                title="Add citation"
              >
                <FontAwesomeIcon icon={faQuoteLeft} />
              </button>
            </>
          )}
        </div>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => isCitationInputVisible}
        tippyOptions={{ duration: 100 }}
      >
        <div className="bubble-menu-container">
          <div className="citation-input-container">
            <input
              type="text"
              className="bubble-menu-input"
              placeholder="doi:10.xxxx/xxxxx"
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCitation();
                }
              }}
            />
            <button className="bubble-menu-button accept" onClick={handleAddCitation}>
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button
              className="bubble-menu-button reject"
              onClick={() => {
                setDoiInput('');
                setIsCitationInputVisible(false);
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      </BubbleMenu>
    </>
  );
}
