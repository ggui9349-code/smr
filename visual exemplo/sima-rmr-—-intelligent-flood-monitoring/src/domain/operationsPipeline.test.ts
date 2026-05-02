import { describe, expect, it } from 'vitest';
import { RiskLevel, type Alert } from '../types';
import { buildDispatchQueue, buildDecisionAuditTrail } from './operationsPipeline';

const alerts: Alert[] = [
  {
    id: 'a1',
    areaId: 'area-1',
    areaName: 'Área 1',
    municipality: 'Recife',
    level: RiskLevel.EXTREME,
    timestamp: new Date().toISOString(),
    eta: '20 min',
    description: 'Risco extremo',
    channels: ['sms', 'push'],
    actionType: 'evacuate',
  },
  {
    id: 'a2',
    areaId: 'area-2',
    areaName: 'Área 2',
    municipality: 'Olinda',
    level: RiskLevel.CRITICAL,
    timestamp: new Date().toISOString(),
    eta: '35 min',
    description: 'Risco crítico',
    channels: ['push'],
    actionType: 'dispatch',
  },
];

describe('buildDecisionAuditTrail', () => {
  it('registra trilha de decisão para cada alerta crítico/extremo', () => {
    const trail = buildDecisionAuditTrail(alerts);

    expect(trail).toHaveLength(2);
    expect(trail[0].areaId).toBe('area-1');
    expect(trail[0].reason).toContain('evacuate');
  });
});

describe('buildDispatchQueue', () => {
  it('prioriza SMS e WhatsApp para alertas extremos e mantém ordem por severidade', () => {
    const queue = buildDispatchQueue(alerts);

    expect(queue).toHaveLength(3);
    expect(queue[0]).toMatchObject({ areaId: 'area-1', channel: 'sms', priority: 1 });
    expect(queue[1]).toMatchObject({ areaId: 'area-1', channel: 'whatsapp', priority: 1 });
    expect(queue[2]).toMatchObject({ areaId: 'area-2', channel: 'whatsapp', priority: 2 });
  });
});
