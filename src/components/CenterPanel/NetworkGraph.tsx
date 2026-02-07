import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import type { GraphData, GraphNode, GraphLink } from '../../types';
import { fadeIn } from '../../utils/animations';

interface NetworkGraphProps {
    data: GraphData;
    onNodeClick?: (nodeId: string) => void;
}

export function NetworkGraph({ data, onNodeClick }: NetworkGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

    useEffect(() => {
        if (!svgRef.current || data.nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        const width = dimensions.width;
        const height = dimensions.height;

        // Clear previous content
        svg.selectAll('*').remove();

        // Create container group
        const g = svg.append('g');

        // Define colors for node types
        const nodeColors = {
            drug: '#6366F1', // accent
            target: '#10B981', // emerald
            pathway: '#F59E0B', // amber
        };

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
            .force('link', d3.forceLink(data.links)
                .id((d: any) => d.id)
                .distance(100)
                .strength((d: any) => d.strength))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40));

        // Create links
        const link = g.append('g')
            .selectAll('line')
            .data(data.links)
            .join('line')
            .attr('stroke', '#E5E5E5')
            .attr('stroke-width', (d: any) => d.strength * 2)
            .attr('stroke-opacity', 0.6);

        // Create nodes
        const node = g.append('g')
            .selectAll('g')
            .data(data.nodes)
            .join('g')
            .style('cursor', 'pointer')
            .call(drag(simulation) as any);

        // Add circles to nodes
        node.append('circle')
            .attr('r', (d: GraphNode) => d.type === 'drug' ? 24 : 18)
            .attr('fill', (d: GraphNode) => nodeColors[d.type])
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('transition', 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)');

        // Add labels to nodes
        node.append('text')
            .text((d: GraphNode) => d.label)
            .attr('dy', (d: GraphNode) => d.type === 'drug' ? 40 : 32)
            .attr('text-anchor', 'middle')
            .attr('font-size', (d: GraphNode) => d.type === 'drug' ? 13 : 11)
            .attr('font-weight', (d: GraphNode) => d.type === 'drug' ? 600 : 500)
            .attr('fill', '#0A0A0A')
            .style('pointer-events', 'none')
            .style('user-select', 'none');

        // Node interaction
        node.on('click', function (event, d: GraphNode) {
            event.stopPropagation();

            onNodeClick?.(d.id);

            // Highlight connected nodes
            const connectedIds = new Set(
                data.links
                    .filter((l: GraphLink) =>
                        (l.source as GraphNode).id === d.id ||
                        (l.target as GraphNode).id === d.id
                    )
                    .flatMap((l: GraphLink) => [
                        (l.source as GraphNode).id,
                        (l.target as GraphNode).id
                    ])
            );

            node.selectAll('circle')
                .attr('opacity', (n) =>
                    connectedIds.has((n as GraphNode).id) ? 1 : 0.2
                );

            link.attr('opacity', (l: GraphLink) =>
                (l.source as GraphNode).id === d.id ||
                    (l.target as GraphNode).id === d.id ? 0.8 : 0.1
            );
        });

        // Click outside to reset
        svg.on('click', () => {

            node.selectAll('circle').attr('opacity', 1);
            link.attr('opacity', 0.6);
        });

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

        // Drag behavior
        function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
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
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }

        return () => {
            simulation.stop();
        };
    }, [data, dimensions, onNodeClick]);

    // Handle resize
    useEffect(() => {
        const container = svgRef.current?.parentElement;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height: Math.max(height, 500) });
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    if (data.nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a disease to view drug-target-pathway relationships
            </div>
        );
    }

    return (
        <motion.div className="w-full h-full" {...fadeIn}>
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full"
            />
        </motion.div>
    );
}
