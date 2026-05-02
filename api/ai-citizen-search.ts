import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ query: '' });
    return;
  }

  try {
    const query = String(req.body?.query ?? '').trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!query || query.length < 4 || !apiKey) {
      res.status(400).json({ query: '' });
      return;
    }

    const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Converta a busca do cidadão para uma consulta curta de localização urbana em Pernambuco. Retorne apenas uma linha, sem explicações. Busca: ${query}`,
              },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      res.status(502).json({ query: '' });
      return;
    }

    const geminiPayload = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const enriched = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    res.status(200).json({ query: enriched.slice(0, 120) });
  } catch {
    res.status(500).json({ query: '' });
  }
}
