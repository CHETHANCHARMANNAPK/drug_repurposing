import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdvancedInput() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [molecularData, setMolecularData] = useState('');
    const [geneticData, setGeneticData] = useState('');

    return (
        <div className="mt-6 pt-6 border-t border-border">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left group"
            >
                <div>
                    <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors duration-150">
                        Advanced Input
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Optional molecular/genetic data
                    </p>
                </div>
                <motion.svg
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-muted-foreground group-hover:text-accent transition-colors duration-150"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </motion.svg>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 space-y-4">
                            {/* Molecular Data Input */}
                            <div>
                                <label
                                    htmlFor="molecular-data"
                                    className="block text-xs font-medium text-foreground mb-2"
                                >
                                    Molecular Signatures
                                </label>
                                <textarea
                                    id="molecular-data"
                                    value={molecularData}
                                    onChange={(e) => setMolecularData(e.target.value)}
                                    placeholder="Enter gene expression profiles, protein markers..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                           transition-all duration-200 placeholder:text-muted-foreground resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Enhances target matching and pathway analysis
                                </p>
                            </div>

                            {/* Genetic Data Input */}
                            <div>
                                <label
                                    htmlFor="genetic-data"
                                    className="block text-xs font-medium text-foreground mb-2"
                                >
                                    Genetic Variants
                                </label>
                                <textarea
                                    id="genetic-data"
                                    value={geneticData}
                                    onChange={(e) => setGeneticData(e.target.value)}
                                    placeholder="Enter SNPs, mutations, or genomic coordinates..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                           transition-all duration-200 placeholder:text-muted-foreground resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Refines drug-target predictions with genetic context
                                </p>
                            </div>

                            {/* Info Notice */}
                            <div className="bg-muted/30 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">Note:</strong> Advanced inputs are optional and will be integrated into the
                                    drug repurposing analysis if provided. Leave blank for standard disease-based search.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
