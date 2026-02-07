// Framer Motion animation presets following premium design principles
// All animations: calm, predictable, no bounce, no elastic

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
};

export const slideIn = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
};

// Calm easing function (no bounce, no elastic)
export const calmEase = [0.4, 0, 0.2, 1] as const;

// Standard durations (150-250ms range)
export const durations = {
    fast: 0.15,
    normal: 0.2,
    slow: 0.25,
} as const;
