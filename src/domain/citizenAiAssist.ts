export async function enrichCitizenQueryWithAi(query: string): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 4) return null;

  try {
    const response = await fetch('/api/ai-citizen-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: trimmed }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { query?: string };
    const text = payload.query?.trim();
    if (!text) return null;

    return text.slice(0, 120);
  } catch {
    return null;
  }
}
