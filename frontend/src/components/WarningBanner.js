import React from 'react';
import { getCurrentTime, isWithin30Minutes } from '../utils/timeUtils';

const WarningBanner = ({ editors, currentUser }) => {
  console.log('WarningBanner rendering with editors:', editors);

  if (!editors || editors.length === 0) return null;

  const now = new Date(getCurrentTime());
  const activeEditors = editors.filter(editor => isWithin30Minutes(editor.timestamp));

  if (activeEditors.length === 0) return null;

  const isFirstUser = activeEditors[0].name === (currentUser.name || currentUser.login);
  const otherEditors = activeEditors.filter(editor => 
    editor.name !== (currentUser.name || currentUser.login)
  );

  const renderMessage = () => {
    if (isFirstUser) {
      return `You started editing this file ${Math.round((now.getTime() - new Date(activeEditors[0].timestamp).getTime()) / (1000 * 60))} minutes ago.`;
    } else if (otherEditors.length > 0) {
      return (
        <>
          <strong>Warning:</strong> {activeEditors[0].name} and {otherEditors.length} other{otherEditors.length === 1 ? '' : 's'} have this file open. Concurrent editing will create conflicts. Feel free to read and browse.
        </>
      );
    } else {
      return (
        <>
          <strong>Warning:</strong> {activeEditors[0].name} started editing {Math.round((now.getTime() - new Date(activeEditors[0].timestamp).getTime()) / (1000 * 60))} minutes ago. This file might currently be in use.
        </>
      );
    }
  };

  return (
    <div style={{
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      color: '#856404',
      padding: '12px',
      borderRadius: '4px',
      margin: '10px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontWeight: 200
    }}>
      <div style={{ display: 'flex', marginRight: '10px' }}>
        {activeEditors.map((editor, index) => (
          <img 
            key={editor.name}
            src={editor.avatar_url} 
            alt={editor.name} 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              marginLeft: index === 0 ? 0 : '-15px',
              border: '2px solid white',
              zIndex: activeEditors.length - index
            }}
          />
        ))}
      </div>
      <span>
        {renderMessage()}
      </span>
    </div>
  );
};

export default WarningBanner;
