import React, { useRef, useEffect, useState } from 'react';
import { 
  FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteRight, FaCode, 
  FaPalette, FaFill, FaComment, FaUndo, FaRedo,
  FaTextHeight, FaHighlighter, FaImage, 
  FaTable, FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import { BiCodeBlock } from 'react-icons/bi';
import { MdFormatClear } from 'react-icons/md';
import { RiDoubleQuotesL } from 'react-icons/ri';
import { AiOutlineSplitCells, AiOutlineInsertRowBelow } from 'react-icons/ai';
import { BsTable } from 'react-icons/bs';
import '../../styles/components/editor/_toolbar.css';
import { useAuth } from '../../contexts/AuthContext';  

const EditorToolbar = ({ editor, onToggleComments }) => {
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showBgColorMenu, setShowBgColorMenu] = useState(false);
  const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false);

  // State for the comment dialog
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');

  const headingMenuRef = useRef(null);
  const fontSizeMenuRef = useRef(null);
  const textColorMenuRef = useRef(null);
  const bgColorMenuRef = useRef(null);
  const fontFamilyMenuRef = useRef(null);

  const { user } = useAuth();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHeadingMenu && headingMenuRef.current && !headingMenuRef.current.contains(e.target)) {
        setShowHeadingMenu(false);
      }
      if (showFontSizeMenu && fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target)) {
        setShowFontSizeMenu(false);
      }
      if (showTextColorMenu && textColorMenuRef.current && !textColorMenuRef.current.contains(e.target)) {
        setShowTextColorMenu(false);
      }
      if (showBgColorMenu && bgColorMenuRef.current && !bgColorMenuRef.current.contains(e.target)) {
        setShowBgColorMenu(false);
      }
      if (showFontFamilyMenu && fontFamilyMenuRef.current && !fontFamilyMenuRef.current.contains(e.target)) {
        setShowFontFamilyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeadingMenu, showFontSizeMenu, showTextColorMenu, showBgColorMenu, showFontFamilyMenu]);

  if (!editor) return null;

  // Editor command handlers
  const handleBold = () => editor.chain().focus().toggleBold().run();
  const handleItalic = () => editor.chain().focus().toggleItalic().run();
  const handleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const handleStrikethrough = () => editor.chain().focus().toggleStrike().run();
  const handleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const handleOrderedList = () => editor.chain().focus().toggleOrderedList().run();

  // Track Changes toggle handler
  const handleToggleTrackChanges = () => {
    // Toggle the track change status using the command
    editor.commands.toggleTrackChangeStatus();

    // Get the current state of the TrackChangeExtension
    const trackChangeExtension = editor.extensionManager.extensions.find(
      ext => ext.name === 'trackchange'
    );

    // Check the current enabled status
    const isTracking = trackChangeExtension?.options.enabled;

    // Update the local state to reflect the current status
    setTrackChangesEnabled(isTracking);
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter a URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const handleClearFormatting = () => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  const handleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const handleCodeBlock = () => editor.chain().focus().toggleCodeBlock().run();
  const handleHighlight = () => editor.chain().focus().toggleHighlight().run();

  // Undo/Redo
  const handleUndo = () => editor.chain().focus().undo().run();
  const handleRedo = () => editor.chain().focus().redo().run();

  // Insert Image
  const handleInsertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Table handlers
  const handleInsertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleAddColumnBefore = () => editor.chain().focus().addColumnBefore().run();
  const handleAddColumnAfter = () => editor.chain().focus().addColumnAfter().run();
  const handleDeleteColumn = () => editor.chain().focus().deleteColumn().run();
  const handleAddRowBefore = () => editor.chain().focus().addRowBefore().run();
  const handleAddRowAfter = () => editor.chain().focus().addRowAfter().run();
  const handleDeleteRow = () => editor.chain().focus().deleteRow().run();
  const handleDeleteTable = () => editor.chain().focus().deleteTable().run();
  const handleMergeCells = () => editor.chain().focus().mergeCells().run();
  const handleSplitCell = () => editor.chain().focus().splitCell().run();
  const handleToggleHeaderColumn = () => editor.chain().focus().toggleHeaderColumn().run();
  const handleToggleHeaderRow = () => editor.chain().focus().toggleHeaderRow().run();
  const handleToggleHeaderCell = () => editor.chain().focus().toggleHeaderCell().run();

  const handleToggleComments = () => {
    if (onToggleComments) onToggleComments();
  };

  // Open comment dialog
  const handleAddCommentButton = () => {
    setCommentText('');
    setShowCommentDialog(true);
  };

  const handleCommentDialogConfirm = async () => {
    if (!commentText.trim()) {
      setShowCommentDialog(false);
      return;
    }

    // Generate a unique commentId
    const commentId = `comment-${Date.now()}`;

    try {

      const username = 'Michel Nivard'; // Extract the username from the response

      if (!editor) return;

      // Apply the comment mark with the fetched username
      editor.chain().focus().addComment({
        commentId,         // Required by CommentMark
        username,          // Dynamic GitHub username
        text: commentText.trim(), // Comment text
      }).run();

    } catch (error) {
      console.error('Error fetching username or applying comment:', error);
    } finally {
      setShowCommentDialog(false);
      setCommentText('');
    }
  };

  const handleCommentDialogCancel = () => {
    setShowCommentDialog(false);
    setCommentText('');
  };

  // Heading menu logic
  const toggleHeadingMenu = () => setShowHeadingMenu(prev => !prev);
  const applyHeading = (level) => {
    if (level) {
      editor.chain().focus().toggleHeading({ level }).run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
    setShowHeadingMenu(false);
  };

  // Font size logic (requires textStyle extension)
  const toggleFontSizeMenu = () => setShowFontSizeMenu(prev => !prev);
  const applyFontSize = (size) => {
    editor.chain().focus().setTextStyle({ fontSize: size }).run();
    setShowFontSizeMenu(false);
  };

  // Text color logic
  const toggleTextColorMenu = () => setShowTextColorMenu(prev => !prev);
  const applyTextColor = (color) => {
    editor.chain().focus().setColor(color).run();
    setShowTextColorMenu(false);
  };

  // Background color
  const toggleBgColorMenu = () => setShowBgColorMenu(prev => !prev);
  const applyBgColor = (color) => {
    editor.chain().focus().setHighlight({ color }).run();
    setShowBgColorMenu(false);
  };

  const headingLevels = [
    { label: 'Paragraph', level: null },
    { label: 'Heading 1', level: 1 },
    { label: 'Heading 2', level: 2 },
    { label: 'Heading 3', level: 3 },
    { label: 'Heading 4', level: 4 },
    { label: 'Heading 5', level: 5 },
    { label: 'Heading 6', level: 6 },
  ];

  const fontSizes = [
    { label: 'Default', size: null },
    { label: 'Small', size: '0.9em' },
    { label: 'Normal', size: '1em' },
    { label: 'Large', size: '1.2em' },
    { label: 'X-Large', size: '1.5em' },
  ];

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];
  const bgColors = ['#ffff00', '#ffeb3b', '#caffbf', '#b2fef5', '#f9c2ff', '#ffd6e0'];

  const fontFamilies = [
    { name: 'Inter', value: 'var(--editor-font-primary)' },
    { name: 'Times New Roman', value: 'var(--editor-font-times)' },
    { name: 'Helvetica', value: 'var(--editor-font-helvetica)' },
    { name: 'Georgia', value: 'var(--editor-font-georgia)' },
    { name: 'Garamond', value: 'var(--editor-font-garamond)' }
  ];

  const setFontFamily = async (fontFamily) => {
    // Check if the font is loaded
    const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').replace('var(--editor-font-', '').replace(')', '');
    try {
      await document.fonts.load(`16px ${fontName}`);
    } catch (e) {
      console.warn(`Font ${fontName} loading check failed, proceeding anyway:`, e);
    }
    
    document.documentElement.style.setProperty('--editor-current-font', fontFamily);
    setShowFontFamilyMenu(false);
  };

  const addComment = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      // No text selected
      return;
    }

    editor.chain().focus().setComment({
      comment: '',
      author: user?.name || user?.login,
      date: new Date().toISOString(),
      resolved: false
    }).run();
  };

  return (
    <div className="editor-container">
      <div className="modern-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Undo/Redo */}
        <button className="toolbar-btn" onClick={handleUndo} title="Undo"><FaUndo /></button>
        <button className="toolbar-btn" onClick={handleRedo} title="Redo"><FaRedo /></button>
        
        {/* Heading dropdown */}
        <div className="heading-dropdown" ref={headingMenuRef} style={{ position:'relative' }}>
          <button className="toolbar-btn" onClick={toggleHeadingMenu} title="Heading Levels">
            Heading ▼
          </button>
          {showHeadingMenu && (
            <div className="heading-menu" style={{ position:'absolute', background:'#fff', border:'1px solid #ccc', borderRadius:'4px', zIndex:9999, top:'100%', left:0 }}>
              {headingLevels.map((h, index) => (
                <div key={index} className="heading-item" 
                  style={{ padding:'0.5rem 1rem', cursor:'pointer' }}
                  onClick={() => applyHeading(h.level)}>{h.label}</div>
              ))}
            </div>
          )}
        </div>

        {/* Font size dropdown */}
        <div className="font-size-dropdown" ref={fontSizeMenuRef} style={{ position:'relative' }}>
          <button className="toolbar-btn" onClick={toggleFontSizeMenu} title="Font Size">
            <FaTextHeight /> ▼
          </button>
          {showFontSizeMenu && (
            <div className="font-size-menu" style={{ position:'absolute', background:'#fff', border:'1px solid #ccc', borderRadius:'4px', zIndex:9999, top:'100%', left:0 }}>
              {fontSizes.map((f, index) => (
                <div key={index} className="font-size-item" 
                  style={{ padding:'0.5rem 1rem', cursor:'pointer' }}
                  onClick={() => f.size ? applyFontSize(f.size) : editor.chain().focus().unsetTextStyle().run() }>
                  {f.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Font Family Dropdown */}
        <div className="toolbar-item" ref={fontFamilyMenuRef}>
          <button
            onClick={(e) => {
              const buttonRect = e.currentTarget.getBoundingClientRect();
              setShowFontFamilyMenu(!showFontFamilyMenu);
              // Set dropdown position after a small delay to ensure DOM is updated
              setTimeout(() => {
                const dropdown = fontFamilyMenuRef.current?.querySelector('.font-family-menu');
                if (dropdown) {
                  dropdown.style.top = `${buttonRect.bottom}px`;
                  dropdown.style.left = `${buttonRect.left}px`;
                }
              }, 0);
            }}
            className="toolbar-button"
            title="Font Family"
          >
            <span style={{ fontFamily: 'var(--ui-font)' }}>Font</span>
          </button>
          {showFontFamilyMenu && (
            <div className="dropdown-menu font-family-menu" style={{ position: 'fixed' }}>
              {fontFamilies.map((font) => (
                <button
                  key={font.name}
                  onClick={() => setFontFamily(font.value)}
                  className="dropdown-item"
                  data-font={font.name}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

            
        {/* Separator */}
        <div style={{ width:'1px', height:'24px', background:'#ddd', margin:'0 0.5rem' }}></div>


        {/* Bold / Italic / Underline / Strike / Highlight */}
        <button className="toolbar-btn" onClick={handleBold} title="Bold"><FaBold /></button>
        <button className="toolbar-btn" onClick={handleItalic} title="Italic"><FaItalic /></button>
        <button className="toolbar-btn" onClick={handleUnderline} title="Underline"><FaUnderline /></button>
        <button className="toolbar-btn" onClick={handleStrikethrough} title="Strikethrough"><FaStrikethrough /></button>
        <button className="toolbar-btn" onClick={handleHighlight} title="Highlight"><FaHighlighter /></button>

        {/* Separator */}
        <div style={{ width:'1px', height:'24px', background:'#ddd', margin:'0 0.5rem' }}></div>
        
        {/* Image */}
        <button className="toolbar-btn" onClick={handleInsertImage} title="Insert Image"><FaImage /></button>

        {/* Lists */}
        <button className="toolbar-btn" onClick={handleBulletList} title="Bulleted List"><FaListUl /></button>
        <button className="toolbar-btn" onClick={handleOrderedList} title="Numbered List"><FaListOl /></button>

        {/* Table */}
        <div className="table-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button className="toolbar-btn" onClick={handleInsertTable} title="Insert Table"><BsTable /></button>
          <button className="toolbar-btn" onClick={handleAddRowAfter} title="Add Row Below"><AiOutlineInsertRowBelow /></button>
          <button className="toolbar-btn" onClick={handleAddRowBefore} title="Add Row Above">
            <AiOutlineInsertRowBelow style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="toolbar-btn" onClick={handleDeleteRow} title="Delete Row">
            <AiOutlineInsertRowBelow style={{ transform: 'rotate(45deg)' }} />
          </button>
          <button className="toolbar-btn" onClick={handleSplitCell} title="Split Cell"><AiOutlineSplitCells /></button>
          <button className="toolbar-btn" onClick={handleMergeCells} title="Merge Cells">
            <AiOutlineSplitCells style={{ transform: 'rotate(90deg)' }} />
          </button>
          <button className="toolbar-btn" onClick={handleToggleHeaderRow} title="Toggle Header Row">H↔</button>
        </div>

        {/* Track Changes */}
        <button
          className={`track-changes-btn ${trackChangesEnabled ? 'active' : ''}`}
          onClick={handleToggleTrackChanges}
          title="Track Changes"
        >
          {trackChangesEnabled ? (
            <FaToggleOn style={{ fontSize: '1.2em', color: '#0c0' }} />
          ) : (
            <FaToggleOff style={{ fontSize: '1.2em', color: '#ccc' }} />
          )}
          <span>Track Changes</span>
        </button>

        <button
          className="toolbar-btn"
          onClick={addComment}
          title="Add Comment"
        >
          <FaComment />
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
