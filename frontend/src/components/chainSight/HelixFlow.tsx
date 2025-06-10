"use client";

import { useEffect, useRef } from 'react';
import { GenomicRecord } from '@/lib/stores/chainSightStore';
import { DNA_COLORS } from '@/lib/constants/designTokens';
import * as d3 from 'd3';

interface HelixFlowProps {
  records: GenomicRecord[];
  onNodeClick: (recordId: string) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  recordId: string;
  type: string;
  timestamp: number;
  radius: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

export const HelixFlow = ({ records, onNodeClick }: HelixFlowProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || records.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    svg.selectAll("*").remove();
    
    // Create nodes from records
    const nodes: Node[] = records.map((record, i) => ({
      id: `node-${record.id}`,
      recordId: record.id,
      type: record.experimentType,
      timestamp: record.timestamp,
      radius: 10 + Math.random() * 5,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100
    }));
    
    // Simple links between nodes
    const links: Link[] = [];
    for (let i = 1; i < nodes.length; i++) {
      links.push({
        source: nodes[i - 1].id,
        target: nodes[i].id,
        value: 1
      });
    }
    
    // Create a force simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d.radius || 10) + 5));
    
    // Add links
    const link = svg.append("g")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => {
        const sourceNode = nodes.find(n => n.id === d.source || (typeof d.source === 'object' && n.id === d.source.id));
        return getNodeColor(sourceNode?.type || 'prediction');
      })
      .attr("stroke-width", 1);
    
    // Add node circles
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => getNodeColor(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .attr("opacity", 0.7)
      .on("click", (event, d) => {
        onNodeClick(d.recordId);
      })
      .call(drag(simulation) as any);
    
    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x || 0)
        .attr("y1", d => (d.source as Node).y || 0)
        .attr("x2", d => (d.target as Node).x || 0)
        .attr("y2", d => (d.target as Node).y || 0);
      
      node
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);
    });
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [records, onNodeClick]);
  
  // Get color based on node type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'prediction':
        return DNA_COLORS.primary;
      case 'sensor':
        return DNA_COLORS.secondary;
      case 'manual':
        return DNA_COLORS.tertiary;
      default:
        return DNA_COLORS.primary;
    }
  };
  
  // Drag function for nodes
  const drag = (simulation: d3.Simulation<Node, undefined>) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };
  
  return (
    <div className="w-full h-full">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        style={{ background: 'transparent' }}
      />
    </div>
  );
}; 