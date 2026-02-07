import { Target } from '../types';

export const targets: Record<string, Target> = {
    ache: {
        id: 'ache',
        name: 'Acetylcholinesterase',
        type: 'enzyme',
        description: 'Enzyme that breaks down acetylcholine in synaptic clefts',
    },
    bace1: {
        id: 'bace1',
        name: 'BACE1',
        type: 'enzyme',
        description: 'Beta-secretase involved in amyloid-beta production',
    },
    nmdar: {
        id: 'nmdar',
        name: 'NMDA Receptor',
        type: 'receptor',
        description: 'Glutamate receptor involved in synaptic plasticity and memory',
    },
    dat: {
        id: 'dat',
        name: 'Dopamine Transporter',
        type: 'protein',
        description: 'Membrane protein regulating dopamine reuptake',
    },
    mao_b: {
        id: 'mao_b',
        name: 'MAO-B',
        type: 'enzyme',
        description: 'Enzyme that metabolizes dopamine',
    },
    glut4: {
        id: 'glut4',
        name: 'GLUT4',
        type: 'protein',
        description: 'Glucose transporter regulated by insulin',
    },
    pparg: {
        id: 'pparg',
        name: 'PPAR-γ',
        type: 'receptor',
        description: 'Nuclear receptor regulating glucose and lipid metabolism',
    },
    tnf_alpha: {
        id: 'tnf_alpha',
        name: 'TNF-α',
        type: 'protein',
        description: 'Pro-inflammatory cytokine involved in systemic inflammation',
    },
    cox2: {
        id: 'cox2',
        name: 'COX-2',
        type: 'enzyme',
        description: 'Cyclooxygenase enzyme producing inflammatory prostaglandins',
    },
    sert: {
        id: 'sert',
        name: 'Serotonin Transporter',
        type: 'protein',
        description: 'Membrane transporter regulating serotonin reuptake',
    },
};
