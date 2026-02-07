import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AppState, Disease, Drug, ModelState } from '../types';
import { fetchPredictions, fetchDiseases } from '../services/predictionApi';

interface AppContextType extends AppState {
    setSelectedDisease: (disease: Disease | null) => void;
    setSelectedDrug: (drug: Drug | null) => void;
    setModelState: (state: ModelState) => void;
    setShowExplanation: (show: boolean) => void;
    // New: predictions and loading state
    predictions: Drug[];
    isLoading: boolean;
    error: string | null;
    diseases: Disease[];
    refreshDiseases: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [modelState, setModelState] = useState<ModelState>('analyzing');
    const [showExplanation, setShowExplanation] = useState(false);

    // New state for predictions and API data
    const [predictions, setPredictions] = useState<Drug[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [diseases, setDiseases] = useState<Disease[]>([]);

    // Fetch diseases on mount
    const refreshDiseases = useCallback(async () => {
        try {
            const fetchedDiseases = await fetchDiseases();
            setDiseases(fetchedDiseases);
        } catch (err) {
            console.error('Failed to fetch diseases:', err);
            // Keep existing diseases or empty array
        }
    }, []);

    useEffect(() => {
        refreshDiseases();
    }, [refreshDiseases]);

    // Fetch predictions when disease is selected
    useEffect(() => {
        if (selectedDisease) {
            setIsLoading(true);
            setError(null);
            setModelState('analyzing');
            setPredictions([]);
            setSelectedDrug(null);

            fetchPredictions(selectedDisease.id, 10)
                .then((drugs) => {
                    setPredictions(drugs);
                    setModelState('scoring');
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to fetch predictions:', err);
                    setError('Failed to fetch predictions. Is the backend server running?');
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
        setSelectedDisease,
        setSelectedDrug,
        setModelState,
        setShowExplanation,
        refreshDiseases,
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
