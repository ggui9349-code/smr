import { RiskLevel, type MonitoringArea } from '../types';

export type LiveAreaCandidate = {
  areaId: string;
  areaName: string;
  municipality: string;
  coordinates: [number, number];
};

function toMonitoringArea(candidate: LiveAreaCandidate): MonitoringArea {
  return {
    id: candidate.areaId,
    name: candidate.areaName,
    municipality: candidate.municipality,
    coordinates: candidate.coordinates,
    riskLevel: RiskLevel.ATTENTION,
    classification: 'R1',
    populationAtRisk: 80,
    housesAtRisk: 30,
    rainIntensity: 0,
    lastUpdate: new Date().toISOString(),
    trend: 'stable',
    eta: '120 min',
    confidence: 70,
    momentum: 0.2,
    causes: [{ label: 'Nova área detectada em monitoramento ao vivo', intensity: 40 }],
    recommendations: ['Monitorar a cada 30 min'],
    operationalPriority: 35,
    assignedTeams: 1,
    playbookStatus: 'pending',
    urbanImpact: { schools: 0, hospitals: 0, blockedRoads: [] },
    trustScore: 70,
    history: [],
    stations: [],
  };
}

export function mergeLiveAreas(
  currentAreas: MonitoringArea[],
  candidates: LiveAreaCandidate[]
): MonitoringArea[] {
  if (!candidates.length) return currentAreas;

  const knownIds = new Set(currentAreas.map((area) => area.id));
  const appended = candidates
    .filter((candidate) => candidate.areaId.trim().length > 0)
    .filter((candidate) => !knownIds.has(candidate.areaId))
    .map(toMonitoringArea);

  if (!appended.length) return currentAreas;

  return [...currentAreas, ...appended];
}
