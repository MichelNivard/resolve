import { generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Mathematics from 'tiptap-math';
import 'katex/dist/katex.min.css';

import { parseIpynb, serializeIpynb } from './ipynbUtils';
import { markdownToHtml, htmlToMarkdown } from './markdownConverter';
import { generateHTML } from '@tiptap/html'
import { CodeCell } from '../codeCell';
import { RawCell } from '../rawCell';
import { TrackChangeExtension } from './TrackChanges';
import { CommentMark } from './CommentMark'; // import the node defined above
import { BibMention } from '../components/Citation/bibMention'

export function ipynbToTiptapDoc(ipynb, editor) {
  // Temporarily disable track changes while loading content
  const trackChangeExtension = editor.extensionManager.extensions.find(
    ext => ext.name === 'trackchange'
  );
  console.log('Found track change extension:', trackChangeExtension);
  console.log('Available marks in schema:', editor.schema.marks);
  
  const wasEnabled = trackChangeExtension?.options.enabled;
  if (wasEnabled) {
    editor.commands.setTrackChangeStatus(false);
  }

  const { cells } = parseIpynb(ipynb);
  console.log('Parsed cells from ipynb:', JSON.stringify(cells, null, 2));
  const docNodes = [];

  // Create a transaction to set content with marks preserved
  const tr = editor.state.tr;
  tr.setMeta('trackManualChanged', true); // Tell TrackChanges extension to ignore this change

  for (const cell of cells) {
    if (cell.type === 'raw') {
      docNodes.push({
        type: 'rawCell',
        attrs: { 
          content: cell.content,
          isYamlHeader: cell.isYamlHeader || false,
          parsedYaml: cell.parsedYaml || null,
          isAcademicArticle: cell.isAcademicArticle || false,
          tiptapContent: cell.tiptapContent || null
        }
      });
    } else if (cell.type === 'markdown') {
      if (cell.tiptapContent) {
        console.log('Raw tiptapContent:', JSON.stringify(cell.tiptapContent, null, 2));
        // If TipTap JSON is available, use it directly
        // Ensure marks and track changes are preserved
        const content = cell.tiptapContent.content.map((node, pos) => {
          console.log('Processing node:', JSON.stringify(node, null, 2));
          // Deep clone the node to avoid reference issues
          const processedNode = { ...node };
          
          if (node.marks && node.marks.length > 0) {
            console.log('Processing marks for node:', JSON.stringify(node.marks, null, 2));
            // Preserve and process all marks
            processedNode.marks = node.marks.map(mark => {
              console.log('Processing mark:', JSON.stringify(mark, null, 2));
              // Handle different mark types
              if (mark.type === 'comment' || mark.type === 'insertion' || mark.type === 'deletion') {
                console.log('Found mark of type:', mark.type, 'with attrs:', mark.attrs);
                // Verify the mark type exists in the schema
                const markType = editor.schema.marks[mark.type];
                if (!markType) {
                  console.error('Mark type not found in schema:', mark.type);
                  return null;
                }
                console.log('Mark type found in schema:', markType);
                
                // For comment marks, ensure all required attributes are present
                if (mark.type === 'comment') {
                  const attrs = {
                    commentId: mark.attrs.commentId || `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${pos}`,
                    username: mark.attrs.username || 'Unknown',
                    avatarUrl: mark.attrs.avatarUrl || '',
                    text: mark.attrs.text || '',
                    timestamp: mark.attrs.timestamp || new Date().toISOString(),
                    resolved: mark.attrs.resolved || false,
                    ...mark.attrs // Keep any other existing attributes
                  };
                  
                  // Create a proper comment mark
                  const commentMark = editor.schema.marks.comment.create(attrs);
                  return {
                    type: commentMark.type.name,
                    attrs: commentMark.attrs
                  };
                }
                
                return {
                  type: mark.type,
                  attrs: { ...mark.attrs }
                };
              }
              return mark;
            }).filter(Boolean); // Remove any null marks
            console.log('Processed marks:', JSON.stringify(processedNode.marks, null, 2));
          } else {
            console.log('No marks found in node');
          }
          return processedNode;
        });
        
        console.log('Processed content before adding to docNodes:', JSON.stringify(content, null, 2));
        docNodes.push(...content);
      } else {
        console.log('Raw markdown cell content:', cell.content);
        
        // Convert markdown to HTML, then to Tiptap JSON
        const html = markdownToHtml(cell.content);
        console.log('Converted markdown to HTML:', html);
        
        // Generate TipTap JSON with math extension
        const tiptapJson = generateJSON(html, [
          StarterKit,
          RawCell,
          CodeCell,
          Underline,
          Highlight,
          TrackChangeExtension,
          CommentMark,
          Mathematics,
          BibMention,
          Table.configure({
            resizable: true,
          }),
          TableRow,
          TableCell,
          TableHeader,
        ]);
        
        console.log('Generated TipTap JSON:', JSON.stringify(tiptapJson, null, 2));
        docNodes.push(...tiptapJson.content);
      }
    } else if (cell.type === 'code') {
      docNodes.push({
        type: 'codeCell',
        attrs: {
          code: cell.code,
          outputs: cell.outputs || [],
          folded: true
        }
      });
    }
  }

  const doc = { type: 'doc', content: docNodes };
  console.log('Final doc before setting content:', JSON.stringify(doc, null, 2));
  
  // Set content with track changes disabled and using transaction
  tr.replaceWith(0, tr.doc.content.size, editor.schema.nodeFromJSON(doc));
  editor.view.dispatch(tr);
  
  // Restore track changes state if it was enabled
  if (wasEnabled) {
    editor.commands.setTrackChangeStatus(true);
  }

  // Log the editor's content after setting
  console.log('Editor content after setting:', editor.getJSON());
  console.log('Schema marks after setting content:', editor.schema.marks);
  
  // Verify marks are in the document
  editor.state.doc.descendants((node, pos) => {
    if (node.marks.length > 0) {
      console.log('Found marks at position', pos, ':', node.marks.map(m => ({
        type: m.type.name,
        attrs: m.attrs
      })));
    }
  });
}

export function tiptapDocToIpynb(editor, originalIpynb) {
  console.log('Converting editor content to ipynb...');
  
  const cells = [];
  const editorContent = editor.getJSON();
  console.log('Editor content with marks:', JSON.stringify(editorContent, null, 2));

  let currentMarkdownNodes = [];

  const flushMarkdownCell = () => {
    if (currentMarkdownNodes.length > 0) {
      // Process nodes and convert to markdown
      const processedContent = currentMarkdownNodes.map(node => {
        if (node.type === 'table') {
          // Convert table node directly to markdown
          const rows = node.content.map(row => {
            const cells = row.content.map(cell => {
              const cellContent = cell.content?.[0]?.content?.[0]?.text || '';
              return ` ${cellContent.trim()} `;
            });
            return `|${cells.join('|')}|`;
          });
          
          // Add header separator after first row
          const headerSeparator = `|${Array(rows[0].split('|').length - 2).fill(' --- ').join('|')}|`;
          rows.splice(1, 0, headerSeparator);
          
          // Return table without extra newlines
          return rows.join('\n');
        }
        
        // For non-table nodes, convert through HTML
        const html = generateHTML({ type: 'doc', content: [node] }, [
          StarterKit,
          RawCell,
          CodeCell,
          Underline,
          Highlight,
          TrackChangeExtension,
          CommentMark,
          Mathematics.configure({
            preserveBackslashes: true
          }),
          BibMention,
          Table.configure({
            resizable: true,
          }),
          TableRow,
          TableCell,
          TableHeader,
        ]);
        
        return htmlToMarkdown(html);
      }).join('\n\n');
      
      cells.push({ 
        type: 'markdown', 
        content: processedContent,
        tiptapContent: { 
          type: 'doc', 
          content: currentMarkdownNodes
        }
      });
      currentMarkdownNodes = [];
    }
  };

  editorContent.content.forEach((node, index) => {
    console.log('Processing node:', JSON.stringify(node, null, 2));

    if (node.type === 'paragraph' || node.type === 'heading') {
      // Add to markdown content
      const text = editor.view.dom.querySelector(`[data-node-index="${index}"]`)?.textContent || '';
      currentMarkdownNodes.push(node);
    } else if (node.type === 'rawCell') {
      // Flush current markdown cell first
      flushMarkdownCell();
      
      // For YAML cells, ensure we preserve the exact formatting
      let content = node.attrs.content;
      if (node.attrs.isYamlHeader && node.attrs.formattedYaml) {
        content = `---\n${node.attrs.formattedYaml}---`;
      }
      
      cells.push({ 
        type: 'raw', 
        content,
        isYamlHeader: node.attrs.isYamlHeader,
        parsedYaml: node.attrs.parsedYaml,
        formattedYaml: node.attrs.formattedYaml,
        isAcademicArticle: node.attrs.isAcademicArticle,
        tiptapContent: node.attrs.tiptapContent
      });
    } else if (node.type === 'codeCell') {
      // Flush current markdown cell
      flushMarkdownCell();
      const { code, outputs, execution_count, folded } = node.attrs;
      // execution_count might be undefined, ensure a fallback
      cells.push({
        type: 'code',
        code: code || '',
        execution_count: execution_count !== undefined ? execution_count : null,
        outputs: outputs || [],
        metadata: {
          collapsed: folded
        }
      });
    } else {
      // This is part of a markdown cell
      currentMarkdownNodes.push(node);
    }
  });

  // If doc ended with markdown nodes
  flushMarkdownCell();

  // We now have a 'cells' array with raw, code, and markdown cells in original order.
  // YAML was handled separately in parse/serialize. If needed, you can handle YAML from raw cell here.
  // But since we've integrated YAML into a raw cell at the start, it's already in `cells`.

  // If you need YAML from originalIpynb or some other source, insert it into cells before calling serializeIpynb.
  // Assuming originalIpynb was used only to keep formatting consistent, you can just pass it:
  
  const newIpynb = serializeIpynb({ yaml: {}, cells });
  console.log('Converted ipynb:', JSON.stringify(newIpynb, null, 2));
  return newIpynb;
}
