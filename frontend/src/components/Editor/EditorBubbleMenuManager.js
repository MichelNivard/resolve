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
    console.log('handleAddCitation called');
    if (!editor) {
      console.error('No editor instance available');
      return;
    }
    
    const doi = doiInput.trim();
    console.log('Processing DOI:', doi);
    
    try {
      console.log('Fetching citation key for DOI:', doi);
      const citationKey = await editor.referenceManager.addReferenceFromDOI(`doi:${doi}`);
      console.log('Got citation key:', citationKey);

      console.log('Inserting citation into editor');
      editor.chain()
        .focus()
        .setMark('citation', { citationKey })
        .insertContent(`[@${citationKey}]`)
        .run();
      console.log('Citation inserted successfully');

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
                className="comment-input"
                placeholder="Add comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment();
                  }
                }}
              />
              <button className="bubble-menu-button accept" onClick={handleAddComment}>
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="bubble-menu-button reject"
                onClick={() => {
                  setCommentText('');
                  setIsCommentInputVisible(false);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </>
          ) : isCitationInputVisible ? (
            <>
              <span className="citation-label">DOI:</span>
              <input
                type="text"
                className="bubble-menu-input"
                placeholder="10.xxxx/xxxxx"
                value={doiInput}
                onChange={(e) => {
                  console.log('DOI input changed:', e.target.value);
                  const value = e.target.value.startsWith('doi:') ? 
                    e.target.value.substring(4) : 
                    e.target.value;
                  setDoiInput(value);
                }}
                onKeyDown={(e) => {
                  console.log('Key pressed in DOI input:', e.key);
                  if (e.key === 'Enter') {
                    handleAddCitation();
                  }
                }}
              />
              <button 
                className="bubble-menu-button accept" 
                onClick={() => {
                  console.log('Citation accept button clicked');
                  handleAddCitation();
                }}
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="bubble-menu-button reject"
                onClick={() => {
                  console.log('Citation cancel button clicked');
                  setDoiInput('');
                  setIsCitationInputVisible(false);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
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
                onClick={() => {
                  console.log('Citation button clicked');
                  setIsCitationInputVisible(true);
                  console.log('isCitationInputVisible set to true');
                }}
                title="Add citation"
              >
                <FontAwesomeIcon icon={faQuoteLeft} />
              </button>
            </>
          )}
        </div>
      </BubbleMenu>
    </>
  );
}
