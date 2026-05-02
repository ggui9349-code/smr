import { describe, expect, it } from 'vitest';
import { buildAreaSignalMap, type ExternalAreaSignal } from './dataIngestion';

describe('buildAreaSignalMap', () => {
  it('normaliza sinais externos por areaId', () => {
    const signals: ExternalAreaSignal[] = [
      {
        areaId: 'paulista-rua-7-setembro',
        rainMmPerHour: 44.8,
        trend: 'rising',
        confidence: 94,
        momentum: 1.2,
      },
    ];

    const map = buildAreaSignalMap(signals);

    expect(map['paulista-rua-7-setembro']).toEqual({
      rainMmPerHour: 44.8,
      trend: 'rising',
      confidence: 94,
      momentum: 1.2,
    });
  });

  it('descarta sinais inválidos e preserva apenas valores em faixa segura', () => {
    const signals: ExternalAreaSignal[] = [
      {
        areaId: 'a',
        rainMmPerHour: -4,
        trend: 'stable',
        confidence: 130,
        momentum: -3,
      },
      {
        areaId: 'b',
        rainMmPerHour: 20,
        trend: 'falling',
        confidence: 82,
        momentum: 0.4,
      },
    ];

    const map = buildAreaSignalMap(signals);

    expect(map.a).toBeUndefined();
    expect(map.b).toEqual({
      rainMmPerHour: 20,
      trend: 'falling',
      confidence: 82,
      momentum: 0.4,
    });
  });
});
