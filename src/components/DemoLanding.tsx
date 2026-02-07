import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { diseases } from '../data/diseases';
import { drugsByDisease } from '../data/drugs';
import { fadeIn } from '../utils/animations';

export function DemoLanding() {
    const { selectedDisease, setSelectedDisease, setModelState } = useApp();

    // If a disease is already selected, don't show landing
    if (selectedDisease) {
        return null;
    }

    const handleTryDemo = () => {
        // Select Alzheimer's as the demo case
        const demoDisease = diseases.find(d => d.id === 'alzheimers');
        if (demoDisease) {
            setSelectedDisease(demoDisease);
            setModelState('analyzing');
            setTimeout(() => setModelState('matching'), 800);
            setTimeout(() => setModelState('scoring'), 1600);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-white z-40 flex items-center justify-center"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="max-w-2xl mx-auto px-8 text-center">
                    <motion.div {...fadeIn}>
                        {/* Title */}
                        <h1 className="text-4xl font-semibold tracking-tight mb-4">
                            AI-Driven Drug Discovery
                        </h1>
                        <h2 className="text-xl text-muted-foreground mb-12">
                            Explainable repurposing intelligence
                        </h2>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-8 mb-12">
                            <div>
                                <div className="text-3xl font-semibold text-accent">
                                    {diseases.length}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Disease contexts
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-semibold text-accent">
                                    {Object.values(drugsByDisease).flat().length}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Candidate drugs
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-semibold text-accent">
                                    &lt;30s
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    To insight
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={handleTryDemo}
                            className="
                px-8 py-4 bg-accent text-white rounded-lg
                font-medium text-base
                hover:bg-accent/90 transition-calm
                focus-ring shadow-soft-md
              "
                        >
                            Try Sample Case
                        </button>

                        {/* Subtitle */}
                        <p className="text-sm text-muted-foreground mt-6 max-w-md mx-auto leading-relaxed">
                            Explore AI-powered drug repurposing with transparent, explainable intelligence.
                            No login required.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
