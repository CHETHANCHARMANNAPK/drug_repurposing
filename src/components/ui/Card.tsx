import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd'> {
    variant?: 'default' | 'elevated' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({
        children,
        variant = 'default',
        padding = 'md',
        interactive = false,
        className = '',
        ...props
    }, ref) => {
        const baseStyles = 'rounded-xl transition-all duration-200';

        const variantStyles = {
            default: 'bg-card border border-border',
            elevated: 'bg-card shadow-sm hover:shadow-md',
            flat: 'bg-muted/50',
        };

        const paddingStyles = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        const interactiveStyles = interactive
            ? 'cursor-pointer hover:border-accent/30 hover:shadow-sm'
            : '';

        const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${interactiveStyles} ${className}`;

        if (interactive) {
            return (
                <motion.div
                    ref={ref}
                    className={combinedClassName}
                    whileHover={{ scale: 1.005, y: -1 }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ duration: 0.15 }}
                    {...props}
                >
                    {children}
                </motion.div>
            );
        }

        return (
            <div
                ref={ref}
                className={combinedClassName}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
