import { loadBibFromGitHub, saveBibToGitHub, formatBibTeXEntry } from './bibGitHub';
import bibtexParse from 'bibtex-parser-js';

export class GitHubReferenceManager {
  constructor(token, selectedRepo, notebookPath, owner) {
    this.token = token;
    this.selectedRepo = selectedRepo;
    this.notebookPath = notebookPath;
    this.owner = owner;
    this.references = [];
    this.bibPath = null;
    this.sha = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) {
      return;
    }

    try {
      const bibFile = await loadBibFromGitHub(
        this.token,
        this.selectedRepo,
        this.notebookPath,
        this.owner
      );

      if (bibFile) {
        try {
          const parsed = bibtexParse.toJSON(bibFile.content);
          this.references = this._normalizeReferences(parsed);
          this.bibPath = bibFile.path;
          this.sha = bibFile.sha;
        } catch (error) {
          console.error('Error parsing BibTeX content:', error);
          this.references = [];
        }
      } else {
        const notebookDir = this.notebookPath.substring(
          0,
          this.notebookPath.lastIndexOf('/')
        );
        this.bibPath = `${notebookDir}/references.bib`;
        this.references = [];
        await this.save();
      }

      this._initialized = true;
    } catch (error) {
      console.error('Error initializing reference manager:', error);
      this.references = [];
      this._initialized = true;
    }
  }

  async addReference(entry) {
    try {
      if (!this._initialized) {
        await this.init();
      }

      const normalizedEntry = this._normalizeEntry(entry);
      this.references.push(normalizedEntry);
      await this.save();
    } catch (error) {
      console.error('Error adding reference:', error);
      throw error;
    }
  }

  async updateReference(citationKey, newEntry) {
    try {
      if (!this._initialized) {
        await this.init();
      }

      const index = this.references.findIndex(ref => ref.citationKey === citationKey);
      if (index === -1) {
        console.error('Reference not found:', citationKey);
        throw new Error(`Reference with citation key "${citationKey}" not found`);
      }

      const normalizedEntry = this._normalizeEntry(newEntry);
      this.references[index] = normalizedEntry;
      await this.save();
    } catch (error) {
      console.error('Error updating reference:', error);
      throw error;
    }
  }

  async save() {
    if (!this.bibPath) {
      return;
    }

    try {
      const content = this.references
        .map(ref => formatBibTeXEntry(ref))
        .join('\n\n');
      const result = await saveBibToGitHub(
        content,
        this.bibPath,
        this.sha,
        this.token,
        this.selectedRepo,
        this.owner
      );
      this.sha = result.content.sha;
    } catch (error) {
      console.error('Error saving references:', error);
      throw error;
    }
  }

  async search(query) {
    try {
      if (!this._initialized) {
        await this.init();
      }

      if (!query) {
        return this.references;
      }

      const results = this.references.filter(ref => {
        const searchableFields = [
          ref.citationKey,
          ref.entryTags?.title,
          ref.entryTags?.author,
          ref.entryTags?.year,
          ref.entryTags?.journal,
          ref.entryTags?.booktitle
        ].filter(field => field && typeof field === 'string');

        const matches = searchableFields.some(field => 
          field.toLowerCase().includes(query.toLowerCase())
        );

        return matches;
      });

      return results;
    } catch (error) {
      console.error('Error searching references:', error);
      throw error;
    }
  }

  _normalizeReferences(references) {
    return references.map(ref => this._normalizeEntry(ref))
      .filter(ref => ref && ref.citationKey && ref.entryTags);
  }

  _normalizeEntry(entry) {
    if (!entry) {
      return null;
    }

    if (!entry.entryTags || typeof entry.entryTags !== 'object') {
      return null;
    }

    if (!entry.citationKey) {
      return null;
    }

    const normalizedTags = {};
    for (const [key, value] of Object.entries(entry.entryTags)) {
      normalizedTags[key.toLowerCase()] = String(value || '');
    }

    return {
      ...entry,
      entryTags: normalizedTags
    };
  }
}
