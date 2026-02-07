import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { diseases } from '../../data/diseases';
import { drugsByDisease } from '../../data/drugs';
import { fadeIn, scaleIn } from '../../utils/animations';

export function DiseaseList({ searchQuery = '' }: { searchQuery?: string }) {
    const { selectedDisease, setSelectedDisease, setSelectedDrug, setModelState } = useApp();

    // Filter diseases based on search query
    const filteredDiseases = diseases.filter(disease =>
        disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDiseaseSelect = (disease: typeof diseases[0]) => {
        // Update disease selection
        setSelectedDisease(disease);

        // Reset drug selection
        setSelectedDrug(null);

        // Trigger state progression: analyzing → matching → scoring
        setModelState('analyzing');
        setTimeout(() => setModelState('matching'), 800);
        setTimeout(() => setModelState('scoring'), 1600);
    };

    return (
        <motion.div
            className="space-y-1"
            {...fadeIn}
        >
            {filteredDiseases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No diseases found matching "{searchQuery}"
                </div>
            ) : (
                filteredDiseases.map((disease, index) => {
                    const isSelected = selectedDisease?.id === disease.id;
                    const hasDrugs = drugsByDisease[disease.id]?.length > 0;

                    return (
                        <motion.button
                            key={disease.id}
                            onClick={() => handleDiseaseSelect(disease)}
                            className={`
              w-full text-left px-4 py-3 rounded-lg
              transition-calm
              ${isSelected
                                    ? 'bg-accent/5 text-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
              focus-ring
            `}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className={`font-medium ${isSelected ? 'text-accent' : ''}`}>
                                        {disease.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {disease.category}
                                        {hasDrugs && ` · ${drugsByDisease[disease.id].length} candidates`}
                                    </div>
                                </div>
                                {isSelected && (
                                    <motion.div
                                        className="w-1 h-1 rounded-full bg-accent ml-2 mt-2"
                                        {...scaleIn}
                                    />
                                )}
                            </div>
                        </motion.button>
                    );
                })
            )}
        </motion.div>
    );
}

// Import scaleIn animation

