import { GraphData, Drug } from '../types';
import { targets } from './targets';
import { pathways } from './pathways';

export function generateGraphData(drug: Drug | null): GraphData {
    if (!drug) {
        return { nodes: [], links: [] };
    }

    const nodes: GraphData['nodes'] = [];
    const links: GraphData['links'] = [];

    // Add central drug node
    nodes.push({
        id: drug.id,
        type: 'drug',
        label: drug.name,
    });

    // Add target nodes
    drug.targets.forEach((targetId) => {
        const target = targets[targetId];
        if (target) {
            nodes.push({
                id: target.id,
                type: 'target',
                label: target.name,
            });
            links.push({
                source: drug.id,
                target: target.id,
                strength: 0.8,
            });
        }
    });

    // Add pathway nodes
    drug.pathways.forEach((pathwayId) => {
        const pathway = pathways[pathwayId];
        if (pathway) {
            nodes.push({
                id: pathway.id,
                type: 'pathway',
                label: pathway.name,
            });
            links.push({
                source: drug.id,
                target: pathway.id,
                strength: 0.6,
            });
        }
    });

    // Create links between targets and pathways where relevant
    drug.targets.forEach((targetId) => {
        drug.pathways.forEach((pathwayId) => {
            // Verify nodes exist before linking
            const targetNodeExists = nodes.some(n => n.id === targetId);
            const pathwayNodeExists = nodes.some(n => n.id === pathwayId);

            if (!targetNodeExists || !pathwayNodeExists) return;

            // Connect cholinergic pathway to AChE, etc.
            const shouldLink = (
                (targetId === 'ache' && pathwayId === 'cholinergic') ||
                (targetId === 'nmdar' && pathwayId === 'cholinergic') ||
                (targetId === 'dat' && pathwayId === 'dopaminergic') ||
                (targetId === 'mao_b' && pathwayId === 'dopaminergic') ||
                (targetId === 'pparg' && (pathwayId === 'insulin' || pathwayId === 'inflammation')) ||
                (targetId === 'glut4' && pathwayId === 'insulin') ||
                (targetId === 'tnf_alpha' && pathwayId === 'inflammation') ||
                (targetId === 'cox2' && pathwayId === 'inflammation') ||
                (targetId === 'sert' && pathwayId === 'serotonergic')
            );

            if (shouldLink) {
                links.push({
                    source: targetId,
                    target: pathwayId,
                    strength: 0.4,
                });
            }
        });
    });

    return { nodes, links };
}
