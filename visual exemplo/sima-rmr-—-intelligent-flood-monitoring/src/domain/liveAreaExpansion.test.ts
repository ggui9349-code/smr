import { describe, expect, it } from 'vitest';
import { RiskLevel, type MonitoringArea } from '../types';
import { mergeLiveAreas } from './liveAreaExpansion';

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

describe('mergeLiveAreas', () => {
  it('adiciona nova área vinda do stream ao vivo', () => {
    const existing = [
      makeArea({ id: 'a1', name: 'Rua do Futuro', municipality: 'Recife', coordinates: [-8.03, -34.86] }),
    ];

    const merged = mergeLiveAreas(existing, [
      {
        areaId: 'new-bridge',
        areaName: 'Ponte da Batalha',
        municipality: 'Olinda',
        coordinates: [-8.01, -34.85],
      },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged.find((area) => area.id === 'new-bridge')?.name).toBe('Ponte da Batalha');
  });

  it('não duplica área já existente', () => {
    const existing = [
      makeArea({ id: 'a1', name: 'Rua do Futuro', municipality: 'Recife', coordinates: [-8.03, -34.86] }),
    ];

    const merged = mergeLiveAreas(existing, [
      {
        areaId: 'a1',
        areaName: 'Rua do Futuro',
        municipality: 'Recife',
        coordinates: [-8.03, -34.86],
      },
    ]);

    expect(merged).toHaveLength(1);
  });
});
