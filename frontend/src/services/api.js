import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})


// Health

export async function fetchHealth() {
  const { data } = await api.get('/health')
  return data
}

// Graph

/**
 * Fetch the full knowledge graph from the backend.
 * @returns {{ nodes: Node[], edges: Edge[], stats: Stats }}
 */
export async function fetchGraph() {
  const { data } = await api.get('/graph')
  return data
}

// RAG Query

/**
 * Submit a question to the RAG pipeline.
 * @param {string} question
 * @param {'English'|'French'} language
 * @returns {{ answer: string, sources: Source[] }}
 */
export async function submitQuery(question, language = 'English') {
  const { data } = await api.post('/query', { question, language })
  return data
}
