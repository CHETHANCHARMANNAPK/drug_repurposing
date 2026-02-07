import { useState } from 'react';
import { motion } from 'framer-motion';

interface DiseaseSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function DiseaseSearch({ onSearch, placeholder = 'Search diseases...' }: DiseaseSearchProps) {
    const [query, setQuery] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
        >
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                   transition-all duration-200 placeholder:text-muted-foreground"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                     hover:text-foreground transition-colors duration-150"
                        aria-label="Clear search"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 4L4 12M4 4L12 12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </motion.div>
    );
}
