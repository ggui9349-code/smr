import { describe, expect, it } from 'vitest';
import { RiskLevel, type MonitoringArea } from '../types';
import { findAreaForCitizenQuery, findAreaByCitizenContext } from './citizenSearch';

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

const areas = [
  makeArea({ id: 'a1', name: 'Rua do Futuro', municipality: 'Recife' }),
  makeArea({ id: 'a2', name: 'Av. Beberibe', municipality: 'Olinda' }),
  makeArea({ id: 'a3', name: 'Rua Teodósio Filho', municipality: 'Paulista' }),
];

describe('findAreaForCitizenQuery', () => {
  it('encontra por nome de rua com acentuação flexível', () => {
    const found = findAreaForCitizenQuery(areas, 'teodosio');
    expect(found?.id).toBe('a3');
  });

  it('encontra por município', () => {
    const found = findAreaForCitizenQuery(areas, 'olinda');
    expect(found?.id).toBe('a2');
  });

  it('retorna null quando não encontra nada', () => {
    const found = findAreaForCitizenQuery(areas, 'bairro inexistente');
    expect(found).toBeNull();
  });
});

describe('findAreaByCitizenContext', () => {
  it('prioriza área próxima quando recebe coordenadas', () => {
    const found = findAreaByCitizenContext(areas, {
      query: '',
      coordinates: [-8.03, -34.86],
    });

    expect(found?.id).toBe('a1');
  });

  it('desempata por prioridade operacional quando texto e distância são parecidos', () => {
    const tieAreas = [
      makeArea({
        id: 'r1',
        name: 'Rua Aurora',
        municipality: 'Recife',
        coordinates: [-8.05, -34.9],
        operationalPriority: 20,
      }),
      makeArea({
        id: 'r2',
        name: 'Rua Aurora',
        municipality: 'Recife',
        coordinates: [-8.051, -34.901],
        operationalPriority: 95,
      }),
    ];

    const found = findAreaByCitizenContext(tieAreas, {
      query: 'rua aurora recife',
      coordinates: [-8.051, -34.901],
    });

    expect(found?.id).toBe('r2');
  });

  it('usa fallback textual quando não recebe coordenadas', () => {
    const found = findAreaByCitizenContext(areas, {
      query: 'paulista',
    });

    expect(found?.id).toBe('a3');
  });

  it('retorna null quando não encontra por texto e sem coordenada', () => {
    const found = findAreaByCitizenContext(areas, {
      query: 'local inexistente',
    });

    expect(found).toBeNull();
  });
});
