import { useState } from 'react';
import { DiseaseList } from './DiseaseList';
import { DiseaseSearch } from './DiseaseSearch';
import { AdvancedInput } from './AdvancedInput';

export function LeftPanel() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="panel h-screen overflow-y-auto">
            <div className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-premium-title">Disease Context</h2>
                    <p className="text-premium-body mt-1">
                        Select a condition to explore repurposing candidates
                    </p>
                </div>

                {/* Search */}
                <DiseaseSearch onSearch={setSearchQuery} />

                {/* Disease List */}
                <div className="flex-1 overflow-y-auto min-h-0 mb-6">
                    <DiseaseList searchQuery={searchQuery} />
                </div>

                {/* Advanced Input */}
                <div className="mt-auto">
                    <AdvancedInput />
                </div>
            </div>
        </div>
    );
}
