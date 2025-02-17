import MarkdownIt from 'markdown-it';
import markdownItIns from 'markdown-it-ins';
import TurndownService from 'turndown';
import { tables, strikethrough } from 'turndown-plugin-gfm';

function markdownItCitations(md) {
  md.inline.ruler.before('emphasis', 'quarto_citations', (state, silent) => {
    const start = state.pos;
    if (state.src[start] !== '[') {
      return false;
    }

    const end = state.src.indexOf(']', start);
    if (end === -1) {
      return false;
    }

    const content = state.src.slice(start + 1, end);

    const citations = content.split(/;/);

    let anyCitations = false;
    const parsedCitations = [];
    for (let part of citations) {
      part = part.trim();

      const citationMatch = part.match(/^(.*?)@\s*([A-Za-z0-9_][A-Za-z0-9_:.\#$%&+\-?<>~\/]*)\s*(.*)$/);
      if (citationMatch) {
        anyCitations = true;
        const prefix = citationMatch[1].trim();
        const key = citationMatch[2];
        const suffix = citationMatch[3].trim();
        parsedCitations.push({ prefix, key, suffix });
      } else {
        parsedCitations.push({ prefix: part, key: null, suffix: '' });
      }
    }

    if (!anyCitations && !silent) {
      return false;
    }

    if (!silent) {
      state.pos = end + 1;
      const token = state.push('quarto_citations', '', 0);
      token.content = parsedCitations;
    }

    return true;
  });

  md.renderer.rules.quarto_citations = (tokens, idx) => {
    const citations = tokens[idx].content;

    const htmlPieces = citations.map(c => {
      if (c.key) {
        let fullText = '';
        if (c.prefix) fullText += `${c.prefix} `;
        fullText += `@${c.key}`;
        if (c.suffix) fullText += ` ${c.suffix}`;

        return `[<span class="bib-mention" data-bib-key="${c.key}">${fullText}</span>]`;
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
  
  
  // Match complete math expression: $$...$$
  const mathMatch = line.match(/^\$\$(.*?)\$\$$/);
  if (!mathMatch) return false;
  
  const content = mathMatch[1];
  
  if (!silent) {
    const token = state.push('math_block', 'math', 0);
    token.content = content;
    token.block = true;
    token.meta = { type: 'math' }; // Add metadata to help identify this as math
  }
  
  state.line = startLine + 1;
  return true;
});

// Custom rule for inline math ($...$)
md.inline.ruler.before('emphasis', 'math_inline', (state, silent) => {
  if (state.src[state.pos] !== '$') return false;

  let pos = state.pos + 1;
  let found = false;

  // Find the closing $
  while (pos < state.src.length) {
    if (state.src[pos] === '$') {
      found = true;
      break;
    }
    pos++;
  }

  if (!found) return false;

  const content = state.src.slice(state.pos + 1, pos);
  if (!content) return false;

  if (!silent) {
    const token = state.push('math_inline', 'span', 0);
    token.content = content;
    token.markup = '$';
    token.meta = { type: 'inlineMath' };
  }

  state.pos = pos + 1;
  return true;
});

// Render rules for math
md.renderer.rules.math_block = function(tokens, idx) {
  return `<div class="block-math">${tokens[idx].content}</div>`;
};

md.renderer.rules.math_inline = function(tokens, idx) {
  return `<span class="inline-math">${tokens[idx].content}</span>`;
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
  filter: node => 
    (node.tagName === 'DIV' && node.classList.contains('block-math')) ||
    (node.tagName === 'SPAN' && node.classList.contains('inline-math')),
  replacement: (content, node) => {
    if (node.classList.contains('block-math')) {
      return `\n\n$$${content}$$\n\n`;
    } else {
      return `$${content}$`;
    }
  }
});



export function markdownToHtml(markdown) {  const html = md.render(markdown);
  return html;
}

export function htmlToMarkdown(html) {

  const markdown = turndownService.turndown(html);
  return markdown;
}
