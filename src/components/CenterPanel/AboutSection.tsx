import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { targets } from '../../data/targets';
import { pathways } from '../../data/pathways';
import { fadeIn } from '../../utils/animations';
import { Button } from '../ui/Button';

export function AboutSection() {
    const { selectedDrug, selectedDisease, setShowExplanation } = useApp();

    if (!selectedDrug || !selectedDisease) {
        return null;
    }

    return (
        <motion.div className="mt-8 space-y-6" {...fadeIn}>
            {/* Header with Explain Button */}
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-semibold text-foreground">Drug Details</h3>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowExplanation(true)}
                    className="flex items-center gap-2 text-xs h-8"
                >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    Explain with Gemini
                </Button>
            </div>

            {/* Mechanism */}
            <div>
                <h3 className="text-premium-label mb-2">Mechanism of Action</h3>
                <p className="text-premium-body">
                    {selectedDrug.mechanismSummary}
                </p>
            </div>

            {/* Targets */}
            <div>
                <h3 className="text-premium-label mb-2">Target Interactions</h3>
                <div className="flex flex-wrap gap-2">
                    {selectedDrug.targets.map((targetId) => {
                        const target = targets[targetId];
                        return target ? (
                            <span
                                key={targetId}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full"
                            >
                                {target.name}
                            </span>
                        ) : null;
                    })}
                </div>
            </div>

            {/* Pathways */}
            <div>
                <h3 className="text-premium-label mb-2">Affected Pathways</h3>
                <div className="flex flex-wrap gap-2">
                    {selectedDrug.pathways.map((pathwayId) => {
                        const pathway = pathways[pathwayId];
                        return pathway ? (
                            <span
                                key={pathwayId}
                                className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full"
                            >
                                {pathway.name}
                            </span>
                        ) : null;
                    })}
                </div>
            </div>

            {/* Disease Relevance */}
            <div>
                <h3 className="text-premium-label mb-2">Disease Relevance</h3>
                <p className="text-premium-body">
                    {selectedDrug.diseaseRelevance}
                </p>
            </div>
        </motion.div>
    );
}
