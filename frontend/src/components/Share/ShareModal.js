import React, { useState } from 'react';
import { sendCollaborationInvite } from '../../utils/api';
import '../../styles/components/share/_modal.css';

const ShareModal = ({ isOpen, onClose, repository }) => {
  const [username, setUsername] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInvite = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sendCollaborationInvite(username, repository);
      setShareLink(result.shareLink);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const shareText = `Hi, I'd like to collaborate with you on a document in Resolve. Click this link to join: ${shareLink}`;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Share Document</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="input-group">
            <label htmlFor="username">GitHub Username or Email</label>
            <input
              id="username"
              type="text"
              placeholder="Enter GitHub username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <button 
            className="invite-button"
            onClick={handleInvite}
            disabled={isLoading || !username}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {shareLink && (
            <div className="share-link-section">
              <h3>Share Link Generated</h3>
              <textarea 
                className="share-text"
                readOnly 
                value={shareText}
                onClick={(e) => e.target.select()}
              />
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(shareText)}
              >
                Copy Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
