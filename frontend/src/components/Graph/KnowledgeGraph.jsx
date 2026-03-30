import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import NodeTooltip from './NodeTooltip'
import GraphLegend from './GraphLegend'
import { useState } from 'react'


export default function KnowledgeGraph({
  nodes = [],
  edges = [],
  stats = {},
  loading = false,
  onNodeClick,
}) {
  const svgRef = useRef(null)
  const simulationRef = useRef(null)
  const [tooltip, setTooltip] = useState({ node: null, x: 0, y: 0 })

  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) onNodeClick(node)
  }, [onNodeClick])

  useEffect(() => {
    if (loading || !nodes.length || !svgRef.current) return

    const container = svgRef.current.parentElement
    const W = container.clientWidth
    const H = container.clientHeight

    // --- Clear previous render ---
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // Zoom + pan
    const zoomGroup = svg.append('g').attr('class', 'zoom-group')

    svg.call(
      d3.zoom()
        .scaleExtent([0.2, 4])
        .on('zoom', (event) => {
          zoomGroup.attr('transform', event.transform)
        })
    )

    // --- Clone data so D3 can mutate positions ---
    const nodeData = nodes.map(n => ({ ...n }))
    const edgeData = edges.map(e => ({ ...e }))

    // --- Force simulation ---
    const simulation = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(edgeData)
        .id(d => d.id)
        .distance(60)
        .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 4))

    simulationRef.current = simulation

    // --- Draw edges ---
    const link = zoomGroup.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edgeData)
      .join('line')
      .attr('class', 'graph-link')

    // --- Draw nodes ---
    const node = zoomGroup.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodeData)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')

    // Circle
    const TYPE_COLORS = {
      manuscript: '#f6c864',
      map:        '#6ecfb8',
      photograph: '#7eb8f7',
      photo:      '#7eb8f7',
      image:      '#b39ddb',
      text:       '#90a4ae',
      video:      '#f48fb1',
      sound:      '#a5d6a7',
      i:          '#b39ddb',
      t:          '#90a4ae',
      v:          '#f48fb1',
      s:          '#a5d6a7',
    }
    const getColor = d => TYPE_COLORS[d.type] || '#b0bec5'

    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.size ?? 8)
      .attr('fill', d => getColor(d))
      .attr('stroke', d => getColor(d))
      .attr('stroke-width', 1.5)
      .attr('fill-opacity', 0.85)

    // Label (only for larger nodes)
    node.filter(d => (d.size ?? 8) >= 12)
      .append('text')
      .attr('class', 'node-label')
      .attr('dy', d => (d.size ?? 8) + 12)
      .attr('text-anchor', 'middle')
      .text(d => d.label?.slice(0, 24) ?? '')

    // --- Interactions ---
    node
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .transition().duration(150)
          .attr('r', (d.size ?? 8) * 1.4)
          .attr('fill-opacity', 1)

        setTooltip({ node: d, x: event.clientX, y: event.clientY })
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({ ...prev, x: event.clientX, y: event.clientY }))
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .transition().duration(150)
          .attr('r', d.size ?? 8)
          .attr('fill-opacity', 0.85)

        setTooltip({ node: null, x: 0, y: 0 })
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        handleNodeClick(d)
      })

    // Drag
    node.call(
      d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
    )

    // --- Tick ---
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Slow down after initial layout
    simulation.alpha(1).restart()
    setTimeout(() => simulation.alphaTarget(0), 3000)

    return () => {
      simulation.stop()
    }
  }, [nodes, edges, loading, handleNodeClick])

  // Resize observer
  useEffect(() => {
    if (!svgRef.current) return
    const observer = new ResizeObserver(() => {
      if (!svgRef.current) return
      const container = svgRef.current.parentElement
      d3.select(svgRef.current)
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight)
      if (simulationRef.current) {
        simulationRef.current
          .force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2))
          .alpha(0.3).restart()
      }
    })
    observer.observe(svgRef.current.parentElement)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="graph-container" style={{ background: '#0f172a' }}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Loading archive graph...</p>
        </div>
      )}

      {!loading && nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <p className="text-slate-500 text-sm">No archive data found.</p>
          <p className="text-slate-600 text-xs mt-1">Run <code className="text-slate-400">python ingest.py</code> to populate.</p>
        </div>
      )}

      <svg ref={svgRef} />

      <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />
      <GraphLegend stats={stats} />
    </div>
  )
}
