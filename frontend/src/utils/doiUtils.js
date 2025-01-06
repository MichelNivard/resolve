import axios from 'axios';

export async function doi2bib(doi) {
  try {
    const response = await axios.get(`https://doi.org/${doi}`, {
      headers: {
        'Accept': 'application/x-bibtex; charset=utf-8'
      },
      // Don't send credentials since we don't need them
      withCredentials: false
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching BibTeX:', error);
    throw error;
  }
}
