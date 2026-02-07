import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { drugsByDisease } from '../../data/drugs';
import { DrugCard } from './DrugCard';
import { fadeIn } from '../../utils/animations';

export function DrugList() {
    const { selectedDisease, selectedDrug, setSelectedDrug } = useApp();

    if (!selectedDisease) {
        return null;
    }

    const drugs = drugsByDisease[selectedDisease.id] || [];

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
