import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from 'tiptap-math';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { CitationMark } from '../Citation/CitationMark';
import EditorBubbleMenuManager from './EditorBubbleMenuManager';
import { TrackChangeExtension } from '../../utils/TrackChanges';
import { CommentMark } from '../../utils/CommentMark';
import { RawCell } from '../../cells/rawCell';
import { CodeCell } from '../../cells/codeCell';
import { ipynbToTiptapDoc } from '../../utils/notebookConversionUtils';
import EditorToolbar from './EditorToolbar';
import { CommentsSidebar } from '../Comments/CommentsSidebar';
import LoginButton from '../Auth/LoginButton';
import { fetchNotebooksInRepo } from '../../utils/api';
import InlineMath from '../../utils/InlineMath/inlineMath';

const ReferencesList = ({ references }) => {
  console.log("ReferencesList received references:", references);
  if (!references || references.length === 0) {
    console.log("No references to display");
    return null;
  }

  return (
    <div className="references-section">
      <h2>References</h2>
      <div className="references-list">
        {references.map((ref, index) => {
          const { entryTags = {} } = ref;
          const { author, year, title, journal, doi, url } = entryTags;
          
          return (
            <div key={index} className="reference-item">
              {author && `${author}. `}
              {year && `(${year}). `}
              {title && `${title}. `}
              {journal && <em>{journal}</em>}
              {doi && (
                <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer">
                  {` doi:${doi}`}
                </a>
              )}
              {!doi && url && (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {` ${url}`}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EditorWrapper = ({
  referenceManager,
  filePath,
  setFilePath,
  ipynb,
  setIpynb,
  handleLoadFile,
  handleSaveFile,
  saveMessage,
  repositories,
  selectedRepo,
  setSelectedRepo,
  extensions,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [error, setError] = useState(null);
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [commentMarkKey, setCommentMarkKey] = useState(0);

  const handleTrackChangesToggle = (enabled) => {
    setTrackChangesEnabled(enabled);
  }

  const handleCommentMarkUpdate = () => {
    setCommentMarkKey((prev) => prev + 1);
  }

  const editor = useEditor({
    extensions: extensions || [
      StarterKit,
      RawCell,
      CodeCell,
      Underline,
      Highlight,
      Table,
      TableCell,
      TableHeader,
      TableRow,
      TrackChangeExtension,
      Mathematics,
      InlineMath,
      CommentMark.configure({
        HTMLAttributes: {
          class: 'comment-mark',
        },
        onUpdate: handleCommentMarkUpdate
      }),
      CitationMark,
    ],
    content: '',
    enableContentCheck: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // Attach referenceManager to editor when both are available
  useEffect(() => {
    if (editor && referenceManager) {
      editor.referenceManager = referenceManager;
    }
  }, [editor, referenceManager]);

  useEffect(() => {
    const loadNotebooks = async () => {
      if (selectedRepo) {
        try {
          // Format repository as "owner/repo"
          const repository = `${selectedRepo.owner.login}/${selectedRepo.name}`;
          const notebookList = await fetchNotebooksInRepo(repository);
          setNotebooks(notebookList);
          
          if (filePath && !ipynb) {
            // If filePath exists in the list, load it
            if (notebookList.includes(filePath)) {
              handleLoadFile(filePath);
            }
          } else if (notebookList.length > 0 && !ipynb) {
            // No filePath or not found - set first notebook as default
            setFilePath(notebookList[0]);
          }
        } catch (err) {
          setError('Failed to load notebooks');
          console.error('Error loading notebooks:', err);
        }
      }
    };
    loadNotebooks();
  }, [selectedRepo]);

  useEffect(() => {
    if (filePath && selectedRepo && !ipynb) {
      handleLoadFile(filePath);
    }
  }, [filePath, selectedRepo]);

 const onLoadFile = async () => {
    try {
      await handleLoadFile();
    } catch (error) {
      setError(error.message);
    }
  }

  const onSaveFileClick = async () => {
    if (!editor) return;
    try {
      await handleSaveFile(editor);
    } catch (error) {
      setError(error.message);
    }
  }

  // Determine if it's an error message by checking the content of saveMessage
  const isError = saveMessage && saveMessage.toLowerCase().includes('error');

  useEffect(() => {
    if (editor && ipynb) {
      // Use requestAnimationFrame to schedule the update outside of React's rendering cycle
      requestAnimationFrame(() => {
        try {
          ipynbToTiptapDoc(ipynb, editor);
        } catch (err) {
          setError(err.message);
        }
      });
    }
  }, [editor, ipynb]);

  // Handle editor cleanup
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  useEffect(() => {
    if (editor) {
      // Object.entries(citationCommands).forEach(([name, command]) => {
      //   editor.commands[name] = command;
      // });
    }
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="app-container">
      {saveMessage && (
        <div className={`notification ${isError ? 'error' : ''}`}>
          {saveMessage}
        </div>
      )}
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-title-R">R</h1> <h1 className="header-title">esolve</h1> <h2>(Beta)</h2>
          
            <div className="file-controls">
              <select
                value={selectedRepo?.fullName || ''}
                onChange={(e) => {
                  const repo = repositories.find(r => r.fullName === e.target.value);
                  setSelectedRepo(repo);
                }}
                className="repo-select glass-select"
              >
                <option value="">Select Repository</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName}
                  </option>
                ))}
              </select>

              {selectedRepo && (
                <select
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="repo-select glass-select"
                >
                  <option value="">Select a notebook</option>
                  {notebooks.map((notebook) => (
                    <option key={notebook} value={notebook}>
                      {notebook}
                    </option>
                  ))}
                </select>
              )}

              <button className="glass-button" onClick={onLoadFile}>
                Load Notebook
              </button>
              <button className="glass-button" onClick={onSaveFileClick}>
                Save Notebook
              </button>
            </div>
        </div>
        {editor && <EditorToolbar editor={editor} selectedRepo={selectedRepo} filePath={filePath} />}
      </header>

      <main className="app-main flex-grow overflow-y-auto">
        <div className="content-container">
          <div className="editor-with-sidebar">
            <div className="editor-container">
              {editor?.isEditable && editor?.view && <EditorBubbleMenuManager editor={editor} />}
              <div className="editor-main">
                <div className="editor-content-container">
                  <EditorContent editor={editor} />
                  <div className="references-container">
                    <ReferencesList references={referenceManager?.getReferences()} />
                  </div>
                </div>
              </div>
            </div>
            {editor && <CommentsSidebar editor={editor} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditorWrapper;
