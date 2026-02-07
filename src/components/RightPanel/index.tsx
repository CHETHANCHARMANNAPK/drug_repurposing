import { DrugList } from './DrugList';
import { useApp } from '../../context/AppContext';
import { ChevronRight } from 'lucide-react';

export function RightPanel() {
    const { showExplanation, setShowExplanation, selectedDrug } = useApp();

    return (
        <div className="panel h-screen overflow-y-auto">
            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-premium-title">Drug Candidates</h2>
                        <p className="text-premium-body mt-1">
                            Ranked by repurposing potential
                        </p>
                    </div>

                    {/* Explanation Toggle */}
                    {selectedDrug && (
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="
                flex items-center gap-1 px-3 py-1.5 rounded-lg
                text-xs font-medium text-accent
                hover:bg-accent/5 transition-calm focus-ring
              "
                        >
                            Explain
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showExplanation ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Drug List */}
                <DrugList />
            </div>
        </div>
    );
}
