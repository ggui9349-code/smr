import { describe, expect, it } from 'vitest';
import { buildLiveSignalPayload } from './realtimeSignals';
import { RiskLevel, type MonitoringArea } from '../types';

function makeArea(overrides: Partial<MonitoringArea>): MonitoringArea {
  return {
    id: 'id',
    name: 'Rua Base',
    municipality: 'Recife',
    coordinates: [-8.05, -34.9],
    riskLevel: RiskLevel.ATTENTION,
    classification: 'R2',
    populationAtRisk: 100,
    housesAtRisk: 40,
    rainIntensity: 20,
    lastUpdate: new Date().toISOString(),
    trend: 'stable',
    eta: '60 min',
    confidence: 90,
    momentum: 0.4,
    causes: [],
    recommendations: [],
    operationalPriority: 40,
    assignedTeams: 1,
    playbookStatus: 'pending',
    urbanImpact: { schools: 0, hospitals: 0, blockedRoads: [] },
    trustScore: 90,
    history: [],
    stations: [],
    ...overrides,
  };
}

describe('buildLiveSignalPayload', () => {
  it('gera sinais reais por área a partir de chuva observada e tendência', () => {
    const areas = [
      makeArea({ id: 'a1', coordinates: [-8.05, -34.9] }),
      makeArea({ id: 'a2', coordinates: [-8.12, -34.88] }),
    ];

    const payload = buildLiveSignalPayload(areas, {
      observedRainMmPerHour: 12.6,
      trend: 'rising',
      confidence: 88,
    });

    expect(payload.data).toHaveLength(2);
    expect(payload.data[0]).toMatchObject({
      areaId: 'a1',
      rainMmPerHour: 12.6,
      trend: 'rising',
      confidence: 88,
    });
  });

  it('retorna lista vazia quando não houver áreas', () => {
    const payload = buildLiveSignalPayload([], {
      observedRainMmPerHour: 4,
      trend: 'stable',
      confidence: 70,
    });

    expect(payload.data).toEqual([]);
  });
});
