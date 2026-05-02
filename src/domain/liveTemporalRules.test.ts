import { describe, expect, it } from 'vitest';
import { buildTideAlert, shouldRefreshAreaSnapshot } from './liveTemporalRules';

describe('shouldRefreshAreaSnapshot', () => {
  it('retorna true quando passou a janela de 30 minutos', () => {
    const last = '2026-05-02T10:00:00.000Z';
    const now = '2026-05-02T10:31:00.000Z';

    expect(shouldRefreshAreaSnapshot(last, now)).toBe(true);
  });

  it('retorna false dentro da janela de 30 minutos', () => {
    const last = '2026-05-02T10:00:00.000Z';
    const now = '2026-05-02T10:15:00.000Z';

    expect(shouldRefreshAreaSnapshot(last, now)).toBe(false);
  });
});

describe('buildTideAlert', () => {
  it('gera alerta quando maré sobe acima do limite', () => {
    const alert = buildTideAlert({
      previousMeters: 1.3,
      currentMeters: 2.1,
      thresholdMeters: 1.9,
      areaName: 'Centro de Olinda',
      municipality: 'Olinda',
    });

    expect(alert).not.toBeNull();
    expect(alert?.description).toContain('Maré em elevação');
  });

  it('retorna null quando maré não atingiu condição de alerta', () => {
    const alert = buildTideAlert({
      previousMeters: 1.5,
      currentMeters: 1.7,
      thresholdMeters: 1.9,
      areaName: 'Centro de Olinda',
      municipality: 'Olinda',
    });

    expect(alert).toBeNull();
  });
});
