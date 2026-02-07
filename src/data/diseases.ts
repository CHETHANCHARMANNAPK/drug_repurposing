import { Disease } from '../types';

export const diseases: Disease[] = [
    {
        id: 'alzheimers',
        name: "Alzheimer's Disease",
        category: 'Neurodegenerative',
        description: 'Progressive neurodegenerative disorder characterized by cognitive decline and memory loss',
    },
    {
        id: 'parkinsons',
        name: "Parkinson's Disease",
        category: 'Neurodegenerative',
        description: 'Movement disorder caused by dopaminergic neuron degeneration in the substantia nigra',
    },
    {
        id: 'type2diabetes',
        name: 'Type 2 Diabetes',
        category: 'Metabolic',
        description: 'Metabolic disorder characterized by insulin resistance and impaired glucose regulation',
    },
    {
        id: 'rheumatoid',
        name: 'Rheumatoid Arthritis',
        category: 'Autoimmune',
        description: 'Chronic inflammatory disorder affecting joints and synovial membranes',
    },
    {
        id: 'depression',
        name: 'Major Depressive Disorder',
        category: 'Psychiatric',
        description: 'Mood disorder characterized by persistent sadness and anhedonia',
    },
    {
        id: 'hypertension',
        name: 'Hypertension',
        category: 'Cardiovascular',
        description: 'Chronic elevation of blood pressure increasing cardiovascular risk',
    },
    {
        id: 'crohns',
        name: "Crohn's Disease",
        category: 'Inflammatory',
        description: 'Chronic inflammatory bowel disease affecting the gastrointestinal tract',
    },
];
