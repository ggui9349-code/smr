import { describe, expect, it } from 'vitest';
import { RiskLevel, type MonitoringArea } from '../types';
import { buildAutomatedAlerts, evaluateAreaRisk } from './riskEngine';

function makeArea(overrides: Partial<MonitoringArea> = {}): MonitoringArea {
  return {
    id: 'area-1',
    name: 'Área 1',
    municipality: 'Recife',
    coordinates: [-8.05, -34.9],
    riskLevel: RiskLevel.ATTENTION,
    classification: 'R3',
    populationAtRisk: 1200,
    housesAtRisk: 340,
    rainIntensity: 35,
    lastUpdate: new Date().toISOString(),
    trend: 'rising',
    eta: '60 min',
    confidence: 90,
    momentum: 0.7,
    causes: [{ label: 'Chuva intensa', intensity: 80 }],
    recommendations: ['Monitorar área'],
    operationalPriority: 60,
    assignedTeams: 1,
    playbookStatus: 'pending',
    urbanImpact: { schools: 1, hospitals: 0, blockedRoads: [] },
    trustScore: 92,
    history: [],
    stations: [],
    ...overrides,
  };
}

describe('evaluateAreaRisk', () => {
  it('classifica como EXTREME quando chuva, momentum e confiança estão muito altos', () => {
    const assessed = evaluateAreaRisk(
      makeArea({
        rainIntensity: 78,
        momentum: 1.7,
        confidence: 98,
        trend: 'rising',
        populationAtRisk: 4800,
      })
    );

    expect(assessed.riskLevel).toBe(RiskLevel.EXTREME);
    expect(assessed.operationalPriority).toBeGreaterThanOrEqual(95);
  });

  it('classifica como SAFE quando sinais estão baixos e tendência estável', () => {
    const assessed = evaluateAreaRisk(
      makeArea({
        rainIntensity: 2,
        momentum: 0,
        confidence: 55,
        trend: 'stable',
        populationAtRisk: 60,
      })
    );

    expect(assessed.riskLevel).toBe(RiskLevel.SAFE);
    expect(assessed.operationalPriority).toBeLessThan(25);
  });
});

describe('buildAutomatedAlerts', () => {
  it('gera alerta de evacuação para áreas EXTREME quando modo automático está ativo', () => {
    const areas = [
      evaluateAreaRisk(makeArea({ id: 'a1', name: 'A1', rainIntensity: 82, momentum: 1.8, confidence: 99, trend: 'rising', populationAtRisk: 5200 })),
      evaluateAreaRisk(makeArea({ id: 'a2', name: 'A2', rainIntensity: 10, momentum: 0.1, confidence: 60 })),
    ];

    const alerts = buildAutomatedAlerts(areas, true);

    expect(alerts.length).toBe(1);
    expect(alerts[0].areaId).toBe('a1');
    expect(alerts[0].channels).toEqual(expect.arrayContaining(['sms', 'push']));
    expect(alerts[0].actionType).toBe('evacuate');
  });
});
