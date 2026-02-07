import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { drugsByDisease } from '../../data/drugs';
import { DrugCard } from './DrugCard';
import { fadeIn } from '../../utils/animations';
import { Loader2 } from 'lucide-react';

export function DrugList() {
    const { selectedDisease, selectedDrug, setSelectedDrug, predictions, isLoading, error } = useApp();

    if (!selectedDisease) {
        return null;
    }

    // Show loading state
    if (isLoading) {
        return (
            <motion.div
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                {...fadeIn}
            >
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                <p className="text-sm">Analyzing drug candidates...</p>
            </motion.div>
        );
    }

    // Show error state
    if (error) {
        return (
            <motion.div
                className="text-center py-8"
                {...fadeIn}
            >
                <p className="text-sm text-red-500 mb-2">{error}</p>
                <p className="text-xs text-muted-foreground">
                    Using static data instead
                </p>
            </motion.div>
        );
    }

    // Use predictions from API, or fall back to static data
    const drugs = predictions.length > 0
        ? predictions
        : (drugsByDisease[selectedDisease.id] || []);

    if (drugs.length === 0) {
        return (
            <motion.div
                className="text-center text-muted-foreground text-sm py-8"
                {...fadeIn}
            >
                No candidates available for this condition
            </motion.div>
        );
    }

    return (
        <motion.div className="space-y-3" {...fadeIn}>
            {drugs.map((drug, index) => (
                <DrugCard
                    key={drug.id}
                    drug={drug}
                    rank={index + 1}
                    isActive={selectedDrug?.id === drug.id}
                    onClick={() => setSelectedDrug(drug)}
                />
            ))}
        </motion.div>
    );
}
