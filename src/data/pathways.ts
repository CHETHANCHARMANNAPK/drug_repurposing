import { Pathway } from '../types';

export const pathways: Record<string, Pathway> = {
    cholinergic: {
        id: 'cholinergic',
        name: 'Cholinergic Signaling',
        description: 'Neurotransmitter pathway involved in memory and cognition',
    },
    amyloid: {
        id: 'amyloid',
        name: 'Amyloid Processing',
        description: 'Pathway regulating amyloid-beta production and clearance',
    },
    dopaminergic: {
        id: 'dopaminergic',
        name: 'Dopaminergic Signaling',
        description: 'Neurotransmitter pathway controlling movement and reward',
    },
    insulin: {
        id: 'insulin',
        name: 'Insulin Signaling',
        description: 'Pathway regulating glucose uptake and metabolism',
    },
    inflammation: {
        id: 'inflammation',
        name: 'Inflammatory Response',
        description: 'Immune system pathway mediating tissue inflammation',
    },
    serotonergic: {
        id: 'serotonergic',
        name: 'Serotonergic Signaling',
        description: 'Neurotransmitter pathway regulating mood and emotion',
    },
    oxidative: {
        id: 'oxidative',
        name: 'Oxidative Stress Response',
        description: 'Cellular pathway managing reactive oxygen species',
    },
};
