import { useApp } from '../../context/AppContext';
import { StateIndicator } from './StateIndicator';
import { NetworkGraph } from './NetworkGraph';
import { AboutSection } from './AboutSection';
import { MolecularViewer } from './MolecularViewer';
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
                        {/* Two-column layout for visualizations */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Network Visualization */}
                            <div className="bg-white rounded-xl border border-border p-6" style={{ height: '400px' }}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Drug-Disease Network</h3>
                                <div style={{ height: 'calc(100% - 30px)' }}>
                                    <NetworkGraph data={graphData} />
                                </div>
                            </div>

                            {/* 3D Molecular Structure */}
                            <div className="bg-white rounded-xl border border-border p-6" style={{ height: '400px' }}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Molecular Structure</h3>
                                <div style={{ height: 'calc(100% - 30px)' }}>
                                    <MolecularViewer
                                        drugId={selectedDrug?.id || null}
                                        drugName={selectedDrug?.name}
                                    />
                                </div>
                            </div>
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
