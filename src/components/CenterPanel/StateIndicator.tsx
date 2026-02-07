import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { fadeIn } from '../../utils/animations';

const stateLabels: Record<string, string> = {
    analyzing: 'Analyzing',
    matching: 'Matching',
    scoring: 'Scoring',
};

export function StateIndicator() {
    const { modelState, selectedDisease } = useApp();

    if (!selectedDisease) {
        return null;
    }

    return (
        <motion.div
            className="flex items-center gap-2 text-xs text-muted-foreground mb-6"
            {...fadeIn}
        >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-medium">{stateLabels[modelState]}</span>
        </motion.div>
    );
}
