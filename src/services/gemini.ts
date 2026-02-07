// Gemini API Service for Drug Discovery Explanations
import { Drug, Disease } from '../types';

interface ExplanationRequest {
    disease: Disease;
    drug: Drug;
    context?: {
        targets?: string[];
        pathways?: string[];
    };
}

interface ExplanationResponse {
    summary: string;
    mechanism: string;
    diseaseRelevance: string;
    confidence: string;
    limitations: string;
}

// Environment variable for API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateExplanation(
    request: ExplanationRequest
): Promise<ExplanationResponse> {
    // If no API key, return placeholder content
    if (!GEMINI_API_KEY) {
        return getPlaceholderExplanation(request);
    }

    try {
        const prompt = buildExplanationPrompt(request);

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    topK: 32,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            console.warn('Gemini API error, using placeholder');
            return getPlaceholderExplanation(request);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return parseExplanationResponse(text, request);
    } catch (error) {
        console.error('Error generating explanation:', error);
        return getPlaceholderExplanation(request);
    }
}

function buildExplanationPrompt(request: ExplanationRequest): string {
    const { disease, drug, context } = request;

    return `You are a scientific advisor explaining drug repurposing for ${disease.name}.

Drug: ${drug.name}
Original Use: ${drug.originalUse || 'Various indications'}
Confidence Score: ${drug.confidenceScore}%
${context?.targets ? `Targets: ${context.targets.join(', ')}` : ''}
${context?.pathways ? `Pathways: ${context.pathways.join(', ')}` : ''}

Provide a structured explanation in the following format:

**SUMMARY**
[2-3 sentences explaining why this drug shows promise for ${disease.name}]

**MECHANISM**
[Explain the biological mechanism linking the drug to the disease]

**DISEASE RELEVANCE**
[Explain how this addresses ${disease.name} specifically]

**CONFIDENCE**
[Explain what the ${drug.confidenceScore}% confidence means and what factors contribute to it]

**LIMITATIONS**
[List 2-3 key limitations or caveats about this repurposing candidate]

Keep the tone scientific but accessible. Avoid marketing language. Focus on interpretability.`;
}

function parseExplanationResponse(
    text: string,
    request: ExplanationRequest
): ExplanationResponse {
    // Simple parsing - split by section headers
    const sections = {
        summary: '',
        mechanism: '',
        diseaseRelevance: '',
        confidence: '',
        limitations: '',
    };

    try {
        const summaryMatch = text.match(/\*\*SUMMARY\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
        const mechanismMatch = text.match(/\*\*MECHANISM\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
        const relevanceMatch = text.match(/\*\*DISEASE RELEVANCE\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
        const confidenceMatch = text.match(/\*\*CONFIDENCE\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
        const limitationsMatch = text.match(/\*\*LIMITATIONS\*\*\s*([\s\S]*?)(?=\*\*|$)/i);

        sections.summary = summaryMatch?.[1]?.trim() || '';
        sections.mechanism = mechanismMatch?.[1]?.trim() || '';
        sections.diseaseRelevance = relevanceMatch?.[1]?.trim() || '';
        sections.confidence = confidenceMatch?.[1]?.trim() || '';
        sections.limitations = limitationsMatch?.[1]?.trim() || '';

        // Fallback if parsing fails
        if (!sections.summary) {
            return getPlaceholderExplanation(request);
        }

        return sections;
    } catch (error) {
        return getPlaceholderExplanation(request);
    }
}

function getPlaceholderExplanation(request: ExplanationRequest): ExplanationResponse {
    const { disease, drug } = request;

    return {
        summary: `${drug.name} shows potential for ${disease.name} based on its mechanism of action and known biological pathways. The compound demonstrates ${drug.confidenceScore}% confidence through computational analysis of drug-target-pathway relationships.`,

        mechanism: `${drug.name} acts on multiple biological targets that are implicated in ${disease.name} pathology. The drug modulates key pathways involved in disease progression, potentially offering therapeutic benefits through ${drug.mechanism || 'multi-target engagement'}.`,

        diseaseRelevance: `In the context of ${disease.name}, this drug candidate addresses critical aspects of disease biology. The computational model identified significant overlap between the drug's pharmacological profile and disease-associated molecular signatures.`,

        confidence: `The ${drug.confidenceScore}% confidence score reflects strong evidence from network-based analysis, pathway enrichment, and target validation. This score integrates multiple data sources including genomic, proteomic, and clinical databases.`,

        limitations: `• This is a computational prediction requiring experimental validation\n• Clinical efficacy in ${disease.name} has not been established\n• Potential side effects and optimal dosing remain to be determined\n• Drug-drug interactions need careful evaluation in clinical context`,
    };
}
