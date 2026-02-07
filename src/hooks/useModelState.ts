import { useState, useEffect } from 'react';

export type ModelState = 'idle' | 'analyzing' | 'matching' | 'scoring' | 'complete';

interface UseModelStateOptions {
    autoProgress?: boolean;
    delays?: {
        analyzing?: number;
        matching?: number;
        scoring?: number;
    };
}

const DEFAULT_DELAYS = {
    analyzing: 800,
    matching: 600,
    scoring: 500,
};

export function useModelState(
    trigger: boolean,
    options: UseModelStateOptions = {}
) {
    const [state, setState] = useState<ModelState>('idle');
    const { autoProgress = true, delays = DEFAULT_DELAYS } = options;

    useEffect(() => {
        if (!trigger) {
            setState('idle');
            return;
        }

        if (!autoProgress) {
            setState('analyzing');
            return;
        }

        // Auto-progress through states
        setState('analyzing');

        const analyzingTimer = setTimeout(() => {
            setState('matching');
        }, delays.analyzing || DEFAULT_DELAYS.analyzing);

        const matchingTimer = setTimeout(() => {
            setState('scoring');
        }, (delays.analyzing || DEFAULT_DELAYS.analyzing) + (delays.matching || DEFAULT_DELAYS.matching));

        const scoringTimer = setTimeout(() => {
            setState('complete');
        },
            (delays.analyzing || DEFAULT_DELAYS.analyzing) +
            (delays.matching || DEFAULT_DELAYS.matching) +
            (delays.scoring || DEFAULT_DELAYS.scoring)
        );

        return () => {
            clearTimeout(analyzingTimer);
            clearTimeout(matchingTimer);
            clearTimeout(scoringTimer);
        };
    }, [trigger, autoProgress, delays]);

    return {
        state,
        isAnalyzing: state === 'analyzing',
        isMatching: state === 'matching',
        isScoring: state === 'scoring',
        isComplete: state === 'complete',
        isIdle: state === 'idle',
    };
}
