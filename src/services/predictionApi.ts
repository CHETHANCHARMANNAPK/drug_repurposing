/**
 * Drug Repurposing Prediction API Client
 * 
 * Service for fetching diseases and drug predictions from the Flask backend.
 */

import { Disease, Drug, ConfidenceTier } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

// Types matching the API response
export interface APIDrugPrediction {
    drug_id: string;
    drug_name: string;
    score: number;
    confidenceTier: ConfidenceTier;
    gene_overlap: number;
    association_score: number;
    mechanismSummary: string;
    diseaseRelevance: string;
    knownLimitations: string[];
    targets: string[];
    pathways: string[];
}

export interface APIPredictionResponse {
    disease: {
        id: string;
        name: string;
    };
    predictions: APIDrugPrediction[];
}

export interface APIDisease {
    id: string;
    name: string;
    category: string;
    description: string;
}

/**
 * Fetch list of available diseases from the API
 */
export async function fetchDiseases(): Promise<Disease[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/diseases`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: APIDisease[] = await response.json();

        // Convert to frontend Disease type
        return data.map(d => ({
            id: d.id,
            name: d.name,
            category: d.category,
            description: d.description
        }));
    } catch (error) {
        console.error('Error fetching diseases:', error);
        throw error;
    }
}

/**
 * Fetch drug predictions for a specific disease
 */
export async function fetchPredictions(diseaseId: string, topK: number = 10): Promise<Drug[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/predict/${encodeURIComponent(diseaseId)}?top_k=${topK}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: APIPredictionResponse = await response.json();

        // Convert to frontend Drug type
        return data.predictions.map(p => ({
            id: p.drug_id,
            name: p.drug_name,
            confidenceScore: Math.round(p.score * 100),
            confidenceTier: p.confidenceTier,
            mechanismSummary: p.mechanismSummary,
            targets: p.targets,
            pathways: p.pathways,
            diseaseRelevance: p.diseaseRelevance,
            knownLimitations: p.knownLimitations,
            // Additional fields for display
            originalUse: undefined,
            currentUse: undefined,
            genericName: undefined,
            mechanism: p.mechanismSummary
        }));
    } catch (error) {
        console.error('Error fetching predictions:', error);
        throw error;
    }
}

/**
 * Check if the API is healthy
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) return false;

        const data = await response.json();
        return data.status === 'healthy' && data.model_loaded;
    } catch {
        return false;
    }
}
