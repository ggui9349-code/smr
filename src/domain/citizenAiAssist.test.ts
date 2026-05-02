import { afterEach, describe, expect, it, vi } from 'vitest';
import { enrichCitizenQueryWithAi } from './citizenAiAssist';

describe('enrichCitizenQueryWithAi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('consulta endpoint backend de IA e retorna query enriquecida', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as never).mockResolvedValue({
      ok: true,
      json: async () => ({ query: 'Rua do Futuro Recife' }),
    } as Response);

    const enriched = await enrichCitizenQueryWithAi('rua do futuro');

    expect(fetchSpy).toHaveBeenCalledWith('/api/ai-citizen-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'rua do futuro' }),
    });
    expect(enriched).toBe('Rua do Futuro Recife');
  });

  it('retorna null quando backend responder erro', async () => {
    vi.spyOn(globalThis, 'fetch' as never).mockResolvedValue({
      ok: false,
    } as Response);

    const enriched = await enrichCitizenQueryWithAi('rua do futuro');

    expect(enriched).toBeNull();
  });
});
