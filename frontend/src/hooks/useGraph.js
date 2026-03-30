import { useState, useEffect } from 'react'
import { fetchGraph } from '../services/api'


export function useGraph() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [stats, setStats] = useState({ total: 0, by_type: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchGraph()
        if (!cancelled) {
          setNodes(data.nodes ?? [])
          setEdges(data.edges ?? [])
          setStats(data.stats ?? { total: 0, by_type: {} })
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail ??
            err?.message ??
            'Failed to load graph data.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [tick])

  function refetch() {
    setTick(t => t + 1)
  }

  return { nodes, edges, stats, loading, error, refetch }
}
