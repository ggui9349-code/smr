export type CepAddress = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
};

export function extractCepDigits(query: string): string {
  return query.replace(/\D/g, '').slice(0, 8);
}

export function isCepQuery(query: string): boolean {
  return extractCepDigits(query).length === 8;
}

export async function lookupCep(query: string): Promise<CepAddress | null> {
  const cep = extractCepDigits(query);
  if (cep.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) return null;

  const payload = (await response.json()) as Partial<CepAddress> & { erro?: boolean };
  if (payload.erro) return null;

  if (!payload.cep || !payload.localidade) return null;

  return {
    cep: payload.cep,
    logradouro: payload.logradouro ?? '',
    bairro: payload.bairro ?? '',
    localidade: payload.localidade,
    uf: payload.uf ?? '',
  };
}
