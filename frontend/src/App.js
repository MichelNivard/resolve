import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { fetchNotebook, fetchRepositories, fetchUser } from './utils/api';
import { tiptapDocToIpynb } from './utils/notebookConversionUtils';
import { saveToGitHub } from './utils/savetoGitHub';
import { getCurrentTime, get30MinutesAgo } from './utils/timeUtils';
import './styles/main.css';
import 'katex/dist/katex.min.css';
import EditorWrapper from './components/Editor/EditorWrapper';
import WarningBanner from './components/WarningBanner';
import LoginButton from './components/Auth/LoginButton';
import { GitHubReferenceManager } from './utils/GitHubReferenceManager';
import { useParams, useLocation } from 'react-router-dom';

// Import TipTap extensions
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Mathematics from 'tiptap-math';

// Import custom extensions
import { RawCell } from './cells/rawCell';
import { CodeCell } from './cells/codeCell';
import { TrackChangeExtension } from './utils/TrackChanges';
import { CommentMark } from './utils/CommentMark';
import { CitationMark } from './components/Citation/CitationMark';

function App() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { owner, repo } = useParams();
  const location = useLocation();
  const [betaCodeVerified, setBetaCodeVerified] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [filePath, setFilePath] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [ipynb, setIpynb] = useState(null);
  const [referenceManager, setReferenceManager] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [editorExtensions, setEditorExtensions] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [commentMarkKey, setCommentMarkKey] = useState(0);

  useEffect(() => {
    const loadRepositories = async () => {
      if (isAuthenticated) {
        try {
          const repos = await fetchRepositories();
          const validRepos = repos.filter(repo => repo.fullName && repo.owner?.login);
          setRepositories(validRepos);
          if (validRepos.length > 0) {
            setSelectedRepo(validRepos[0]);
          }
        } catch (error) {
          console.error('Error loading repositories:', error);
          setSaveMessage('Error loading repositories');
          setTimeout(() => setSaveMessage(''), 3000);
        }
      }
    };
    loadRepositories();
  }, [isAuthenticated]);

  // Update editor extensions when reference manager changes
  useEffect(() => {
    if (referenceManager) {
      console.log('🔄 Creating editor extensions with reference manager');
      setEditorExtensions([
        StarterKit,
        RawCell,
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
          onStatusChange: handleTrackChangesToggle
        }),
        CommentMark.configure({
          HTMLAttributes: {
            class: 'comment-mark',
          },
          onUpdate: handleCommentMarkUpdate
        }),
        Mathematics,
        CitationMark,
      ]);
    }
  }, [referenceManager]);

  useEffect(() => {
    if (!ipynb?.metadata?.active_editors || !isAuthenticated || !user || !filePath || !selectedRepo?.fullName) return;

    const cleanup = () => {
      const thirtyMinutesAgo = get30MinutesAgo();
      const updatedEditors = ipynb.metadata.active_editors.filter(
        editor => editor.timestamp > thirtyMinutesAgo
      );
      if (updatedEditors.length < ipynb.metadata.active_editors.length) {
        const updatedIpynb = { ...ipynb };
        updatedIpynb.metadata.active_editors = updatedEditors;
        saveToGitHub(updatedIpynb, filePath, selectedRepo, user)
          .catch(error => console.error('Error cleaning up old editors:', error));
      }
    };

    const intervalId = setInterval(cleanup, 60000); // Run every minute
    return () => clearInterval(intervalId);
  }, [ipynb, isAuthenticated, user, filePath, selectedRepo]);

  // Handle shared document URLs
  useEffect(() => {
    const handleSharedDocumentAccess = async () => {
      if (owner && repo && isAuthenticated) {
        try {
          console.log('Handling shared document access:', { owner, repo });
          const result = await handleSharedDocument(owner, repo, location.pathname.split('/').slice(4).join('/') || '');
          
          if (result.hasInvitation) {
            // Show invitation UI
            const confirmed = window.confirm(`Accept invitation to collaborate on ${owner}/${repo}?`);
            if (confirmed) {
              const notebook = await result.accept();
              setIpynb(notebook);
              setSelectedRepo({ fullName: `${owner}/${repo}`, owner: { login: owner }, name: repo });
            }
          } else if (result.document) {
            // Document is already accessible
            setIpynb(result.document);
            setSelectedRepo({ fullName: `${owner}/${repo}`, owner: { login: owner }, name: repo });
          }
        } catch (error) {
          console.error('Error handling shared document:', error);
          // Show error UI
          setSaveMessage('Error accessing shared document: ' + (error.response?.data?.error || error.message));
        }
      }
    };
    
    handleSharedDocumentAccess();
  }, [owner, repo, isAuthenticated]);

  const checkLastEditor = (notebook) => {
    if (!notebook?.metadata?.last_editor) return null;
    const lastEdit = new Date(notebook.metadata.last_editor.timestamp);
    const now = new Date(getCurrentTime());
    const diffMinutes = (now - lastEdit) / (1000 * 60);
    if (diffMinutes <= 30) {
      return notebook.metadata.last_editor;
    }
    return null;
  };

  const handleLoadFile = async () => {
    if (!filePath) {
      setSaveMessage('Please enter a file path');
      return;
    }
    if (!isAuthenticated) {
      setSaveMessage('Please log in first');
      return;
    }
    if (!selectedRepo) {
      setSaveMessage('Please select a repository');
      return;
    }
    if (!selectedRepo.owner?.login || !selectedRepo.fullName) {
      setSaveMessage('Invalid repository format');
      return;
    }
    if (!user) {
      setSaveMessage('User data not loaded yet');
      return;
    }

    try {
      console.log('Loading notebook with:', {
        filePath,
        repo: selectedRepo.fullName,
        owner: selectedRepo.owner.login
      });

      const notebook = await fetchNotebook(filePath, selectedRepo.fullName);
      if (!notebook.metadata) {
        notebook.metadata = {};
      }
      if (!notebook.metadata.active_editors) {
        notebook.metadata.active_editors = [];
      }

      const thirtyMinutesAgo = get30MinutesAgo();
      notebook.metadata.active_editors = notebook.metadata.active_editors.filter(
        editor => editor.timestamp > thirtyMinutesAgo
      );

      const existingEditorIndex = notebook.metadata.active_editors.findIndex(
        editor => editor.name === (user.name || user.login)
      );

      if (existingEditorIndex === -1) {
        notebook.metadata.active_editors.push({
          name: user.name || user.login,
          avatar_url: user.avatar_url,
          timestamp: getCurrentTime()
        });
      } else {
        notebook.metadata.active_editors[existingEditorIndex].timestamp = getCurrentTime();
      }

      await saveToGitHub(notebook, filePath, selectedRepo, user);

      setIpynb(notebook);

      const manager = new GitHubReferenceManager(
        null,  // token is not needed since we're using session auth
        selectedRepo.fullName,
        filePath,
        selectedRepo.owner.login
      );
      await manager.init();
      setReferenceManager(manager);

      setSaveMessage('File and references loaded successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error loading file or references:', error);
      if (error.response?.status === 404) {
        setSaveMessage('File not found');
      } else {
        setSaveMessage(`Error loading file: ${error.message}`);
      }
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const onSaveFile = async (editor) => {
    if (!ipynb) {
      console.warn('No ipynb file available.');
      return;
    }
    if (!editor) {
      console.warn('No editor instance available.');
      return;
    }
    if (!isAuthenticated || !user?.login) {
      console.error('No authentication information available');
      return;
    }
    if (!selectedRepo) {
      console.error('No repository selected');
      return;
    }

    try {
      const newIpynb = tiptapDocToIpynb(editor, ipynb);
      console.log('Save result:', newIpynb);
      const result = await saveToGitHub(newIpynb, filePath, selectedRepo, user);
      console.log('Save result:', result);

      setSaveMessage('File updated successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving file:', error);
      setSaveMessage(`Error saving file: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleTrackChangesToggle = (enabled) => {
    setTrackChangesEnabled(enabled);
  };

  const handleCommentMarkUpdate = () => {
    setCommentMarkKey((prev) => prev + 1);
  };

  const verifyBetaCode = () => {
    if (betaCode === 'beta-test-crash-dummy') {
      setBetaCodeVerified(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyBetaCode();
    }
  };

  return (
    <div className="App">
      <WarningBanner editors={ipynb?.metadata?.active_editors} currentUser={user} />
      {!isAuthenticated ? (
        <div className="login-container">
          <div className="login-card">
          {!betaCodeVerified ? (
              
              <form className="beta-test-form" onSubmit={(e) => e.preventDefault()}>
                <p>Welcome Resolve is in preview testing, for a beta code reach out to Michel Nivard (find me on bluesky or GitHub). Please enter the beta test code to continue</p>
                <input
                  type="text"
                  className="beta-test-input"
                  value={betaCode}
                  onChange={(e) => setBetaCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter beta test code"
                  autoFocus
                />
                <button
                  type="button"
                  className="beta-confirm-button"
                  onClick={verifyBetaCode}
                >
                  Confirm
                </button>
              </form>
            ) : (
            
              <LoginButton />
            )}
            
          </div>
        </div>
      ) : (
        <>
          <EditorWrapper
            referenceManager={referenceManager}
            filePath={filePath}
            setFilePath={setFilePath}
            ipynb={ipynb}
            setIpynb={setIpynb}
            handleLoadFile={handleLoadFile}
            handleSaveFile={onSaveFile}
            saveMessage={saveMessage}
            repositories={repositories}
            selectedRepo={selectedRepo}
            setSelectedRepo={setSelectedRepo}
            extensions={editorExtensions}
          />
        </>
      )}
    </div>
  );
}

export default App;
