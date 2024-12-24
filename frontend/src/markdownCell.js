import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import React from 'react'
import { markdownToHtml } from './utils/markdownConverter'

export const MarkdownCell = Node.create({
  name: 'markdownCell',
  group: 'block',
  atom: false,
  content: 'block+',
  selectable: true,
  addAttributes() {
    return {
      content: { default: '' }
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="markdown-cell"]' }]
  },
  renderHTML() {
    // This may never run if you don't call editor.getHTML(), but keep it here for fallback
    return ['div', { 'data-type': 'markdown-cell' }]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MarkdownCellView)
  }
})

function MarkdownCellView({ node }) {
  const { content } = node.attrs;
  const html = markdownToHtml(content);

  console.log('MarkdownCellView rendered with content:', content);

  return (
    <NodeViewWrapper
      as="div"
      data-type="markdown-cell"
      style={{
        padding:'0.5em', 
        border:'1px solid #eee',
        borderRadius:'4px', 
        marginBottom:'1em'
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
