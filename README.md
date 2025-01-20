# Resolve: A WYSIWYG Jupyter Notebook Editor with GitHub Integration

This is Resolve, a modern WYSIWYG Jupyter Notebook Editor with GitHub Integration. The core goal is to provide a single-page application that allows users to edit notebooks hosted on GitHub, with minimal infrastructure costs. Authentication is handled through GitHub OAuth, the backend runs on serverless functions, and all files are stored in GitHub repositories.

## Table of Contents

- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Process Flows](#process-flows)
- [Technical Architecture](#technical-architecture)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Key Features

- **GitHub Integration**
  - Direct repository access and file management
  - Version control through GitHub
  - OAuth-based authentication
  
- **Rich Text Editing**
  - WYSIWYG markdown editing
  - Math equation support
  - Integrated citation support (provide doi, .bib gets updated)


- **Collaboration Tools**
  - Real-time editor presence detection
  - Track changes with accept/reject functionality
  - Inline commenting system
  - Citation management with BibTeX support


## Project Structure

```
/
├── backend/
│   ├── api/
│   │   ├── auth.js                 # GitHub OAuth implementation
│   │   ├── bibliography/
│   │   │   ├── load.js            # Load BibTeX files
│   │   │   └── save.js            # Save BibTeX files
│   │   ├── fetchFile.js           # File retrieval
│   │   ├── saveFile.js            # File saving
│   │   ├── getRepositories.js     # Repository listing
│   │   ├── listNotebooks.js       # Notebook listing
│   │   └── user.js                # User operations
│   └── middleware/
│       └── security.js            # Security middleware
├── frontend/
│   ├── src/
│   │   ├── cells/                 # Cell type implementations
│   │   │   ├── codeCell.js        # Code cell logic
│   │   │   ├── markdownCell.js    # Markdown cell logic
│   │   │   └── rawCell.js         # Raw cell logic
│   │   ├── components/            # React components
│   │   │   ├── Auth/              # Authentication components
│   │   │   │   └── LoginButton.js # GitHub login button
│   │   │   ├── Citation/          # Citation management
│   │   │   ├── Comments/          # Commenting system
│   │   │   └── Editor/            # Notebook editing components
│   │   ├── contexts/              # React context providers
│   │   │   └── AuthContext.js     # Authentication context
│   │   ├── styles/                # CSS styling
│   │   │   ├── base/              # Base styles and variables
│   │   │   ├── components/        # Component-specific styles
│   │   │   └── layouts/           # Layout styles
│   │   └── utils/                 # Utility functions
│   │       ├── api.js             # API interaction utilities
│   │       ├── GitHubReferenceManager.js # GitHub reference handling
│   │       ├── ipynbUtils.js      # Notebook file utilities
│   │       └── markdownConverter.js # Markdown conversion utilities
│   ├── package.json               # Frontend dependencies
│   └── public/                    # Public assets
└── README.md                      # Project documentation
```


## Process Flows

### File Opening Flow
1. User selects repository (`App.js` → `getRepositories.js`)
2. System loads available notebooks (`listNotebooks.js`)
3. User selects notebook:
   - Frontend: `EditorWrapper.jsx` initiates load
   - Backend: `fetchFile.js` retrieves from GitHub
   - Conversion: `notebookConversionUtils.js` converts ipynb to editor format
   - Editor: `EditorWrapper.jsx` initializes with content

### File Saving Flow
1. User triggers save:
   - Frontend: `EditorToolbar.js` → `savetoGitHub.js`
   - Conversion: `notebookConversionUtils.js` converts to ipynb
   - Backend: `saveFile.js` commits to GitHub
2. Metadata update:
   - `GitHubReferenceManager.js` handles references
   - Active editors list updated

### Comment System Flow
1. User creates comment:
   - `EditorBubbleMenuManager.js` handles selection
   - `CommentMark.js` creates comment mark
   - `CommentsSidebar.js` updates UI
2. Comment storage:
   - Comments stored in notebook metadata
   - Synced during file save

### Citation Flow
1. User adds citation:
   - `CitationMark.js` handles citation insertion
   - `bibGitHub.js` manages BibTeX files
   - `doiUtils.js` handles DOI lookups
2. Bibliography management:
   - `bibliography/load.js` retrieves BibTeX
   - `bibliography/save.js` updates BibTeX file

## Technical Architecture


### Backend (Express.js Server)

- **Infrastructure**
  - Deployed on DigitalOcean droplet
  - Behind a Caddy server for automatic HTTPS.
  - Process managed by PM2 for robust deployment
  - Express.js server for scalable API handling
  - Persistent server architecture with advanced process management

- **Server Characteristics**
  - Caddy web server
    - Automatic HTTPS
    - Simple and powerful configuration
    - Reverse proxy capabilities
  - Optimized for modern web application hosting


- **Deployment Strategy**
  - PM2 Process Manager
    - Automatic process restart
    - Load balancing
    - Zero-downtime reloads
    - Comprehensive application monitoring
    - Centralized logging

- **Authentication**
  - GitHub OAuth implementation
  - Secure session management using express-session
  - File-based session storage for reliability
  - Token validation and security middleware

- **Core Capabilities**
  - Centralized API routing for:
    - GitHub authentication
    - File retrieval and saving
    - Repository and notebook listing
    - Bibliography management

- **Security Features**
  - CORS configuration with environment-specific origins
  - Helmet.js for HTTP header security
  - Rate limiting to prevent abuse
  - Secure cookie management
  - Environment-based configuration

- **Performance Considerations**
  - Modular API route structure
  - Efficient middleware for authentication and security
  - Configurable for both development and production environments

- **Session Management**
  - Encrypted session storage
  - Configurable session duration
  - Secure session secret management

- **File Operations**
  - File retrieval (`fetchFile.js`)
  - File saving (`saveFile.js`)
  - Repository listing (`getRepositories.js`)
  - Bibliography management (`bibliography/*.js`)

### Frontend
- **Core Editor**
  - TipTap-based editor integration
  - Custom cell types:
    - Code cells (`codeCell.js`)
    - Markdown cells (`markdownCell.js`)
    - Raw cells (`rawCell.js`)

- **Collaboration Features**
  - Track changes (`TrackChanges.js`)
  - Comments system (`CommentMark.js`, `CommentsSidebar.js`)
  - Editor presence (`WarningBanner.js`)


## Development

### Prerequisites
- Node.js 14+
- GitHub account
- Vercel account (for deployment)

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```
3. Configure environment variables
4. Start development servers:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm start
   ```

## Contributing

Contributions are welcome! 

## License

This project is licensed under the Elastic License v2 (ELv2) - see the LICENSE.md file for details.
