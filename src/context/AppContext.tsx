import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AppState, Disease, Drug, ModelState } from '../types';
import { fetchV2Diseases, fetchRepurposingPredictions, PaginatedDiseasesResponse } from '../services/predictionApi';

interface AppContextType extends AppState {
    setSelectedDisease: (disease: Disease | null) => void;
    setSelectedDrug: (drug: Drug | null) => void;
    setModelState: (state: ModelState) => void;
    setShowExplanation: (show: boolean) => void;
    predictions: Drug[];
    isLoading: boolean;
    error: string | null;
    diseases: Disease[];
    totalDiseases: number;
    searchDiseases: (query: string) => Promise<void>;
    loadMoreDiseases: () => Promise<void>;
    searchQuery: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [modelState, setModelState] = useState<ModelState>('analyzing');
    const [showExplanation, setShowExplanation] = useState(false);

    const [predictions, setPredictions] = useState<Drug[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [totalDiseases, setTotalDiseases] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Load initial diseases (first 100 for fast startup)
    useEffect(() => {
        const loadInitial = async () => {
            try {
                setIsLoading(true);
                const response: PaginatedDiseasesResponse = await fetchV2Diseases('', 1, 100);
                setDiseases(response.diseases.map(d => ({
                    id: d.id,
                    name: d.name,
                    category: d.category || 'Disease',
                    description: d.description || ''
                })));
                setTotalDiseases(response.total);
                setCurrentPage(1);
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to load diseases:', err);
                setError('Failed to load diseases. Is the backend server running?');
                setIsLoading(false);
            }
        };
        loadInitial();
    }, []);

    // Search diseases (server-side)
    const searchDiseases = useCallback(async (query: string) => {
        try {
            setSearchQuery(query);
            setIsLoading(true);
            const response: PaginatedDiseasesResponse = await fetchV2Diseases(query, 1, 100);
            setDiseases(response.diseases.map(d => ({
                id: d.id,
                name: d.name,
                category: d.category || 'Disease',
                description: d.description || ''
            })));
            setTotalDiseases(response.total);
            setCurrentPage(1);
            setIsLoading(false);
        } catch (err) {
            console.error('Failed to search diseases:', err);
            setIsLoading(false);
        }
    }, []);

    // Load more diseases (for infinite scroll or "load more" button)
    const loadMoreDiseases = useCallback(async () => {
        if (isLoading || diseases.length >= totalDiseases) return;

        try {
            setIsLoading(true);
            const nextPage = currentPage + 1;
            const response: PaginatedDiseasesResponse = await fetchV2Diseases(searchQuery, nextPage, 100);
            setDiseases(prev => [...prev, ...response.diseases.map(d => ({
                id: d.id,
                name: d.name,
                category: d.category || 'Disease',
                description: d.description || ''
            }))]);
            setCurrentPage(nextPage);
            setIsLoading(false);
        } catch (err) {
            console.error('Failed to load more diseases:', err);
            setIsLoading(false);
        }
    }, [isLoading, diseases.length, totalDiseases, searchQuery, currentPage]);

    // Fetch predictions when disease is selected
    useEffect(() => {
        if (selectedDisease) {
            setIsLoading(true);
            setError(null);
            setModelState('analyzing');
            setPredictions([]);
            setSelectedDrug(null);

            fetchRepurposingPredictions(selectedDisease.id, 20)
                .then((drugs) => {
                    setPredictions(drugs);
                    setModelState('scoring');
                    setIsLoading(false);
                    if (drugs.length === 0) {
                        setError('No drug candidates found for this disease.');
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch predictions:', err);
                    setError('Failed to fetch predictions. Is the backend running?');
                    setIsLoading(false);
                    setModelState('analyzing');
                });
        } else {
            setPredictions([]);
            setSelectedDrug(null);
        }
    }, [selectedDisease]);

    const value: AppContextType = {
        selectedDisease,
        selectedDrug,
        modelState,
        showExplanation,
        predictions,
        isLoading,
        error,
        diseases,
        totalDiseases,
        searchQuery,
        setSelectedDisease,
        setSelectedDrug,
        setModelState,
        setShowExplanation,
        searchDiseases,
        loadMoreDiseases,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}


