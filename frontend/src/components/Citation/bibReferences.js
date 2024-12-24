// bibReferences.js
import bibtexParse from 'bibtex-parser-js'

export async function loadBibReferences(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch .bib file: ${response.statusText}`)
  }

  const bibContent = await response.text()
  const parsedBib = bibtexParse.toJSON(bibContent)

  const referenceMap = {}
  parsedBib.forEach((entry) => {
    if (entry.citationKey) {
      // Convert all entryTag keys to lowercase to avoid uppercase fields
      const normalizedTags = {}
      for (const [key, value] of Object.entries(entry.entryTags)) {
        normalizedTags[key.toLowerCase()] = value
      }

      referenceMap[entry.citationKey] = normalizedTags
    }
  })

  return referenceMap
}
