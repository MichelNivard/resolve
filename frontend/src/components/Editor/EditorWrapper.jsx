import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from 'tiptap-math';
import 'katex/dist/katex.min.css';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { BibMention } from '../Citation/bibMention';
import EditorBubbleMenuManager from './EditorBubbleMenuManager';
import './TrackChangesBubble.css';
import './TableStyles.css';
import { TrackChangeExtension } from '../../utils/TrackChanges';
import { CommentMark } from '../../utils/CommentMark';
import { RawCell } from '../../rawCell';
import '../../rawCell.css'
import { CodeCell } from '../../codeCell';
import { suggestionFactory } from '../Citation/suggestion';
import { ipynbToTiptapDoc } from '../../utils/notebookConversionUtils';
import EditorToolbar from './EditorToolbar';
import { CommentsSidebar } from '../Comments/CommentsSidebar';
import LoginButton from '../Auth/LoginButton';
import { citationCommands } from '../Citation/citationCommands';
import './EditorContent.css';
import { fetchNotebooksInRepo } from '../../utils/api';

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
  extensions
}) => {
  const [showComments, setShowComments] = useState(false);
  const [notebooks, setNotebooks] = useState([]);

  const editor = useEditor({
    extensions: extensions || [
      StarterKit,
      RawCell.configure({
        // Remove handleClick configuration since we're handling it in the node view
      }),
      CodeCell,
      Underline,
      Highlight,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TrackChangeExtension.configure({
        enabled: false,
        onStatusChange: (enabled) => {
          console.log('Track changes status:', enabled);
        }
      }),
      CommentMark.configure({
        HTMLAttributes: {
          class: 'comment-mark',
        },
        onUpdate: () => {
          console.log('Comment mark updated');
        }
      }),
      Mathematics,
      BibMention.configure({
        suggestion: suggestionFactory(referenceManager)
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  useEffect(() => {
    const loadNotebooks = async () => {
      if (selectedRepo?.fullName) {
        try {
          console.log('Loading notebooks for repository:', selectedRepo.fullName);
          const notebookList = await fetchNotebooksInRepo(selectedRepo.fullName);
          console.log('Loaded notebooks:', notebookList);
          setNotebooks(notebookList);
          // Only clear the file path if we successfully loaded notebooks
          if (notebookList && notebookList.length > 0) {
            setFilePath('');
          }
        } catch (error) {
          console.error('Failed to load notebooks:', error);
          // Don't clear notebooks on error to maintain existing state
        }
      }
    };

    loadNotebooks();
  }, [selectedRepo, setFilePath]);

  const onLoadFile = async () => {
    try {
      await handleLoadFile();
    } catch (error) {
      console.error('Error loading file:', error);
    }
  }

  const onSaveFileClick = async () => {
    if (!editor) return;
    try {
      await handleSaveFile(editor);
    } catch (error) {
      console.error('Error saving file:', error);
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
          console.error('Error converting ipynb to Tiptap doc:', err);
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
      Object.entries(citationCommands).forEach(([name, command]) => {
        editor.commands[name] = command;
      });
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
          <h1 className="header-title">Ipynb Editor</h1>
          <div>
            <div className="file-controls">
              <select
                value={selectedRepo?.fullName || ''}
                onChange={(e) => {
                  console.log('Repositories:', repositories);
                  const repo = repositories.find(r => r.fullName === e.target.value);
                  console.log('Selected repo:', repo);
                  setSelectedRepo(repo);
                }}
                className="repo-select glass-select"
              >
                <option value="">Select Repository</option>
                {repositories.map((repo) => {
                  console.log('Repository option:', repo);
                  return (
                    <option key={repo.id} value={repo.fullName}>
                      {repo.fullName}
                    </option>
                  );
                })}
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
        </div>
        {editor && <EditorToolbar editor={editor} />}
      </header>

      <main className="app-main flex-grow overflow-y-auto">
        <div className="content-container">
          <div className="editor-with-sidebar">
            <div className="editor-container">
              {editor?.isEditable && editor?.view && <EditorBubbleMenuManager editor={editor} />}
              <div className="editor-main">
                <div className="editor-content-container">
                  <EditorContent editor={editor} />
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
