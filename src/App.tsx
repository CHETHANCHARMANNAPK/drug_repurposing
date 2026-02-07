import { AppProvider } from './context/AppContext';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { ExplanationPanel } from './components/ExplanationPanel/ExplanationPanel';
import { DemoLanding } from './components/DemoLanding';

function App() {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Three-column fixed layout */}
        <div className="w-80 flex-shrink-0">
          <LeftPanel />
        </div>

        <div className="flex-1 min-w-0">
          <CenterPanel />
        </div>

        <div className="w-96 flex-shrink-0">
          <RightPanel />
        </div>
      </div>

      {/* Overlays */}
      <ExplanationPanel />
      <DemoLanding />
    </AppProvider>
  );
}

export default App;
