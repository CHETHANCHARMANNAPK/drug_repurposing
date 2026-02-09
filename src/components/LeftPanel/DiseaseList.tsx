import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { fadeIn, scaleIn } from '../../utils/animations';

export function DiseaseList() {
    const {
        selectedDisease,
        setSelectedDisease,
        diseases,
        isLoading,
        totalDiseases,
        loadMoreDiseases,
        searchQuery
    } = useApp();

    const hasMore = diseases.length < totalDiseases;

    return (
        <motion.div
            className="space-y-1"
            {...fadeIn}
        >
            {diseases.length === 0 && !isLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery
                        ? `No diseases found matching "${searchQuery}"`
                        : 'No diseases available'}
                </div>
            ) : (
                <>
                    {diseases.map((disease, index) => {
                        const isSelected = selectedDisease?.id === disease.id;

                        return (
                            <motion.button
                                key={disease.id}
                                onClick={() => setSelectedDisease(disease)}
                                className={`
                                    w-full text-left px-4 py-3 rounded-lg
                                    transition-calm
                                    ${isSelected
                                        ? 'bg-accent/5 text-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                    focus-ring
                                `}
                                initial={index < 20 ? { opacity: 0, x: -8 } : false}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(index, 20) * 0.02, duration: 0.15 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className={`font-medium ${isSelected ? 'text-accent' : ''}`}>
                                            {disease.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {disease.category}
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
                    })}

                    {/* Load More Button */}
                    {hasMore && (
                        <button
                            onClick={loadMoreDiseases}
                            disabled={isLoading}
                            className="w-full py-3 text-sm text-accent hover:text-accent/80 
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-colors duration-150"
                        >
                            {isLoading ? 'Loading...' : `Load more (${totalDiseases - diseases.length} remaining)`}
                        </button>
                    )}
                </>
            )}

            {isLoading && diseases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    Loading diseases...
                </div>
            )}
        </motion.div>
    );
}

