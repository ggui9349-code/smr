import { useState, useMemo, useEffect } from 'react';
import { type MonitoringArea, type Alert, type HistoricalData, RiskLevel } from '../../types';
import { Sidebar } from './Sidebar';
import { MapComponent } from './MapComponent';
import { DetailPanel } from './DetailPanel';
import { TopAlert } from './TopAlert';
import { ContextFooter } from './ContextFooter';
import { AnimatePresence } from 'motion/react';

interface OperatorViewProps {
  areas: MonitoringArea[];
  alerts: Alert[];
  history: HistoricalData[];
  globalStatus: RiskLevel;
  confidence: number;
  globalRiskScore: number;
  isLiveConnected: boolean;
}

export function OperatorView({
  areas,
  alerts,
  globalStatus,
  isLiveConnected,
}: OperatorViewProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id ?? '');
  const [focusNonce, setFocusNonce] = useState(0);
  const [inspectNonce, setInspectNonce] = useState(0);
  const [isAlertCollapsed, setIsAlertCollapsed] = useState(false);

  useEffect(() => {
    if (!areas.length) return;
    const exists = areas.some((area) => area.id === selectedAreaId);
    if (!exists) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas, selectedAreaId]);

  const selectedArea = useMemo(() => {
    if (!areas.length) return null;
    return areas.find((area) => area.id === selectedAreaId) || areas[0];
  }, [areas, selectedAreaId]);

  const topAlertArea = useMemo(
    () => areas.find((area) => area.riskLevel === RiskLevel.EXTREME) || null,
    [areas]
  );

  if (!selectedArea) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col bg-[#0F172A] overflow-hidden">
      {/* Top 1 Alert Overlay/Header */}
      <AnimatePresence>
        {topAlertArea && (
          <TopAlert
            area={topAlertArea}
            isCollapsed={isAlertCollapsed}
            onToggleCollapse={() => setIsAlertCollapsed(!isAlertCollapsed)}
            isLiveConnected={isLiveConnected}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-row overflow-hidden">
        {/* Painel Esquerdo (20%) */}
        <aside className="w-[20%] border-r border-white/5 shadow-2xl z-20">
          <Sidebar
            areas={areas}
            selectedId={selectedAreaId}
            onSelect={(area) => setSelectedAreaId(area.id)}
            onFocusArea={(area) => {
              setSelectedAreaId(area.id);
              setFocusNonce((value) => value + 1);
            }}
            onInspectArea={(area) => {
              setSelectedAreaId(area.id);
              setInspectNonce((value) => value + 1);
            }}
          />
        </aside>

        {/* Mapa Central (60%) */}
        <main className="relative flex-1 z-10">
          <MapComponent
            areas={areas}
            onAreaSelect={(area) => setSelectedAreaId(area.id)}
            focusedArea={selectedArea}
            focusNonce={focusNonce}
          />
        </main>

        {/* Painel Direito (20%) */}
        <aside className="w-[20%] border-l border-white/5 shadow-2xl z-20 overflow-y-auto">
          <DetailPanel
            area={selectedArea}
            inspectNonce={inspectNonce}
            onRequestMapFocus={(area) => {
              setSelectedAreaId(area.id);
              setFocusNonce((value) => value + 1);
            }}
          />
        </aside>
      </div>

      {/* Footer Contextual */}
      <ContextFooter area={selectedArea} isLiveConnected={isLiveConnected} />
    </div>
  );
}
