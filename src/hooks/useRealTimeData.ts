import { useEffect, useMemo, useRef, useState } from 'react';
import { RiskLevel, SystemMode, type MonitoringArea, type Alert, type HistoricalData } from '../types';
import { buildAutomatedAlerts, evaluateAreaRisk } from '../domain/riskEngine';
import { buildAreaSignalMap, type ExternalAreaSignal, type LiveDynamicArea } from '../domain/dataIngestion';
import { INITIAL_AREAS } from '../data/initialAreas';
import { mergeLiveAreas } from '../domain/liveAreaExpansion';
import { buildTideAlert, shouldRefreshAreaSnapshot } from '../domain/liveTemporalRules';

const INITIAL_ALERTS: Alert[] = [];

const HISTORICAL_BASELINE: HistoricalData[] = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}:00`,
  rain: 20 + Math.random() * 60,
  risk: 30 + Math.random() * 70,
}));

const STREAM_URL = '/api/realtime-signals';

function adaptRecommendationsForCitizen(items: string[]): string[] {
  return items.map((item) =>
    item
      .replace('Interditar área de risco', 'Evite circular na área e siga as orientações da Defesa Civil')
      .replace('Preparar evacuação preventiva', 'Prepare documentos e itens essenciais para saída rápida')
      .replace('Monitorar a cada 30 min', 'Acompanhe novos avisos a cada 30 minutos')
      .replace('Interdição preventiva', 'Evite acesso ao local até novo aviso')
      .replace('Equipes em prontidão', 'Equipes públicas já foram acionadas')
  );
}

function applySignal(area: MonitoringArea, signal: Omit<ExternalAreaSignal, 'areaId'> | undefined, mode: 'operator' | 'citizen'): MonitoringArea {
  if (!signal) {
    const evaluatedWithoutLiveSignal = evaluateAreaRisk({
      ...area,
      rainIntensity: 0,
      trend: 'stable',
      confidence: 100,
      momentum: 0,
    });

    if (mode === 'operator') return evaluatedWithoutLiveSignal;

    const citizenPlaybookStatus = evaluatedWithoutLiveSignal.riskLevel === RiskLevel.EXTREME || evaluatedWithoutLiveSignal.riskLevel === RiskLevel.CRITICAL
      ? 'active'
      : 'pending';

    return {
      ...evaluatedWithoutLiveSignal,
      confidence: 100,
      assignedTeams: 0,
      playbookStatus: citizenPlaybookStatus,
      recommendations: adaptRecommendationsForCitizen(evaluatedWithoutLiveSignal.recommendations),
    };
  }

  const evaluated = evaluateAreaRisk({
    ...area,
    rainIntensity: signal.rainMmPerHour,
    trend: signal.trend,
    confidence: 100,
    momentum: signal.momentum,
  });

  if (mode === 'operator') return evaluated;

  const citizenPlaybookStatus = evaluated.riskLevel === RiskLevel.EXTREME || evaluated.riskLevel === RiskLevel.CRITICAL
    ? 'active'
    : 'pending';

  return {
    ...evaluated,
    assignedTeams: 0,
    playbookStatus: citizenPlaybookStatus,
    recommendations: adaptRecommendationsForCitizen(evaluated.recommendations),
  };
}

export function useRealTimeData() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [historicalBaseline] = useState<HistoricalData[]>(HISTORICAL_BASELINE);
  const [systemMode, setSystemMode] = useState<SystemMode>(SystemMode.CRITICAL);
  const [globalRiskScore, setGlobalRiskScore] = useState(74);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [decisionMode, setDecisionMode] = useState<'operator' | 'citizen'>('operator');
  const [areas, setAreas] = useState<MonitoringArea[]>(INITIAL_AREAS);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string>(new Date().toISOString());
  const [isSearchingRiskAreas, setIsSearchingRiskAreas] = useState(false);
  const [lastRiskSearchAt, setLastRiskSearchAt] = useState<string | null>(null);
  const [riskSearchResult, setRiskSearchResult] = useState<{
    scannedAreas: number;
    criticalAreas: number;
    extremeAreas: number;
    generatedAlerts: number;
  } | null>(null);
  const previousTideRef = useRef<number>(0);

  const addStationToArea = (areaId: string, stationName?: string) => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;

        const nextIndex = area.stations.length + 1;
        const sanitizedName = stationName?.trim();
        const newStation = {
          id: `${area.id}-st-${Date.now()}`,
          name: sanitizedName && sanitizedName.length > 0 ? sanitizedName : `Estação ${nextIndex}`,
          capacity: 100,
          currentUsage: 0,
          status: 'online' as const,
        };

        return {
          ...area,
          stations: [...area.stations, newStation],
        };
      })
    );
  };

  const globalStatus = useMemo<RiskLevel>(() => {
    if (!areas.length) return RiskLevel.SAFE;
    return areas.reduce((highest, area) => {
      const rank = {
        [RiskLevel.SAFE]: 0,
        [RiskLevel.ATTENTION]: 1,
        [RiskLevel.HIGH]: 2,
        [RiskLevel.CRITICAL]: 3,
        [RiskLevel.EXTREME]: 4,
      };

      return rank[area.riskLevel] > rank[highest] ? area.riskLevel : highest;
    }, RiskLevel.SAFE);
  }, [areas]);

  const triggerRiskSearch = () => {
    setIsSearchingRiskAreas(true);

    setAreas((prev) => {
      const refreshedAreas = prev.map((area) =>
        applySignal(
          {
            ...area,
            lastUpdate: new Date().toISOString(),
          },
          {
            rainMmPerHour: area.rainIntensity,
            trend: area.trend,
            momentum: area.momentum,
            confidence: 100,
          },
          decisionMode
        )
      );

      const autoAlerts = buildAutomatedAlerts(refreshedAreas, true);
      setAlerts(autoAlerts);

      const averageRisk = refreshedAreas.length
        ? refreshedAreas.reduce((sum, area) => sum + area.operationalPriority, 0) / refreshedAreas.length
        : 0;

      setGlobalRiskScore(Math.round(averageRisk));

      const criticalAreas = refreshedAreas.filter((area) => area.riskLevel === RiskLevel.CRITICAL).length;
      const extremeAreas = refreshedAreas.filter((area) => area.riskLevel === RiskLevel.EXTREME).length;

      setLastRiskSearchAt(new Date().toISOString());
      setRiskSearchResult({
        scannedAreas: refreshedAreas.length,
        criticalAreas,
        extremeAreas,
        generatedAlerts: autoAlerts.length,
      });

      return refreshedAreas;
    });

    setIsSearchingRiskAreas(false);
  };

  const confidence = useMemo(() => 100, []);

  useEffect(() => {
    const source = new EventSource(STREAM_URL);
    eventSourceRef.current = source;

    source.onopen = () => {
      setIsLiveConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          data: ExternalAreaSignal[];
          discoveredAreas?: LiveDynamicArea[];
          tideMeters?: number;
          generatedAt?: string;
        };

        const liveSignals = payload.data ?? [];
        const discoveredAreas = payload.discoveredAreas ?? [];
        const tideMeters = payload.tideMeters ?? 0;
        const generatedAt = payload.generatedAt ?? new Date().toISOString();

        const signalMap = buildAreaSignalMap(liveSignals);

        setAreas((prev) => {
          const withDynamicAreas = mergeLiveAreas(prev, discoveredAreas);
          const updatedAreas = withDynamicAreas.map((area) => applySignal(area, signalMap[area.id], decisionMode));
          const autoAlerts = buildAutomatedAlerts(updatedAreas, true);
          const tideAlert = buildTideAlert({
            previousMeters: previousTideRef.current,
            currentMeters: tideMeters,
            thresholdMeters: 1.9,
            areaName: 'Faixa costeira monitorada',
            municipality: 'RMR',
          });

          previousTideRef.current = tideMeters;

          setAlerts(tideAlert ? [tideAlert, ...autoAlerts] : autoAlerts);
          const averageRisk = updatedAreas.length
            ? updatedAreas.reduce((sum, area) => sum + area.operationalPriority, 0) / updatedAreas.length
            : 0;
          setGlobalRiskScore(Math.round(averageRisk));

          if (shouldRefreshAreaSnapshot(lastSnapshotAt, generatedAt)) {
            setLastSnapshotAt(generatedAt);
          }

          return updatedAreas;
        });
      } catch {
        setIsLiveConnected(false);
      }
    };

    source.onerror = () => {
      setIsLiveConnected(false);
      setAreas((prev) => {
        const updatedAreas = prev.map((area) => applySignal(area, undefined, decisionMode));
        const autoAlerts = buildAutomatedAlerts(updatedAreas, true);
        setAlerts(autoAlerts);
        const averageRisk = updatedAreas.length
          ? updatedAreas.reduce((sum, area) => sum + area.operationalPriority, 0) / updatedAreas.length
          : 0;
        setGlobalRiskScore(Math.round(averageRisk));
        return updatedAreas;
      });
      source.close();
    };

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [decisionMode, isSimulating, timeOffset, lastSnapshotAt]);

  return {
    areas,
    alerts,
    history: historicalBaseline,
    historicalBaseline,
    liveDataSource: 'realtime-signals',
    isLiveConnected,
    globalStatus,
    systemMode,
    setSystemMode,
    confidence,
    globalRiskScore,
    isSimulating,
    setIsSimulating,
    timeOffset,
    setTimeOffset,
    decisionMode,
    setDecisionMode,
    addStationToArea,
    isSearchingRiskAreas,
    lastRiskSearchAt,
    riskSearchResult,
    triggerRiskSearch,
  };
}
