import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, Disease, Drug, ModelState } from '../types';

interface AppContextType extends AppState {
    setSelectedDisease: (disease: Disease | null) => void;
    setSelectedDrug: (drug: Drug | null) => void;
    setModelState: (state: ModelState) => void;
    setShowExplanation: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [modelState, setModelState] = useState<ModelState>('analyzing');
    const [showExplanation, setShowExplanation] = useState(false);

    const value: AppContextType = {
        selectedDisease,
        selectedDrug,
        modelState,
        showExplanation,
        setSelectedDisease,
        setSelectedDrug,
        setModelState,
        setShowExplanation,
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
