import { motion } from 'framer-motion';
import { Drug } from '../../types';
import { useApp } from '../../context/AppContext';

interface DrugCardProps {
    drug: Drug;
    rank: number;
    isActive: boolean;
    onClick: () => void;
}

export function DrugCard({ drug, rank, isActive, onClick }: DrugCardProps) {
    const isTopCandidate = rank === 1;

    return (
        <motion.button
            onClick={onClick}
            className={`
        w-full text-left rounded-lg border transition-calm
        ${isActive
                    ? 'bg-accent/5 border-accent/30'
                    : 'bg-white border-border hover:border-accent/20 hover:bg-accent/[0.02]'
                }
        ${isTopCandidate ? 'p-5' : 'p-4'}
        focus-ring
      `}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05, duration: 0.2 }}
        >
            {/* Rank Badge */}
            <div className="flex items-start justify-between mb-2">
                <div
                    className={`
            inline-flex items-center justify-center rounded-full
            ${isTopCandidate
                            ? 'w-7 h-7 bg-accent text-white text-xs font-semibold'
                            : 'w-6 h-6 bg-muted text-muted-foreground text-xs font-medium'
                        }
          `}
                >
                    {rank}
                </div>
                <div className="text-right">
                    <div
                        className={`
              text-xs font-medium
              ${drug.confidenceTier === 'high'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }
            `}
                    >
                        {drug.confidenceScore}% confidence
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {drug.confidenceTier}
                    </div>
                </div>
            </div>

            {/* Drug Name */}
            <h3
                className={`
          font-semibold
          ${isTopCandidate ? 'text-lg' : 'text-base'}
          ${isActive ? 'text-accent' : 'text-foreground'}
        `}
            >
                {drug.name}
            </h3>

            {/* Generic Name */}
            {drug.genericName && drug.genericName !== drug.name && (
                <div className="text-xs text-muted-foreground mt-0.5">
                    {drug.genericName}
                </div>
            )}

            {/* Current Use */}
            {drug.currentUse && (
                <div className="mt-2 text-xs text-muted-foreground">
                    Current use: {drug.currentUse}
                </div>
            )}

            {/* Mechanism (truncated) */}
            <p className={`text-premium-body mt-2 line-clamp-2 ${isTopCandidate ? '' : 'text-xs'}`}>
                {drug.mechanismSummary}
            </p>
        </motion.button>
    );
}
