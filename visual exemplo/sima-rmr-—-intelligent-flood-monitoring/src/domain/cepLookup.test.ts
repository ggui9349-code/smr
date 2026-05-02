import { describe, expect, it } from 'vitest';
import { extractCepDigits, isCepQuery } from './cepLookup';

describe('CEP helpers', () => {
  it('detecta query de CEP válida com máscara', () => {
    expect(isCepQuery('52051-340')).toBe(true);
  });

  it('detecta query de CEP válida sem máscara', () => {
    expect(isCepQuery('52051340')).toBe(true);
  });

  it('extrai apenas dígitos', () => {
    expect(extractCepDigits('CEP 52051-340')).toBe('52051340');
  });

  it('retorna false para texto não-CEP', () => {
    expect(isCepQuery('Rua do Futuro')).toBe(false);
  });
});
