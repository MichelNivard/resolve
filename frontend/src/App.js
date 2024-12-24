import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { fetchNotebook, fetchRepositories, fetchUser } from './utils/api';
import { tiptapDocToIpynb } from './utils/notebookConversionUtils';
import { saveToGitHub } from './utils/savetoGitHub';
import { getCurrentTime, get30MinutesAgo } from './utils/timeUtils';
import './App.css';
import EditorWrapper from './components/Editor/EditorWrapper';
import WarningBanner from './components/WarningBanner';
import LoginButton from './components/Auth/LoginButton';
import { GitHubReferenceManager } from './utils/GitHubReferenceManager';
import { suggestionFactory } from './components/Citation/suggestion';
import 'katex/dist/katex.min.css';

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
import { RawCell } from './rawCell';
import { CodeCell } from './codeCell';
import { TrackChangeExtension } from './utils/TrackChanges';
import { CommentMark } from './utils/CommentMark';
import { BibMention } from './components/Citation/bibMention';

function App() {
  const { token } = useContext(AuthContext);
  const [filePath, setFilePath] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [ipynb, setIpynb] = useState(null);
  const [referenceManager, setReferenceManager] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [editorExtensions, setEditorExtensions] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [user, setUser] = useState({});

  useEffect(() => {
    const loadRepositories = async () => {
      if (token) {
        try {
          const repos = await fetchRepositories(token);
          console.log('Loaded repositories:', repos);
          
          // Filter and set repositories
          const validRepos = repos.filter(repo => repo.fullName && repo.owner?.login);
          setRepositories(validRepos);
          
          // If user has valid repositories, select the first one by default
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
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await fetchUser(token);
          setUser(userData);
        } catch (error) {
          console.error('Error loading user:', error);
        }
      }
    };
    loadUser();
  }, [token]);

  // Update editor extensions when reference manager changes
  useEffect(() => {
    if (referenceManager) {
      console.log('🔄 Creating editor extensions with reference manager');
      const suggestion = suggestionFactory(referenceManager);
      
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
          suggestion,
          onBeforeCreate: () => {
            console.log('BibMention: reference manager state:', referenceManager);
          }
        }),
      ]);
    }
  }, [referenceManager]);

  useEffect(() => {
    if (!ipynb?.metadata?.active_editors || !token || !user || !filePath || !selectedRepo?.fullName) return;

    const cleanup = () => {
      const thirtyMinutesAgo = get30MinutesAgo();
      
      const updatedEditors = ipynb.metadata.active_editors.filter(
        editor => editor.timestamp > thirtyMinutesAgo
      );

      // Only save if we actually removed someone
      if (updatedEditors.length < ipynb.metadata.active_editors.length) {
        const updatedIpynb = { ...ipynb };
        updatedIpynb.metadata.active_editors = updatedEditors;
        saveToGitHub(updatedIpynb, filePath, token, selectedRepo.fullName, user)
          .catch(error => console.error('Error cleaning up old editors:', error));
      }
    };

    const intervalId = setInterval(cleanup, 60000); // Run every minute
    return () => clearInterval(intervalId);
  }, [ipynb, token, user, filePath, selectedRepo]);

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
    if (!token) {
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

      // Load the notebook
      const notebook = await fetchNotebook(filePath, token, selectedRepo.fullName);
      console.log('Loaded notebook metadata:', notebook.metadata);
      
      // Initialize metadata if needed
      if (!notebook.metadata) {
        notebook.metadata = {};
      }
      if (!notebook.metadata.active_editors) {
        notebook.metadata.active_editors = [];
      }

      // Clean up old editors
      const thirtyMinutesAgo = get30MinutesAgo();
      notebook.metadata.active_editors = notebook.metadata.active_editors.filter(
        editor => editor.timestamp > thirtyMinutesAgo
      );

      // Add current user to editors if not already present
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
        // Update timestamp for existing editor
        notebook.metadata.active_editors[existingEditorIndex].timestamp = getCurrentTime();
      }

      console.log('Updated notebook metadata:', notebook.metadata);

      // Save the updated notebook back to GitHub
      await saveToGitHub(notebook, filePath, token, selectedRepo.fullName, user);
      console.log('Saved notebook with updated editors');
      
      setIpynb(notebook);

      // Initialize reference manager
      console.log('🔄 Initializing reference manager for notebook:', {
        filePath,
        repo: selectedRepo.fullName,
        owner: selectedRepo.owner.login
      });

      const manager = new GitHubReferenceManager(
        token,
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
    if (!token || !user?.login) {
      console.error('No token or user information available');
      return;
    }
    if (!selectedRepo) {
      console.error('No repository selected');
      return;
    }

    try {
      const newIpynb = tiptapDocToIpynb(editor, ipynb);
      const result = await saveToGitHub(newIpynb, filePath, token, selectedRepo.fullName, user);
      console.log('Save result:', result);

      setSaveMessage('File updated successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving file:', error);
      setSaveMessage(`Error saving file: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="App">
      <WarningBanner editors={ipynb?.metadata?.active_editors} currentUser={user} />
      <EditorWrapper
        token={token}
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
    </div>
  );
}

export default App;
