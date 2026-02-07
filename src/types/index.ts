// Core domain types

export type ModelState = 'analyzing' | 'matching' | 'scoring';

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface Disease {
    id: string;
    name: string;
    category: string;
    description: string;
}

export interface Target {
    id: string;
    name: string;
    type: 'protein' | 'enzyme' | 'receptor';
    description: string;
}

export interface Pathway {
    id: string;
    name: string;
    description: string;
}

export interface Drug {
    id: string;
    name: string;
    genericName?: string;
    confidenceScore: number; // 0-100
    confidenceTier: ConfidenceTier;
    mechanismSummary: string;
    mechanism?: string; // Added for Gemini service
    originalUse?: string; // Added for Gemini service
    targets: string[]; // Target IDs
    pathways: string[]; // Pathway IDs
    diseaseRelevance: string;
    knownLimitations: string[];
    currentUse?: string;
}

export interface GraphNode {
    id: string;
    type: 'drug' | 'target' | 'pathway';
    label: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    strength: number; // 0-1
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface AppState {
    selectedDisease: Disease | null;
    selectedDrug: Drug | null;
    modelState: ModelState;
    showExplanation: boolean;
}
