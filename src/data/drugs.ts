import { Drug } from '../types';

// Drug candidates organized by disease
export const drugsByDisease: Record<string, Drug[]> = {
    alzheimers: [
        {
            id: 'memantine',
            name: 'Memantine',
            genericName: 'Memantine HCl',
            confidenceScore: 87,
            confidenceTier: 'high',
            mechanismSummary: 'NMDA receptor antagonist that modulates glutamatergic neurotransmission, potentially reducing excitotoxicity in neurodegenerative contexts',
            targets: ['nmdar'],
            pathways: ['cholinergic', 'oxidative'],
            diseaseRelevance: 'Currently approved for moderate-to-severe Alzheimer\'s. Model suggests broader neuroprotective potential in early-stage disease through excitotoxicity reduction.',
            knownLimitations: [
                'Limited efficacy in mild cognitive impairment',
                'Optimal dosing for repurposing context unclear',
                'May require combination therapy for maximum benefit',
            ],
            currentUse: 'Moderate-to-severe Alzheimer\'s Disease',
        },
        {
            id: 'pioglitazone',
            name: 'Pioglitazone',
            confidenceScore: 73,
            confidenceTier: 'high',
            mechanismSummary: 'PPAR-γ agonist with anti-inflammatory and insulin-sensitizing effects. May reduce neuroinflammation and improve mitochondrial function in neuronal tissue.',
            targets: ['pparg'],
            pathways: ['inflammation', 'insulin', 'oxidative'],
            diseaseRelevance: 'Epidemiological data suggests reduced AD risk in diabetic patients taking thiazolidinediones. Potential dual benefit addressing metabolic and inflammatory dysfunction.',
            knownLimitations: [
                'Cardiovascular safety concerns in elderly populations',
                'Blood-brain barrier penetration moderate',
                'Long-term neuroprotective effects not yet proven in clinical trials',
            ],
            currentUse: 'Type 2 Diabetes',
        },
        {
            id: 'rasagiline',
            name: 'Rasagiline',
            confidenceScore: 68,
            confidenceTier: 'medium',
            mechanismSummary: 'Selective MAO-B inhibitor that increases dopamine availability and may have neuroprotective properties through reduced oxidative stress.',
            targets: ['mao_b'],
            pathways: ['dopaminergic', 'oxidative'],
            diseaseRelevance: 'Preclinical models show potential for reducing oxidative damage. Cognitive benefits observed in Parkinson\'s patients may translate to AD context.',
            knownLimitations: [
                'Primary evidence from Parkinson\'s disease, not AD',
                'Cognitive effects in AD populations untested in Phase III',
                'Mechanism overlap with AD pathology moderate',
            ],
            currentUse: 'Parkinson\'s Disease',
        },
        {
            id: 'celecoxib',
            name: 'Celecoxib',
            confidenceScore: 62,
            confidenceTier: 'medium',
            mechanismSummary: 'Selective COX-2 inhibitor targeting neuroinflammation, a key component of Alzheimer\'s pathology.',
            targets: ['cox2'],
            pathways: ['inflammation'],
            diseaseRelevance: 'Chronic neuroinflammation contributes to AD progression. COX-2 inhibition may slow inflammatory cascade in early disease stages.',
            knownLimitations: [
                'Previous trials showed mixed results',
                'Timing of intervention critical (early vs. late stage)',
                'Cardiovascular risk profile requires monitoring',
            ],
            currentUse: 'Osteoarthritis, Rheumatoid Arthritis',
        },
    ],
    parkinsons: [
        {
            id: 'rasagiline_pd',
            name: 'Rasagiline',
            confidenceScore: 91,
            confidenceTier: 'high',
            mechanismSummary: 'MAO-B inhibition increases striatal dopamine and provides neuroprotection through antioxidant mechanisms.',
            targets: ['mao_b'],
            pathways: ['dopaminergic', 'oxidative'],
            diseaseRelevance: 'Approved monotherapy and adjunct treatment. Model confirms strong efficacy profile across disease stages.',
            knownLimitations: [
                'Does not halt disease progression',
                'Symptomatic benefit only',
            ],
            currentUse: 'Parkinson\'s Disease (approved)',
        },
        {
            id: 'amantadine',
            name: 'Amantadine',
            confidenceScore: 78,
            confidenceTier: 'high',
            mechanismSummary: 'NMDA antagonist with dopaminergic modulation properties. Reduces dyskinesia and provides mild motor benefit.',
            targets: ['nmdar', 'dat'],
            pathways: ['dopaminergic'],
            diseaseRelevance: 'Particularly effective for levodopa-induced dyskinesia. Model suggests underutilized potential in early disease.',
            knownLimitations: [
                'Modest motor improvement',
                'Cognitive side effects possible',
            ],
            currentUse: 'Parkinson\'s Disease, Influenza A',
        },
    ],
    type2diabetes: [
        {
            id: 'metformin',
            name: 'Metformin',
            confidenceScore: 94,
            confidenceTier: 'high',
            mechanismSummary: 'Biguanide that suppresses hepatic glucose production and improves peripheral insulin sensitivity through AMPK activation.',
            targets: ['glut4'],
            pathways: ['insulin'],
            diseaseRelevance: 'First-line therapy for T2D. Model confirms robust glycemic control and cardiovascular protective effects.',
            knownLimitations: [
                'GI side effects common',
                'Contraindicated in renal impairment',
            ],
            currentUse: 'Type 2 Diabetes (first-line)',
        },
        {
            id: 'pioglitazone_t2d',
            name: 'Pioglitazone',
            confidenceScore: 86,
            confidenceTier: 'high',
            mechanismSummary: 'Thiazolidinedione improving insulin sensitivity through PPAR-γ activation and adipocyte differentiation.',
            targets: ['pparg'],
            pathways: ['insulin', 'inflammation'],
            diseaseRelevance: 'Effective insulin sensitizer with potential cardiovascular and neuroprotective benefits.',
            knownLimitations: [
                'Weight gain and fluid retention',
                'Bone fracture risk in women',
            ],
            currentUse: 'Type 2 Diabetes',
        },
    ],
};

// Flatten all drugs for search/reference
export const allDrugs: Drug[] = Object.values(drugsByDisease).flat();
