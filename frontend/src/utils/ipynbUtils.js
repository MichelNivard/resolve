import yaml from 'js-yaml';

export function parseIpynb(ipynb) {
  if (!ipynb || !ipynb.cells) {
    return { yaml: {}, cells: [] };
  }

  let yamlObj = {};
  const cells = [];

  for (const c of ipynb.cells) {
    if (c.cell_type === 'raw') {
      const rawText = c.source.join('');
      let isYamlHeader = false;
      let parsedYaml = null;
      let isAcademicArticle = false;

      // Check if this is a YAML header
      if (rawText.trim().startsWith('---\n') && rawText.trim().endsWith('\n---')) {
        isYamlHeader = true;
        try {
          // Extract YAML content between --- markers
          const yamlContent = rawText.replace(/^---\n/, '').replace(/\n---$/, '');
          parsedYaml = yaml.load(yamlContent) || {};
          yamlObj = parsedYaml;
          
          // Check for academic article structure
          isAcademicArticle = !!(parsedYaml && 
            (parsedYaml.title || parsedYaml.Title) && 
            (typeof parsedYaml.title === 'string' || typeof parsedYaml.Title === 'string'));
        } catch (e) {
          console.error('Failed to parse YAML', e);
        }
      }

      cells.push({ 
        type: 'raw', 
        content: rawText,
        isYamlHeader,
        parsedYaml,
        isAcademicArticle
      });
    } else if (c.cell_type === 'markdown') {
      cells.push({
        type: 'markdown',
        content: c.source.join(''),
        tiptapContent: c.metadata?.tiptapContent || null
      });
    } else if (c.cell_type === 'code') {
      cells.push({
        type: 'code', 
        execution_count: c.execution_count, // store this too
        code: c.source.join(''),
        outputs: c.outputs || []
      });
    } else {
      console.warn('Unknown cell type:', c.cell_type);
    }
  }

  return { yaml: yamlObj, cells };
}

export function serializeIpynb({ yaml: yamlObj, cells }) {
  const serializedCells = [];

  // Add the YAML cell first if it exists
  if (yamlObj && Object.keys(yamlObj).length > 0) {
    const yamlStr = yaml.dump(yamlObj);
    const yamlSource = yamlStr.endsWith('\n') ? yamlStr.split('\n') : (yamlStr + '\n').split('\n');
    serializedCells.push({
      cell_type: 'raw',
      metadata: {},
      source: yamlSource
    });
  }

  // Then add the cells as they appear in the input
  cells.forEach(cell => {
    const { type, content, code, execution_count, outputs, tiptapContent, isYamlHeader, parsedYaml, isAcademicArticle } = cell;
    
    if (type === 'raw') {
      const metadata = {};
      if (isYamlHeader) {
        metadata.isYamlHeader = true;
        metadata.parsedYaml = parsedYaml;
        metadata.isAcademicArticle = isAcademicArticle;
      }
      
      serializedCells.push({
        cell_type: 'raw',
        metadata,
        source: content.split('\n')
      });
    } else if (type === 'markdown') {
      // For markdown cells, handle table lines specially
      const lines = content.split('\n');
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          // This is a table line, add it without extra newlines
          processedLines.push(line + '\n');
        } else if (line) {
          // Non-empty, non-table line
          processedLines.push(line + '\n');
        } else if (i > 0 && !lines[i-1].trim().startsWith('|') && 
                  i < lines.length-1 && !lines[i+1].trim().startsWith('|')) {
          // Empty line not between table rows
          processedLines.push('\n');
        }
      }

      serializedCells.push({
        cell_type: 'markdown',
        metadata: {
          tiptapContent: tiptapContent || null
        },
        source: processedLines
      });
    } else if (type === 'code') {
      serializedCells.push({
        cell_type: 'code',
        execution_count: execution_count || null,
        metadata: {},
        source: code.split('\n'),
        outputs
      });
    } else {
      console.warn('Unknown cell type during serialization:', type);
    }
  });

  return {
    cells: serializedCells,
    metadata: {},
    nbformat: 4,
    nbformat_minor: 5,
  };
}