import MarkdownIt from 'markdown-it';
import markdownItIns from 'markdown-it-ins';
import TurndownService from 'turndown';
import { tables, strikethrough } from 'turndown-plugin-gfm';

function markdownItCitations(md) {
  md.inline.ruler.before('emphasis', 'quarto_citations', (state, silent) => {
    console.log('Checking at pos:', state.pos, 'remaining src:', state.src.slice(state.pos));
    const start = state.pos;
    if (state.src[start] !== '[') {
      console.log('No [ found at pos');
      return false;
    }

    const end = state.src.indexOf(']', start);
    if (end === -1) {
      console.log('No closing bracket ] found');
      return false;
    }

    const content = state.src.slice(start + 1, end);
    console.log('Bracket content:', content);

    const citations = content.split(/;/);
    console.log('Citations after split:', citations);

    let anyCitations = false;
    const parsedCitations = [];
    for (let part of citations) {
      part = part.trim();
      console.log('Parsing citation part:', part);

      const citationMatch = part.match(/^(.*?)@\s*([A-Za-z0-9_][A-Za-z0-9_:.\#$%&+\-?<>~\/]*)\s*(.*)$/);
      if (citationMatch) {
        anyCitations = true;
        const prefix = citationMatch[1].trim();
        const key = citationMatch[2];
        const suffix = citationMatch[3].trim();
        parsedCitations.push({ prefix, key, suffix });
        console.log('Matched citation:', { prefix, key, suffix });
      } else {
        console.log('No citation match for part:', part);
        parsedCitations.push({ prefix: part, key: null, suffix: '' });
      }
    }

    if (!anyCitations && !silent) {
      console.log('No actual citations found in brackets');
      return false;
    }

    if (!silent) {
      console.log('Citations found, creating token');
      state.pos = end + 1;
      const token = state.push('quarto_citations', '', 0);
      token.content = parsedCitations;
    }

    return true;
  });

  md.renderer.rules.quarto_citations = (tokens, idx) => {
    const citations = tokens[idx].content;
    console.log('Rendering citations:', citations);

    const htmlPieces = citations.map(c => {
      if (c.key) {
        let fullText = '';
        if (c.prefix) fullText += `${c.prefix} `;
        fullText += `@${c.key}`;
        if (c.suffix) fullText += ` ${c.suffix}`;

        return `<span class="bib-mention" data-bib-key="${c.key}">${fullText}</span>`;
      } else {
        return c.prefix; // fallback for non-citation text
      }
    });

    return htmlPieces.join('; ');
  };
}

// Initialize markdown-it with plugins to support <ins> tags and tables
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
.use(markdownItIns)
.use(markdownItCitations);

// Custom rule for display math ($$...$$)
md.block.ruler.before('paragraph', 'math_block', (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const line = state.src.slice(state.bMarks[startLine], state.eMarks[startLine]);
  
  console.log('Checking line for math:', line);
  
  // Match complete math expression: $$...$$
  const mathMatch = line.match(/^\$\$(.*?)\$\$$/);
  if (!mathMatch) return false;
  
  const content = mathMatch[1];
  console.log('Found block math content:', content);
  
  if (!silent) {
    const token = state.push('math_block', 'math', 0);
    token.content = content;
    token.block = true;
    token.meta = { type: 'math' }; // Add metadata to help identify this as math
  }
  
  state.line = startLine + 1;
  return true;
});

// Render rules that preserve the LaTeX
md.renderer.rules.math_block = (tokens, idx) => {
  const token = tokens[idx];
  console.log('Rendering block math token:', token);
  return `<div class="block-math">${token.content}</div>`;
};

md.renderer.rules.math_inline = (tokens, idx) => {
  const token = tokens[idx];
  console.log('Rendering inline math token:', token);
  // Just keep inline math as markdown since the plugin doesn't support it
  return `$${token.content}$`;
};

// Initialize Turndown with options to preserve tags
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Use specific GFM plugins for better table support
turndownService.use([tables, strikethrough]);

// Preserve <ins> and <del> tags during Turndown conversion
turndownService.keep(['ins', 'del']);

// After initializing turndownService add rule for refs
turndownService.addRule('bibMention', {
  filter: (node, options) => {
    return (
      node.nodeName === 'SPAN' && 
      node.classList && node.classList.contains('bib-mention')
    );
  },
  replacement: (content, node, options) => {
    const key = node.getAttribute('data-bib-key') || '';
    // If your plugin produces prefix/suffix inside the content, handle them here:
    const text = content.trim(); // might contain prefix/suffix
    // Construct the citation format:
    // If you have prefix/suffix logic, you can reconstruct something like:
    // [see @Smith2015, pp. 33-35; also @Wickham2015, chap. 1]
    // For simplicity, assume just a single citation:
    return `[@${key}${text ? ' ' + text : ''}]`;
  }
});

// Add custom HTML to Markdown conversion rules
turndownService.addRule('math', {
  filter: node => node.classList.contains('block-math'),
  replacement: (content, node) => {
    // Remove any existing backslash escaping and add single backslashes
    const cleanContent = content.replace(/\\+/g, '\\');
    return `$$${cleanContent}$$\n`;
  }
});

console.log(md.render('[@TestCitation]'));

export function markdownToHtml(markdown) {
  console.log('Input markdown:', markdown);
  const html = md.render(markdown);
  console.log('Converted HTML:', html);
  return html;
}

export function htmlToMarkdown(html) {
  console.log('Input HTML:', html);
  const markdown = turndownService.turndown(html);
  console.log('Converted back to markdown:', markdown);
  return markdown;
}
