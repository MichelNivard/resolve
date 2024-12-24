import { loadBibFromGitHub, saveBibToGitHub, formatBibTeXEntry } from './bibGitHub';
import bibtexParse from 'bibtex-parser-js';

export class GitHubReferenceManager {
  constructor(token, selectedRepo, notebookPath, owner) {
    console.log('🔧 Initializing GitHubReferenceManager:', {
      repo: selectedRepo,
      notebook: notebookPath,
      owner
    });

    this.token = token;
    this.selectedRepo = selectedRepo;
    this.notebookPath = notebookPath;
    this.owner = owner;
    this.references = [];
    this.bibPath = null;
    this.sha = null;
    this._initialized = false;
  }

  /**
   * Initialize the reference manager by loading or creating a .bib file
   */
  async init() {
    if (this._initialized) {
      console.log('✨ Reference manager already initialized');
      return;
    }

    console.log('🚀 Initializing reference manager...');

    try {
      const bibFile = await loadBibFromGitHub(
        this.token,
        this.selectedRepo,
        this.notebookPath,
        this.owner
      );

      if (bibFile) {
        console.log('📚 Parsing BibTeX content...');
        try {
          const parsed = bibtexParse.toJSON(bibFile.content);
          console.log(`✅ Successfully parsed ${parsed.length} references`);
          
          this.references = this._normalizeReferences(parsed);
          this.bibPath = bibFile.path;
          this.sha = bibFile.sha;
        } catch (error) {
          console.error('❌ Error parsing BibTeX content:', error);
          // Don't throw here, just set empty references
          this.references = [];
        }
      } else {
        console.log('📝 No existing .bib file found, creating new one...');
        // Create new .bib file in notebook directory
        const notebookDir = this.notebookPath.substring(
          0,
          this.notebookPath.lastIndexOf('/')
        );
        this.bibPath = `${notebookDir}/references.bib`;
        this.references = [];
        await this.save();
      }

      this._initialized = true;
      console.log('✅ Reference manager initialization complete:', {
        path: this.bibPath,
        referenceCount: this.references.length
      });
    } catch (error) {
      console.error('❌ Error initializing reference manager:', error);
      // Set empty references but don't throw
      this.references = [];
      this._initialized = true;
    }
  }

  /**
   * Add a new reference to the .bib file
   * @param {Object} entry - BibTeX entry to add
   */
  async addReference(entry) {
    console.log('➕ Adding new reference:', entry.citationKey);

    if (!this._initialized) {
      console.log('🔄 Manager not initialized, initializing...');
      await this.init();
    }

    // Normalize the entry
    const normalizedEntry = this._normalizeEntry(entry);
    
    // Add to references
    this.references.push(normalizedEntry);
    
    // Save to GitHub
    await this.save();
    console.log('✅ Successfully added reference:', entry.citationKey);
  }

  /**
   * Update an existing reference
   * @param {string} citationKey - Citation key of the entry to update
   * @param {Object} newEntry - Updated BibTeX entry
   */
  async updateReference(citationKey, newEntry) {
    console.log('🔄 Updating reference:', citationKey);

    if (!this._initialized) {
      console.log('🔄 Manager not initialized, initializing...');
      await this.init();
    }

    const index = this.references.findIndex(ref => ref.citationKey === citationKey);
    if (index === -1) {
      console.error('❌ Reference not found:', citationKey);
      throw new Error(`Reference with citation key "${citationKey}" not found`);
    }

    // Normalize the entry
    const normalizedEntry = this._normalizeEntry(newEntry);
    
    // Update reference
    this.references[index] = normalizedEntry;
    
    // Save to GitHub
    await this.save();
    console.log('✅ Successfully updated reference:', citationKey);
  }

  /**
   * Save current references to GitHub
   */
  async save() {
    if (!this.bibPath) {
      console.log('⚠️ No .bib path set, skipping save');
      return;
    }

    console.log('💾 Saving references to GitHub...');
    const content = this.references
      .map(ref => formatBibTeXEntry(ref))
      .join('\n\n');
      
    try {
      const result = await saveBibToGitHub(
        content,
        this.bibPath,
        this.sha,
        this.token,
        this.selectedRepo,
        this.owner
      );
      
      this.sha = result.content.sha;
      console.log('✅ Successfully saved references to GitHub');
    } catch (error) {
      console.error('❌ Error saving references:', error);
      // Don't throw, just log the error
    }
  }

  /**
   * Search references by query
   * @param {string} query - Search query
   * @returns {Array} Matching references
   */
  async search(query) {
    console.log('🔍 Searching references:', query);

    if (!this._initialized) {
      console.log('🔄 Manager not initialized, initializing...');
      await this.init();
    }

    if (!this.references || !Array.isArray(this.references)) {
      console.warn('⚠️ No references available');
      return [];
    }

    console.log('📚 Current references:', this.references);

    if (!query) {
      console.log('ℹ️ Empty query, returning all references');
      return this.references;
    }

    const searchString = query.toLowerCase();
    const results = this.references.filter(ref => {
      if (!ref || !ref.entryTags) {
        console.warn('⚠️ Invalid reference:', ref);
        return false;
      }

      const searchableFields = [
        ref.citationKey,
        ref.entryTags?.title,
        ref.entryTags?.author,
        ref.entryTags?.year,
        ref.entryTags?.journal,
        ref.entryTags?.booktitle
      ].filter(field => field && typeof field === 'string');

      const matches = searchableFields.some(field => 
        field.toLowerCase().includes(searchString)
      );

      if (matches) {
        console.log('✅ Found matching reference:', ref);
      }

      return matches;
    });

    console.log(`✅ Found ${results.length} matching references:`, results);
    return results;
  }

  /**
   * Normalize references array
   * @private
   */
  _normalizeReferences(references) {
    console.log('🔧 Normalizing references...');
    if (!Array.isArray(references)) {
      console.warn('⚠️ Invalid references format, expected array');
      return [];
    }

    const normalized = references.map(ref => this._normalizeEntry(ref))
      .filter(ref => ref && ref.citationKey && ref.entryTags); // Filter out invalid entries
    
    console.log(`✅ Normalized ${normalized.length} references`);
    return normalized;
  }

  /**
   * Normalize a single reference entry
   * @private
   */
  _normalizeEntry(entry) {
    if (!entry) {
      console.warn('⚠️ Empty entry');
      return null;
    }

    if (!entry.entryTags || typeof entry.entryTags !== 'object') {
      console.warn('⚠️ Invalid entry format:', entry);
      return null;
    }

    if (!entry.citationKey) {
      console.warn('⚠️ Missing citation key:', entry);
      return null;
    }

    // Convert all entryTag keys to lowercase and ensure values are strings
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
