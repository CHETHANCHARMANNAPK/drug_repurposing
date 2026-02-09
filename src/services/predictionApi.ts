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

// ============================================================================
// Extended Model API (v2) - Using 153K drug-disease pairs dataset
// ============================================================================

export interface APIExtendedDrug {
    id: string;
    name: string;
    description: string;
}

export interface APIRepurposingPrediction {
    drug_id: string;
    drug_name: string;
    score: number;
    confidenceTier: ConfidenceTier;
    gene_overlap: number;
    association_score: number;
    genetic_score: number;
    animal_model_score: number;
    known_drug_score: number;
    drug_max_phase: number;
    mechanismSummary: string;
    diseaseRelevance: string;
    knownLimitations: string[];
    targets: string[];
    pathways: string[];
}

export interface APIRepurposingResponse {
    disease: {
        id: string;
        name: string;
    };
    predictions: APIRepurposingPrediction[];
    total_candidates: number;
    model: string;
}

export interface APIDiseasesByDrugPrediction {
    disease_id: string;
    disease_name: string;
    score: number;
    confidenceTier: ConfidenceTier;
    gene_overlap: number;
    association_score: number;
    genetic_score: number;
    mechanismSummary: string;
}

export interface APIDiseasesByDrugResponse {
    drug: {
        id: string;
        name: string;
    };
    predictions: APIDiseasesByDrugPrediction[];
    total_diseases: number;
    model: string;
}

/**
 * Paginated diseases response from API
 */
export interface PaginatedDiseasesResponse {
    diseases: APIDisease[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

/**
 * Fetch paginated list of diseases from extended model dataset
 * @param search - Optional search query to filter diseases
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 50)
 */
export async function fetchV2Diseases(search: string = '', page: number = 1, limit: number = 50): Promise<PaginatedDiseasesResponse> {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await fetch(`${API_BASE_URL}/v2/diseases?${params}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching v2 diseases:', error);
        throw error;
    }
}

/**
 * Fetch list of drugs from extended model dataset
 */
export async function fetchV2Drugs(): Promise<APIExtendedDrug[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/v2/drugs`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching v2 drugs:', error);
        throw error;
    }
}

/**
 * Fetch repurposing predictions for a disease using the extended model
 */
export async function fetchRepurposingPredictions(diseaseId: string, topK: number = 20): Promise<Drug[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/repurpose/${encodeURIComponent(diseaseId)}?top_k=${topK}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: APIRepurposingResponse = await response.json();

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
            originalUse: undefined,
            currentUse: undefined,
            genericName: undefined,
            mechanism: p.mechanismSummary,
            // Extended model fields
            geneticScore: p.genetic_score,
            animalModelScore: p.animal_model_score,
            knownDrugScore: p.known_drug_score,
            drugMaxPhase: p.drug_max_phase
        }));
    } catch (error) {
        console.error('Error fetching repurposing predictions:', error);
        throw error;
    }
}

/**
 * Fetch diseases that a drug could potentially treat
 */
export async function fetchDiseasesByDrug(drugId: string, topK: number = 20): Promise<APIDiseasesByDrugResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/drug-diseases/${encodeURIComponent(drugId)}?top_k=${topK}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching diseases by drug:', error);
        throw error;
    }
}

/**
 * Check health of extended API model
 */
export async function checkApiHealthV2(): Promise<{
    original_model_loaded: boolean;
    api_model_loaded: boolean;
    api_data_loaded: boolean;
    api_data_size: number;
}> {
    try {
        const response = await fetch(`${API_BASE_URL}/v2/health`);
        if (!response.ok) throw new Error('Health check failed');
        return await response.json();
    } catch {
        return {
            original_model_loaded: false,
            api_model_loaded: false,
            api_data_loaded: false,
            api_data_size: 0
        };
    }
}

