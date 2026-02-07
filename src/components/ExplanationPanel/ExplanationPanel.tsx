import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateExplanation } from '../../services/gemini';
import { fadeIn } from '../../utils/animations';

export function ExplanationPanel() {
    const { selectedDrug, selectedDisease, showExplanation, setShowExplanation } = useApp();
    const [explanation, setExplanation] = useState<{
        summary: string;
        mechanism: string;
        diseaseRelevance: string;
        confidence: string;
        limitations: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    // Generate explanation when drug/disease  changes
    useEffect(() => {
        if (!selectedDrug || !selectedDisease || !showExplanation) {
            return;
        }

        const fetchExplanation = async () => {
            setLoading(true);
            try {
                const result = await generateExplanation({
                    disease: selectedDisease,
                    drug: selectedDrug,
                    context: {
                        targets: selectedDrug.targets,
                        pathways: selectedDrug.pathways,
                    },
                });
                setExplanation(result);
            } catch (error) {
                console.error('Error fetching explanation:', error);
                // Fallback to default explanation
                setExplanation({
                    summary: selectedDrug.mechanismSummary,
                    mechanism: selectedDrug.mechanismSummary,
                    diseaseRelevance: selectedDrug.diseaseRelevance,
                    confidence: `${selectedDrug.confidenceScore}% confidence based on computational analysis`,
                    limitations: selectedDrug.knownLimitations.join('\n'),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchExplanation();
    }, [selectedDrug, selectedDisease, showExplanation]);

    if (!selectedDrug || !showExplanation) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-y-0 right-0 w-[480px] bg-white border-l border-border shadow-xl z-50 overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-border p-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">{selectedDrug.name}</h2>
                        <p className="text-xs text-muted-foreground mt-1 bg-amber-50 text-amber-700 px-2 py-1 rounded inline-block">
                            Generated explanation for interpretability
                        </p>
                    </div>
                    <button
                        onClick={() => setShowExplanation(false)}
                        className="p-2 hover:bg-muted rounded-lg transition-calm focus-ring"
                        aria-label="Close explanation panel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">Generating explanation...</p>
                        </div>
                    ) : explanation ? (
                        <>
                            {/* Summary */}
                            <motion.section {...fadeIn}>
                                <h3 className="text-premium-label mb-3">Summary</h3>
                                <p className="text-sm leading-relaxed text-foreground">
                                    {explanation.summary}
                                </p>
                            </motion.section>

                            {/* Mechanism */}
                            <motion.section {...fadeIn} transition={{ delay: 0.05 }}>
                                <h3 className="text-premium-label mb-3">Mechanism of Action</h3>
                                <p className="text-premium-body whitespace-pre-line">
                                    {explanation.mechanism}
                                </p>
                            </motion.section>

                            {/* Disease Relevance */}
                            <motion.section {...fadeIn} transition={{ delay: 0.1 }}>
                                <h3 className="text-premium-label mb-3">Disease Relevance</h3>
                                <p className="text-premium-body whitespace-pre-line">
                                    {explanation.diseaseRelevance}
                                </p>
                            </motion.section>

                            {/* Confidence Interpretation */}
                            <motion.section {...fadeIn} transition={{ delay: 0.15 }}>
                                <h3 className="text-premium-label mb-3">Confidence Interpretation</h3>
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Confidence Score</span>
                                        <span className="font-semibold text-foreground">{selectedDrug.confidenceScore}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Tier</span>
                                        <span className={`font-medium capitalize ${selectedDrug.confidenceTier === 'high' ? 'text-emerald-600' : 'text-amber-600'
                                            }`}>
                                            {selectedDrug.confidenceTier}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-premium-body mt-3 whitespace-pre-line">
                                    {explanation.confidence}
                                </p>
                            </motion.section>

                            {/* Known Limitations */}
                            <motion.section {...fadeIn} transition={{ delay: 0.2 }}>
                                <h3 className="text-premium-label mb-3">Known Limitations</h3>
                                <div className="space-y-2">
                                    {explanation.limitations.split('\n').filter(Boolean).map((limitation, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                                            <span className="text-premium-body">{limitation.replace(/^[•\-]\s*/, '')}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>

                            {/* Disclaimer */}
                            <motion.div
                                className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                                {...fadeIn}
                                transition={{ delay: 0.25 }}
                            >
                                <p className="text-xs text-amber-900 leading-relaxed">
                                    <strong className="font-semibold">Important:</strong> This analysis is generated for research
                                    and interpretability purposes. All repurposing candidates require rigorous clinical validation.
                                    This tool does not provide medical advice or treatment recommendations.
                                </p>
                            </motion.div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No explanation available
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
