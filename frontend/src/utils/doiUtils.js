import axios from 'axios';

export async function doi2bib(doi) {
  try {
    const response = await axios.get(`https://doi.org/${doi}`, {
      headers: {
        'Accept': 'application/x-bibtex; charset=utf-8'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching BibTeX:', error);
    throw error;
  }
}
