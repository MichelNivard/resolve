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
import { Node } from '@tiptap/core';
import { CodeCell } from '../cells/codeCell';
import { RawCell } from '../cells/rawCell';
import { TrackChangeExtension } from './TrackChanges';
import { CommentMark } from './CommentMark'; 
import { CitationMark } from '../components/Citation/CitationMark';

export function ipynbToTiptapDoc(ipynb, editor) {
  // Temporarily disable track changes while loading content
  const trackChangeExtension = editor.extensionManager.extensions.find(
    ext => ext.name === 'trackchange'
  );
  console.log('Found track change extension:', trackChangeExtension);
  console.log('Available marks in schema:', editor.schema.marks);
  console.log('Input ipynb:', ipynb);
  
  const wasEnabled = trackChangeExtension?.options.enabled;
  if (wasEnabled) {
    editor.commands.setTrackChangeStatus(false);
  }

  // Parse ipynb if it's a string
  const notebookData = typeof ipynb === 'string' ? JSON.parse(ipynb) : ipynb;
  // Extract the actual notebook data
  const notebookContent = notebookData.ipynb || notebookData;
  
  console.log('Notebook content before parsing:', notebookContent);
  const { cells } = parseIpynb(notebookContent);
  
  console.log('Parsed cells:', cells);
  const docNodes = [];

  // Create a transaction to set content with marks preserved
  const tr = editor.state.tr;
  tr.setMeta('trackManualChanged', true);

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
        console.log('Raw tiptapContent:', cell.tiptapContent);
        const content = cell.tiptapContent.content.map((node, pos) => {
          console.log('Processing node:', node);
          const processedNode = { ...node };
          
          if (node.marks && node.marks.length > 0) {
            console.log('Processing marks for node:', node.marks);
            processedNode.marks = node.marks.map(mark => {
              console.log('Processing mark:', mark);
              if (mark.type === 'comment' || mark.type === 'insertion' || mark.type === 'deletion') {
                console.log('Found mark of type:', mark.type, 'with attrs:', mark.attrs);
                const markType = editor.schema.marks[mark.type];
                if (!markType) {
                  console.error('Mark type not found in schema:', mark.type);
                  return null;
                }
                
                if (mark.type === 'comment') {
                  const attrs = {
                    commentId: mark.attrs.commentId || `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${pos}`,
                    username: mark.attrs.username || 'Unknown',
                    avatarUrl: mark.attrs.avatarUrl || '',
                    text: mark.attrs.text || '',
                    timestamp: mark.attrs.timestamp || new Date().toISOString(),
                    resolved: mark.attrs.resolved || false,
                    ...mark.attrs
                  };
                  return {
                    type: markType.name,
                    attrs
                  };
                }
                
                return {
                  type: mark.type,
                  attrs: mark.attrs
                };
              }
              return mark;
            }).filter(Boolean);
          }
          return processedNode;
        });
        docNodes.push(...content);
      } else {
        // Convert markdown to HTML, then to TipTap JSON
        const html = markdownToHtml(cell.content);
        const json = generateJSON(html, [
          StarterKit,
          RawCell,
          CodeCell,
          Underline,
          Highlight,
          TrackChangeExtension,
          CommentMark,
          Mathematics,
          CitationMark,
          Table,
          TableRow,
          TableCell,
          TableHeader
        ]);
        docNodes.push(...json.content);
      }
    } else if (cell.type === 'code') {
      docNodes.push({
        type: 'codeCell',
        attrs: {
          source: cell.source, // Keep as array, don't join
          outputs: cell.outputs || [],
          executionCount: cell.execution_count || null,
          metadata: cell.metadata || {}
        }
      });
    }
  }

  // Create the final document
  const doc = {
    type: 'doc',
    content: docNodes
  };

  console.log('Final doc before setting content:', doc);

  // Set the content
  editor.commands.setContent(doc);

  // Re-enable track changes if it was enabled
  if (wasEnabled) {
    editor.commands.setTrackChangeStatus(true);
  }

  return doc;
}

export function tiptapDocToIpynb(editor, originalIpynb) {
  console.log('Converting editor content to ipynb...');
  
  const cells = [];
  const editorContent = editor.getJSON();
  console.log('Input editor content:', editorContent);

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
          CitationMark,
          Table,
          TableRow,
          TableCell,
          TableHeader
        ]);
        
        return htmlToMarkdown(html);
      }).join('\n\n');
      
      cells.push({ 
        cell_type: 'markdown',  
        source: processedContent.split('\n').map(line => line + '\n'),  
        metadata: {}  
      });
      currentMarkdownNodes = [];
    }
  };

  editorContent.content.forEach((node, index) => {
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'table') {
      // Add to markdown content
      currentMarkdownNodes.push(node);
    } else if (node.type === 'rawCell') {
      // Flush current markdown cell first
      flushMarkdownCell();
      
      // For YAML cells, ensure we preserve the exact formatting
      let content = node.attrs.content || '';  
      if (node.attrs.isYamlHeader && node.attrs.formattedYaml) {
        content = `---\n${node.attrs.formattedYaml}---`;
      }
      
      cells.push({ 
        cell_type: 'raw',  
        source: content.split('\n').map(line => line + '\n'),  
        metadata: {  
          isYamlHeader: node.attrs.isYamlHeader || false,
          parsedYaml: node.attrs.parsedYaml || null,
          isAcademicArticle: node.attrs.isAcademicArticle || false
        }
      });
    } else if (node.type === 'codeCell') {
      // Flush current markdown cell
      flushMarkdownCell();

      const { source, outputs, executionCount, metadata } = node.attrs;
      cells.push({
        cell_type: 'code',  
        source: Array.isArray(source) ? source : source.split('\n').map(line => line + '\n'),
        execution_count: executionCount !== undefined ? executionCount : null,
        outputs: outputs || [],
        metadata: {
          collapsed: metadata?.collapsed || false,
          ...metadata
        }
      });
    } else {
      // This is part of a markdown cell
      currentMarkdownNodes.push(node);
    }
  });

  // If doc ended with markdown nodes
  flushMarkdownCell();

  // Create the final notebook object
  const notebook = {
    cells,
    metadata: originalIpynb?.metadata || {},
    nbformat: originalIpynb?.nbformat || 4,
    nbformat_minor: originalIpynb?.nbformat_minor || 5
  };

  console.log('Final notebook:', notebook);
  return notebook;
}
