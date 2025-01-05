# Resolve: a WYSIWYGJupyter Notebook Editor with GitHub Integration

This is resolve, a work in progress WYSIWYGJupyter Notebook Editor with GitHub Integration. The substantive **GOAL** is to have a single page application that allows users to edit notebooks hosted on GitHub, which can be ran and maintained on a shoestrong budget as no data is stored on server, credentialig is done trough GitHub OAuth, the backend is a set of serverless functions on vercel, and the files are stored in GitHub repositories.

## table of contents

- [Technical Documentation](#technical-documentation)
- [Project Structure](#project-structure)
- [File-by-File Documentation](#file-by-file-documentation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)


## Technical Documentation

The project is a Jupyter Notebook Editor with GitHub Integration, structured into two main directories:

- **Backend**: Express.js server with API endpoints for authentication, file management, and user operations
- **Frontend**: React-based application with advanced editing capabilities

The backend handles authentication, file operations, and user management, while the frontend provides a user-friendly interface for editing Jupyter notebooks hosted on GitHub. The gitguhb token stays only on the server whie the frontend authenticates to the backend with a session cookie. 


### Key Components

#### Backend Highlights
1. **Authentication**
   - GitHub OAuth implementation
   - Secure token management
   - HTTP-only cookie handling

2. **File Management**
   - GitHub repository file fetching
   - File saving and locking mechanisms
   - User-specific operations

#### Frontend Highlights
1. **Editor Core**
   - TipTap-based rich text editor
   - Jupyter notebook cell types (code, markdown, raw)
   - Dynamic repository and notebook selection

2. **Advanced Features**
   - Track changes
   - Inline commenting
   - Citation management
   - Syntax highlighting
   - Math equation support

### Technical Capabilities
- Cross-platform notebook editing
- GitHub integration
- Real-time collaboration tools
- Comprehensive text and code formatting
- Secure authentication workflow

### Technology Stack
- **Backend**: Node.js, Express.js
- **Frontend**: React, TipTap
- **Authentication**: GitHub OAuth
- **Version Control**: GitHub API integration

The documentation provides an in-depth, file-by-file breakdown of the project's technical implementation.



### Project Structure

```
/
├── backend/
│   ├── api/                    # API endpoints
│   │   ├── auth.js            # GitHub OAuth implementation
│   │   ├── fetchFile.js       # File retrieval from GitHub
│   │   ├── saveFile.js        # File saving to GitHub
│   │   ├── lockFile.js        # File locking mechanism
│   │   ├── unlockFile.js      # Lock release
│   │   ├── getToken.js        # Token management
│   │   ├── user.js            # User operations
│   │   └── getRepositories.js # Repository listing
│   ├── middleware/
│   │   └── security.js        # Security middleware
│   ├── index.js               # Express server setup
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment configuration
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/          # Authentication components
    │   │   │   └── LoginButton.js
    │   │   ├── Citation/      # Citation management
    │   │   │   ├── bibMention.js
    │   │   │   ├── citationCommands.js
    │   │   │   └── suggestion.js
    │   │   ├── Comments/      # Comment system
    │   │   │   ├── CommentsSidebar.js
    │   │   │   └── CommentDialog.js
    │   │   └── Editor/        # Editor components
    │   │       ├── EditorWrapper.jsx
    │   │       ├── EditorToolbar.js
    │   │       ├── EditorBubbleMenuManager.js
    │   │       ├── EditorContent.css
    │   │       ├── TableStyles.css
    │   │       └── TrackChangesBubble.css
    │   ├── contexts/
    │   │   └── AuthContext.js # Authentication state
    │   ├── utils/
    │   │   ├── api.js         # Backend API integration
    │   │   ├── notebookConversionUtils.js
    │   │   ├── savetoGitHub.js
    │   │   ├── GitHubReferenceManager.js
    │   │   ├── TrackChanges.js
    │   │   └── CommentMark.js
    │   ├── App.js             # Main application
    │   ├── App.css            # Main styles
    │   ├── index.js           # Application entry point
    │   ├── index.css          # Global styles
    │   ├── codeCell.js        # Code cell implementation
    │   ├── markdownCell.js    # Markdown cell implementation
    │   └── rawCell.js         # Raw cell implementation
    └── package.json           # Frontend dependencies
```

### File-by-File Documentation

#### Backend Files

### `backend/index.js`
Main Express server setup:
- Configures middleware (CORS, Helmet, Cookie Parser)
- Registers API routes
- Sets up error handling
- Initializes server on specified port

### `backend/api/auth.js`
GitHub OAuth implementation:
```javascript
// Initial OAuth request
router.get('/', (req, res) => {
  // Redirects to GitHub OAuth
});

// OAuth callback handler
router.get('/callback', async (req, res) => {
  // Exchanges code for token
  // Sets secure cookie
});
```

### `backend/api/fetchFile.js`
File retrieval from GitHub:
```javascript
router.get('/', async (req, res) => {
  // Validates token
  // Fetches file using Octokit
  // Decodes and returns content
});
```

#### Frontend Components

### `frontend/src/components/Editor/EditorWrapper.jsx`
Core editor component that integrates TipTap with Jupyter notebook functionality:
```javascript
const EditorWrapper = ({
  token, referenceManager, filePath, ipynb, ...props
}) => {
  // Editor initialization and state management
}
```

Key Features:
- Repository Selection: Dropdown to choose from available GitHub repositories
- Notebook Selection: After selecting a repository, displays a dropdown of all .ipynb files in that repository
- Dynamic UI: Switches between text input (when no repository selected) and notebook dropdown (when repository is selected)
- Auto-loading: Automatically fetches and displays the list of notebooks when a repository is selected

### File Loading Process:
1. User selects a repository from the dropdown
2. System automatically fetches all .ipynb files in the repository
3. User selects a notebook from the second dropdown
4. System loads the selected notebook content

### `frontend/src/components/Editor/EditorToolbar.js`
Rich text editing toolbar:
```javascript
const EditorToolbar = ({ editor, onToggleComments }) => {
  // Toolbar state
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  
  // Toolbar actions
  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  // ... other formatting actions
};
```
Features:
- Text formatting controls
- Table operations
- Comment management
- Track changes toggle
- Math equation support

### `frontend/src/components/Editor/EditorBubbleMenuManager.js`
Context menu for selected text:
- Format selection
- Add comments
- Insert citations
- Table cell operations

### `frontend/src/components/Citation/bibMention.js`
Citation management:
- BibTeX parsing
- Citation insertion
- Reference formatting
- Citation suggestions

### `frontend/src/contexts/AuthContext.js`
Authentication state management:
```javascript
const AuthContext = createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {}
});
```

### `frontend/src/utils/notebookConversionUtils.js`
Notebook format conversion:
- IPython → TipTap conversion
- TipTap → IPython conversion
- Cell type handling
- Metadata preservation

### `frontend/src/utils/TrackChanges.js`
Change tracking extension:
- Edit tracking
- Change visualization
- Change acceptance/rejection
- Change history

### `frontend/src/utils/CommentMark.js`
Comment system implementation:
- Comment insertion
- Comment rendering
- Comment thread management
- Comment notifications

### `frontend/src/codeCell.js`
Code cell implementation:
- Syntax highlighting
- Code execution
- Output rendering
- Cell metadata

### `frontend/src/markdownCell.js`
Markdown cell implementation:
- Markdown rendering
- Math equation support
- Image handling
- Table formatting

### `frontend/src/rawCell.js`
Raw cell implementation:
- NBConvert support
- Raw text handling
- Format preservation

### Raw Cell and YAML Handling

The editor implements sophisticated handling of raw cells, with special support for YAML headers in academic articles:

#### Raw Cell Architecture
```
RawCell/
├── rawCell.js              # Core raw cell implementation
├── rawCell.css             # Styling for raw cells
└── utils/
    ├── ipynbUtils.js      # YAML parsing and serialization
    └── notebookConversionUtils.js  # Conversion between formats
```

#### YAML Header Features
- **Dual Storage**: YAML content is stored in both parsed and formatted forms
  - `parsedYaml`: JavaScript object for programmatic access
  - `formattedYaml`: Preserves user formatting and comments
  - `content`: Raw string content for the cell

#### State Management
1. **Editing Flow**:
   - YAML content is displayed in a popup editor
   - Changes are parsed in real-time for validation
   - Both parsed and formatted versions are updated simultaneously

2. **Persistence**:
   - Formatted YAML is preserved through save/load cycles
   - Stored in cell metadata to maintain formatting
   - Fallback to auto-formatting if no formatted version exists

3. **View Modes**:
   - Edit: Shows raw YAML in formatted text editor
   - View: Renders as academic article header
   - Seamless switching between modes preserves edits

#### Implementation Details
```javascript
// Raw cell structure
{
  type: 'raw',
  content: string,          // Raw content
  isYamlHeader: boolean,    // YAML header flag
  parsedYaml: Object,      // Parsed YAML object
  formattedYaml: string,   // Formatted YAML text
  isAcademicArticle: boolean
}
```

### `frontend/src/utils/api.js`
Backend API integration:
```javascript
// Repository operations
export const fetchRepositories = async (token) => {
  // Fetches list of accessible repositories
};

// Notebook operations
export const fetchNotebooksInRepo = async (token, repository) => {
  // Fetches list of .ipynb files in repository
  // Uses GitHub API to recursively list files
  // Filters for .ipynb extension
};

export const fetchNotebook = async (path, token, repository) => {
  // Fetches specific notebook content
};
```

Key features:
- GitHub API integration
- Repository listing
- Notebook discovery and retrieval
- Error handling and validation

### Detailed Component Documentation

#### Authentication System (`/backend/api/auth.js`)

The authentication system implements GitHub OAuth 2.0 with the following flow:

1. **Initial OAuth Request** (`GET /api/auth`)
   ```javascript
   // Initiates GitHub OAuth flow
   router.get('/', (req, res) => {
     const params = {
       client_id: process.env.GITHUB_CLIENT_ID,
       redirect_uri: process.env.REDIRECT_URI,
       scope: 'repo'  // Required for repository access
     };
     res.redirect(`https://github.com/login/oauth/authorize?${params}`);
   });
   ```

2. **OAuth Callback** (`GET /api/auth/callback`)
   - Handles GitHub's response
   - Exchanges code for access token
   - Sets secure HTTP-only cookie
   - Implements error handling and logging

3. **Security Features**
   - HTTP-only cookies
   - Secure flag in production
   - Same-site cookie policy
   - Token validation



#### File Loading Path:

Starts in EditorWrapper.jsx which receives handleLoadFile as a prop
The actual implementation is in App.js where handleLoadFile does the following:
Validates required fields (filePath, token, selectedRepo)
Calls fetchNotebook(filePath, token, selectedRepo.fullName) from api.js
fetchNotebook makes a request to the backend endpoint http://localhost:3001/api/fetchFile
After loading the notebook, it initializes a GitHubReferenceManager for handling citations
Sets the loaded notebook data in the ipynb state
Updates the editor content through a useEffect hook in EditorWrapper that calls ipynbToTiptapDoc
File Saving Path:

Starts in EditorWrapper.jsx which receives handleSaveFile as a prop
The implementation in App.js has onSaveFile which:
Takes the editor instance as parameter
Validates required data (ipynb, editor, token, user, selectedRepo)
Converts the editor content back to ipynb format using tiptapDocToIpynb
Calls saveToGitHub(newIpynb, filePath, token, selectedRepo.fullName)
The saveToGitHub function in savetoGitHub.js:
Converts the notebook to a string and base64 encodes it
Checks if the file already exists in GitHub to get its SHA
Makes a PUT request to GitHub's API (/repos/${owner}/${repo}/contents/${filePath}) to create/update the file
The flow involves several key transformations:

For loading: GitHub JSON → TipTap editor format (via ipynbToTiptapDoc)
For saving: TipTap editor format → GitHub JSON (via tiptapDocToIpynb)
The application uses GitHub's API directly for file operations, with the backend server (localhost:3001) mainly handling authentication and initial file fetching. All file content is stored in GitHub repositories, not locally.


#### File Operations System

1. **File Fetching** (`/backend/api/fetchFile.js`)
   ```javascript
   router.get('/', async (req, res) => {
     const { path, repository } = req.query;
     const token = req.cookies.token;
     // Uses Octokit for GitHub API
     const octokit = new Octokit({ auth: token });
     // Fetches and decodes file content
   });
   ```

2. **File Saving** (`/backend/api/saveFile.js`)
   - Implements file locking
   - Handles concurrent edits
   - Validates file format
   - Manages GitHub commits

3. **Lock Management**
   - Prevents concurrent edits
   - Implements timeout mechanism
   - Handles lock release

#### Frontend Architecture

1. **Main Application** (`/frontend/src/App.js`)
   - Manages application state:
     ```javascript
     const [repositories, setRepositories] = useState([]);
     const [selectedRepo, setSelectedRepo] = useState(null);
     const [ipynb, setIpynb] = useState(null);
     ```
   - Handles GitHub integration
   - Manages editor extensions

2. **Editor Implementation**
   - Based on TipTap with custom extensions:
     ```javascript
     const editorExtensions = [
       StarterKit,
       RawCell.configure({
         // Raw cell configuration
       }),
       CodeCell.configure({
         // Code cell configuration
       }),
       Table.configure({
         resizable: true,
       }),
       TrackChangeExtension.configure({
         enabled: false,
         // Track changes configuration
       }),
       CommentMark.configure({
         // Comment configuration
       }),
       MathExtension,
       BibMention.configure({
         // Citation configuration
       })
     ];
     ```

3. **Cell Types**
   - Code cells with syntax highlighting
   - Markdown cells with math support
   - Raw cells for metadata

### CSS Architecture

The project's styling system is organized into several key CSS files, each serving a specific purpose:

#### Global Styles

1. **`src/index.css`** (1.5KB)
   - Root variables and theme colors
   - Global reset styles
   - Base typography settings
   - Common utility classes

2. **`src/App.css`** (6.8KB)
   - Application-wide layouts
   - Common component styles
   - Responsive design rules
   - Animation definitions

#### Component-Specific Styles

3. **`src/components/Editor/EditorContent.css`** (9.1KB)
   - Notebook cell styling
   - Code syntax highlighting
   - Markdown rendering styles
   - Math equation formatting
   - Table layouts within cells

4. **`src/components/Editor/EditorToolbar.css`** (3.1KB)
   - Toolbar button styles
   - Dropdown menus
   - Tool icons and hover states
   - Toolbar responsiveness

5. **`src/components/Editor/TableStyles.css`** (2.2KB)
   - Table creation and editing
   - Cell resizing controls
   - Table borders and spacing
   - Column/row management

6. **`src/components/Comments/CommentsSidebar.css`** (5.6KB)
   - Comment thread layouts
   - Comment cards and bubbles
   - Thread collapsing animations
   - Sidebar responsiveness

7. **`src/components/Editor/TrackChangesBubble.css`** (1KB)
   - Change tracking UI
   - Revision markers
   - Accept/reject buttons
   - Change highlight styles

#### Third-Party Integrations

8. **PrismJS Themes**
   - Code syntax highlighting
   - Multiple theme options (dark, light, etc.)
   - Language-specific formatting

9. **Sanitize.css**
   - Cross-browser consistency
   - Modern CSS reset
   - Typography normalization
   - Form element standardization

#### CSS Organization Principles

1. **Scoping**
   - Component styles are scoped to their specific components
   - Global styles are minimized and carefully managed
   - BEM naming convention used for clarity

2. **Variables**
   ```css
   :root {
     /* Colors */
     --primary-color: #1a73e8;
     --secondary-color: #5f6368;
     --background-color: #ffffff;
     
     /* Typography */
     --font-family-code: 'Source Code Pro', monospace;
     --font-family-text: 'Roboto', sans-serif;
     
     /* Spacing */
     --spacing-unit: 8px;
     --content-width: 960px;
   }
   ```

3. **Responsive Design**
   ```css
   /* Mobile-first approach */
   .editor-container {
     width: 100%;
     padding: var(--spacing-unit);
   }

   /* Tablet breakpoint */
   @media (min-width: 768px) {
     .editor-container {
       padding: calc(var(--spacing-unit) * 2);
     }
   }

   /* Desktop breakpoint */
   @media (min-width: 1024px) {
     .editor-container {
       max-width: var(--content-width);
       margin: 0 auto;
     }
   }
   ```

4. **Performance Considerations**
   - CSS selectors are kept simple to optimize rendering
   - Heavy animations are limited to transform and opacity
   - Critical CSS is inlined for faster initial load
   - Media queries are strategically placed

5. **Maintainability**
   - Each component has its own CSS file
   - Shared styles are extracted to common files
   - Variables used for consistent theming
   - Comments document complex selectors

#### File Size Distribution
```
EditorContent.css    9.1KB  (Main editor styling)
App.css             6.8KB  (Global application styles)
CommentsSidebar.css 5.6KB  (Comment system UI)
EditorToolbar.css   3.1KB  (Editor controls)
TableStyles.css     2.2KB  (Table formatting)
index.css           1.5KB  (Base styles)
TrackChanges.css    1.0KB  (Revision tracking UI)
```

This architecture ensures styles are modular, maintainable, and performant while providing a consistent user experience across the application.

### Information Flow

#### 1. Authentication Flow
Detailed sequence:
```
1. User clicks login
   → LoginButton.js triggers auth flow
   → Redirects to /api/auth

2. GitHub OAuth
   → auth.js initiates OAuth
   → User approves on GitHub
   → Callback to /api/auth/callback
   → Token stored in HTTP-only cookie

3. Post-authentication
   → AuthContext.js updates state
   → App.js receives auth state
   → Enables editor features
```

#### 2. File Operations Flow
Detailed sequence:
```
1. File Loading
   → User selects repository/file
   → fetchFile.js retrieves content
   → notebookConversionUtils.js converts to TipTap
   → EditorWrapper.jsx updates editor state

2. File Saving
   → User triggers save
   → notebookConversionUtils.js converts to IPynb
   → saveFile.js handles GitHub commit
   → Updates file state
```

#### 3. Editor Operations Flow
```
1. Text Editing
   → User interacts with EditorToolbar.js
   → TipTap commands execute
   → EditorWrapper.jsx updates state

2. Citations
   → bibMention.js handles citation insert
   → suggestion.js provides autocomplete
   → GitHubReferenceManager.js manages references

3. Comments
   → CommentMark.js tracks comment locations
   → CommentsSidebar.js displays threads
   → CommentDialog.js handles interactions
```

### Implementation Details

#### 1. Editor Implementation
The editor is built on TipTap with custom extensions:
```javascript
const editor = useEditor({
  extensions: [
    StarterKit,
    RawCell.configure({
      // Raw cell configuration
    }),
    CodeCell.configure({
      // Code cell configuration
    }),
    Table.configure({
      resizable: true,
    }),
    TrackChangeExtension.configure({
      enabled: false,
      // Track changes configuration
    }),
    CommentMark.configure({
      // Comment configuration
    }),
    MathExtension,
    BibMention.configure({
      // Citation configuration
    })
  ]
});
```

#### 2. Cell Types Implementation
Each cell type has specific handling:

1. **Code Cells** (`codeCell.js`):
   ```javascript
   export const CodeCell = Node.create({
     name: 'codeCell',
     group: 'block',
     content: 'inline*',
     // Code cell specific attributes
   });
   ```

2. **Markdown Cells** (`markdownCell.js`):
   ```javascript
   export const MarkdownCell = Node.create({
     name: 'markdownCell',
     group: 'block',
     content: 'block+',
     // Markdown cell specific attributes
   });
   ```

3. **Raw Cells** (`rawCell.js`):
   ```javascript
   export const RawCell = Node.create({
     name: 'rawCell',
     group: 'block',
     content: 'text*',
     // Raw cell specific attributes
   });
   ```

#### 3. Data Conversion Implementation
Notebook conversion logic:

```javascript
// IPython to TipTap
export const ipynbToTiptapDoc = (ipynb, editor) => {
  // Convert cells to TipTap nodes
  const content = ipynb.cells.map(cell => {
    switch(cell.cell_type) {
      case 'code':
        return createCodeCell(cell);
      case 'markdown':
        return createMarkdownCell(cell);
      case 'raw':
        return createRawCell(cell);
    }
  });
  
  editor.commands.setContent(content);
};

// TipTap to IPython
export const tiptapDocToIpynb = (editor) => {
  const content = editor.getJSON();
  return {
    cells: content.content.map(node => {
      switch(node.type) {
        case 'codeCell':
          return convertToCodeCell(node);
        case 'markdownCell':
          return convertToMarkdownCell(node);
        case 'rawCell':
          return convertToRawCell(node);
      }
    })
  };
};
```

#### 4. Security Implementation

1. **Token Management**:
   ```javascript
   // Set secure cookie
   res.cookie('token', accessToken, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax'
   });
   ```

2. **File Operations Security**:
   ```javascript
   // Validate token before operations
   const token = req.cookies.token;
   if (!token) {
     return res.status(401).json({
       error: 'Authentication required'
     });
   }
   ```

3. **Input Validation**:
   ```javascript
   // Validate repository format
   const [owner, repo] = repository.split('/');
   if (!owner || !repo) {
     return res.status(400).json({
       error: 'Invalid repository format'
     });
   }
   ```

### Error Handling

#### 1. API Error Handling
```javascript
try {
  // API operation
} catch (error) {
  if (error.response) {
    // Handle HTTP errors
    switch (error.response.status) {
      case 401:
        return handleAuthError(error);
      case 404:
        return handleNotFoundError(error);
      default:
        return handleGenericError(error);
    }
  }
  // Handle network errors
  handleNetworkError(error);
}
```

#### 2. Editor Error Handling
```javascript
// Content conversion error handling
useEffect(() => {
  if (editor && ipynb) {
    try {
      ipynbToTiptapDoc(ipynb, editor);
    } catch (err) {
      console.error('Conversion error:', err);
      // Implement recovery strategy
    }
  }
}, [editor, ipynb]);
```

#### 3. File Operation Error Handling
```javascript
// Save operation error handling
const handleSave = async () => {
  try {
    await saveFile(content);
  } catch (error) {
    if (error.code === 'LOCK_ERROR') {
      handleLockError();
    } else if (error.code === 'NETWORK_ERROR') {
      handleNetworkError();
    } else {
      handleGenericError();
    }
  }
};
```

### Configuration

#### Backend Configuration
Required environment variables:
```
GITHUB_CLIENT_ID=          # GitHub OAuth App client ID
GITHUB_CLIENT_SECRET=      # GitHub OAuth App client secret
REDIRECT_URI=              # OAuth callback URL
PORT=3001                  # Server port
NODE_ENV=development      # Environment (development/production)
```

#### Frontend Configuration
Required environment variables:
```
REACT_APP_API_URL=        # Backend API URL
REACT_APP_GITHUB_SCOPE=   # Required GitHub permissions
```

### License

I intend to lycence ths project fairly openly, I am undicided whether to use the MIT license or a more permissive license like the Apache 2.0 license. Given I will incure hosting costs, I want t make sure the project is free to use while leaving me room to fund developmen in some way.



