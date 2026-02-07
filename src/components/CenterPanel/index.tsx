import { useApp } from '../../context/AppContext';
import { StateIndicator } from './StateIndicator';
import { NetworkGraph } from './NetworkGraph';
import { AboutSection } from './AboutSection';
import { generateGraphData } from '../../data/graph';

export function CenterPanel() {
    const { selectedDrug, selectedDisease } = useApp();

    const graphData = generateGraphData(selectedDrug);

    return (
        <div className="flex-1 h-screen overflow-y-auto bg-muted/30">
            <div className="p-8">
                {/* Header with state indicator */}
                <div className="mb-6">
                    <h2 className="text-premium-title">Model Intelligence</h2>
                    <StateIndicator />
                </div>

                {selectedDisease ? (
                    <>
                        {/* Network Visualization */}
                        <div className="bg-white rounded-xl border border-border p-6 mb-6" style={{ height: '500px' }}>
                            <NetworkGraph data={graphData} />
                        </div>

                        {/* About Section */}
                        <div className="bg-white rounded-xl border border-border p-6">
                            {selectedDrug ? (
                                <AboutSection />
                            ) : (
                                <div className="text-center text-muted-foreground text-sm py-12">
                                    Select a drug candidate to view detailed analysis
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                        Select a disease from the left panel to begin
                    </div>
                )}
            </div>
        </div>
    );
}
