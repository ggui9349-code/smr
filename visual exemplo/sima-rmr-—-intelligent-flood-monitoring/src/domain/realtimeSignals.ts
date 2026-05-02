import type { MonitoringArea } from '../types';

interface LiveObservation {
  observedRainMmPerHour: number;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
}

interface ExternalAreaSignal {
  areaId: string;
  rainMmPerHour: number;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
  momentum: number;
}

export function buildLiveSignalPayload(areas: MonitoringArea[], observation: LiveObservation): {
  generatedAt: string;
  data: ExternalAreaSignal[];
} {
  const data = areas.map((area) => ({
    areaId: area.id,
    rainMmPerHour: Number(observation.observedRainMmPerHour.toFixed(1)),
    trend: observation.trend,
    confidence: Math.max(0, Math.min(100, Number(observation.confidence.toFixed(1)))),
    momentum: observation.trend === 'rising' ? 1 : observation.trend === 'falling' ? 0.2 : 0.5,
  }));

  return {
    generatedAt: new Date().toISOString(),
    data,
  };
}
