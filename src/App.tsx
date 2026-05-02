import { Header } from './components/Dashboard/Header';
import { OperatorView } from './components/Dashboard/OperatorView';
import { CitizenView } from './components/Citizen/CitizenView';
import { useRealTimeData } from './hooks/useRealTimeData';
import { SystemMode } from './types';

export default function App() {
  const {
    areas,
    alerts,
    historicalBaseline,
    globalStatus,
    confidence,
    globalRiskScore,
    isLiveConnected,
    isSimulating,
    setIsSimulating,
    decisionMode,
    setDecisionMode,
    addStationToArea,
    isSearchingRiskAreas,
    lastRiskSearchAt,
    riskSearchResult,
    triggerRiskSearch,
  } = useRealTimeData();
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0B1220] text-white">
      <Header
        status={globalStatus}
        mode={SystemMode.CRITICAL}
        confidence={Number(confidence.toFixed(1))}
        globalRiskScore={globalRiskScore}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        decisionMode={decisionMode}
        onModeToggle={setDecisionMode}
        isLiveConnected={isLiveConnected}
      />

      {decisionMode === 'citizen' ? (
        <CitizenView areas={areas} />
      ) : (
        <OperatorView
          areas={areas}
          alerts={alerts}
          history={historicalBaseline}
          globalStatus={globalStatus}
          confidence={confidence}
          globalRiskScore={globalRiskScore}
          isLiveConnected={isLiveConnected}
          onAddStation={addStationToArea}
          isSearchingRiskAreas={isSearchingRiskAreas}
          lastRiskSearchAt={lastRiskSearchAt}
          riskSearchResult={riskSearchResult}
          onTriggerRiskSearch={triggerRiskSearch}
        />      )}
    </div>
  );
}
