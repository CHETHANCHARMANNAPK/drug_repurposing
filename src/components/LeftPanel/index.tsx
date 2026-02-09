import { useCallback, useRef } from 'react';
import { DiseaseList } from './DiseaseList';
import { DiseaseSearch } from './DiseaseSearch';
import { AdvancedInput } from './AdvancedInput';
import { useApp } from '../../context/AppContext';

export function LeftPanel() {
    const { searchDiseases, totalDiseases, diseases } = useApp();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced server-side search
    const handleSearch = useCallback((query: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            searchDiseases(query);
        }, 300); // 300ms debounce
    }, [searchDiseases]);

    return (
        <div className="panel h-screen overflow-y-auto">
            <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-premium-title">Disease Context</h2>
                    <p className="text-premium-body mt-1">
                        {totalDiseases > 0
                            ? `${diseases.length} of ${totalDiseases.toLocaleString()} diseases loaded`
                            : 'Loading diseases...'}
                    </p>
                </div>

                {/* Search */}
                <DiseaseSearch onSearch={handleSearch} placeholder="Search 24,793 diseases..." />

                {/* Disease List */}
                <div className="flex-1 overflow-y-auto min-h-0 mb-6">
                    <DiseaseList />
                </div>

                {/* Advanced Input */}
                <div className="mt-auto">
                    <AdvancedInput />
                </div>
            </div>
        </div>
    );
}

