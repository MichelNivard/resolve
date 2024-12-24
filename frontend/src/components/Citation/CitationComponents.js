import React, { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import ReactDOM from 'react-dom';

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '400px',
    maxWidth: '600px'
  },
  searchContainer: {
    padding: '12px',
    borderBottom: '1px solid #eee'
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
  },
  list: {
    padding: '8px',
    maxHeight: '400px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  item: {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  selectedItem: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #cce0ff'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  citationKey: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#1a73e8'
  },
  title: {
    fontSize: '14px',
    color: '#333'
  },
  meta: {
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    gap: '8px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#1a73e8'
  },
  footer: {
    borderTop: '1px solid #eee',
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s'
  },
  cancelButton: {
    backgroundColor: 'transparent',
    color: '#666',
    marginRight: '8px'
  },
  selectedCount: {
    fontSize: '13px',
    color: '#666'
  }
};

// Citation Menu Component for the bubble menu
export const createCitationMenu = ({ editor, items, preSelectedCitations, command, onClose }) => {
  const CitationMenuWrapper = () => {
    const [selectedItems, setSelectedItems] = useState(new Set(preSelectedCitations || []));
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    useEffect(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, []);

    const filteredItems = items.filter(item => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        item.bibKey.toLowerCase().includes(search) ||
        item.title?.toLowerCase().includes(search) ||
        item.authors?.some(author => author.toLowerCase().includes(search)) ||
        item.year?.includes(search)
      );
    });

    const handleSubmit = () => {
      command({ citations: Array.from(selectedItems) });
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    return (
      <div style={styles.container}>
        <div style={styles.searchContainer}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search citations..."
            style={styles.searchInput}
          />
        </div>
        <div style={styles.list}>
          {filteredItems.map((item) => (
            <button
              key={item.bibKey}
              style={{
                ...styles.item,
                ...(selectedItems.has(item.bibKey) ? styles.selectedItem : {})
              }}
              onClick={() => {
                const newSelected = new Set(selectedItems);
                if (newSelected.has(item.bibKey)) {
                  newSelected.delete(item.bibKey);
                } else {
                  newSelected.add(item.bibKey);
                }
                setSelectedItems(newSelected);
              }}
            >
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={selectedItems.has(item.bibKey)}
                onChange={() => {}}
              />
              <div style={styles.content}>
                <div style={styles.citationKey}>{item.bibKey}</div>
                {item.title && <div style={styles.title}>{item.title}</div>}
                <div style={styles.meta}>
                  {item.authors && <span>{item.authors.join(', ')}</span>}
                  {item.year && <span>({item.year})</span>}
                </div>
              </div>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ padding: '12px', color: '#666', textAlign: 'center' }}>
              No matching citations found
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <div style={styles.selectedCount}>
            {selectedItems.size} citation{selectedItems.size !== 1 ? 's' : ''} selected
          </div>
          <div>
            <button
              onClick={onClose}
              style={{ ...styles.button, ...styles.cancelButton }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={styles.button}
              disabled={selectedItems.size === 0}
            >
              Insert Citations
            </button>
          </div>
        </div>
      </div>
    );
  };

  let container = null;
  let component = null;

  return {
    mount: (mountPoint) => {
      container = mountPoint;
      component = ReactDOM.render(<CitationMenuWrapper />, container);
    },
    destroy: () => {
      if (container) {
        ReactDOM.unmountComponentAtNode(container);
      }
    }
  };
};

// MentionList component for @ mentions
export const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    setSelectedIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [props.items]);

  const filteredItems = props.items.filter(item => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      item.bibKey.toLowerCase().includes(search) ||
      item.title?.toLowerCase().includes(search) ||
      item.firstAuthor?.toLowerCase().includes(search) ||
      item.year?.includes(search)
    );
  });

  const selectItem = (index) => {
    const item = filteredItems[index];
    if (item) {
      props.command(item);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((selectedIndex + filteredItems.length - 1) % filteredItems.length);
      return true;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((selectedIndex + 1) % filteredItems.length);
      return true;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      selectItem(selectedIndex);
      return true;
    }

    return false;
  };

  useImperativeHandle(ref, () => ({
    onKeyDown
  }));

  if (!filteredItems.length) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.searchContainer}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search citations..."
          style={styles.searchInput}
        />
      </div>
      <div style={styles.list}>
        {filteredItems.map((item, index) => (
          <button
            key={item.bibKey}
            style={{
              ...styles.item,
              ...(index === selectedIndex ? styles.selectedItem : {})
            }}
            onClick={() => selectItem(index)}
          >
            <div style={styles.content}>
              <div style={styles.citationKey}>{item.bibKey}</div>
              {item.title && <div style={styles.title}>{item.title}</div>}
              <div style={styles.meta}>
                {item.firstAuthor && <span>{item.firstAuthor}</span>}
                {item.year && <span>({item.year})</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
