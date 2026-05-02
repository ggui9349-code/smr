import type { MonitoringArea } from '../types';

interface LiveObservation {
  observedRainMmPerHour: number;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
  floodedStreets?: Array<{
    street: string;
    municipality: string;
    coordinates: [number, number];
    severity: 'attention' | 'high' | 'critical' | 'extreme';
  }>;
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
  discoveredAreas: Array<{
    areaId: string;
    areaName: string;
    municipality: string;
    coordinates: [number, number];
  }>;
} {
  const baseRain = Number(observation.observedRainMmPerHour.toFixed(1));

  const data = areas.map((area) => ({
    areaId: area.id,
    rainMmPerHour: baseRain,
    trend: observation.trend,
    confidence: Math.max(0, Math.min(100, Number(observation.confidence.toFixed(1)))),
    momentum: observation.trend === 'rising' ? 1 : observation.trend === 'falling' ? 0.2 : 0.5,
  }));

  const floodedStreets = observation.floodedStreets ?? [];

  const discoveredAreas = floodedStreets.map((street, index) => ({
    areaId: `pe-${street.municipality.toLowerCase().replace(/\s+/g, '-')}-${street.street.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    areaName: street.street,
    municipality: street.municipality,
    coordinates: street.coordinates,
  }));

  const severityRainMap: Record<'attention' | 'high' | 'critical' | 'extreme', number> = {
    attention: 35,
    high: 55,
    critical: 75,
    extreme: 95,
  };

  const severityMomentumMap: Record<'attention' | 'high' | 'critical' | 'extreme', number> = {
    attention: 0.5,
    high: 0.7,
    critical: 0.9,
    extreme: 1,
  };

  const dynamicSignals: ExternalAreaSignal[] = floodedStreets.map((street, index) => ({
    areaId: discoveredAreas[index].areaId,
    rainMmPerHour: severityRainMap[street.severity],
    trend: 'rising',
    confidence: 100,
    momentum: severityMomentumMap[street.severity],
  }));

  return {
    generatedAt: new Date().toISOString(),
    data: [...data, ...dynamicSignals],
    discoveredAreas,
  };
}
