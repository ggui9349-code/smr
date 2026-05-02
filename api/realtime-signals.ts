import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_AREAS } from '../src/data/initialAreas';
import { buildLiveSignalPayload } from '../src/domain/realtimeSignals';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

async function fetchRealtimeObservation(previousRainMmPerHour = 0) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Retorne APENAS JSON válido para monitoramento hidrológico de TODO o estado de Pernambuco (não limitar às áreas atuais).
Campos obrigatórios:
- observedRainMmPerHour (número >= 0)
- trend (rising|stable|falling)
- confidence (0-100)
- floodedStreets (array)
Cada item de floodedStreets deve conter:
- street (nome da rua)
- municipality (município de Pernambuco)
- coordinates ([latitude, longitude])
- severity (attention|high|critical|extreme)
Se não houver rua alagada agora, retorne floodedStreets: [].
Valor anterior de chuva: ${previousRainMmPerHour}.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!geminiResponse.ok) {
    throw new Error('Falha ao consultar Gemini para sinal ao vivo');
  }

  const geminiPayload = (await geminiResponse.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '{}';
  const normalizedText = rawText.replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(normalizedText) as {
    observedRainMmPerHour?: number;
    trend?: 'rising' | 'stable' | 'falling';
    confidence?: number;
    floodedStreets?: Array<{
      street?: string;
      municipality?: string;
      coordinates?: [number, number];
      severity?: 'attention' | 'high' | 'critical' | 'extreme';
    }>;
  };

  const observedRainMmPerHour = Math.max(0, Number(parsed.observedRainMmPerHour ?? previousRainMmPerHour ?? 0));
  const trend = parsed.trend === 'rising' || parsed.trend === 'falling' || parsed.trend === 'stable'
    ? parsed.trend
    : observedRainMmPerHour > previousRainMmPerHour
      ? 'rising'
      : observedRainMmPerHour < previousRainMmPerHour
        ? 'falling'
        : 'stable';

  const confidence = Math.max(0, Math.min(100, Number(parsed.confidence ?? 100)));

  const floodedStreets = (parsed.floodedStreets ?? [])
    .filter((street) => street.street && street.municipality && Array.isArray(street.coordinates) && street.coordinates.length === 2)
    .map((street) => ({
      street: String(street.street),
      municipality: String(street.municipality),
      coordinates: [Number(street.coordinates![0]), Number(street.coordinates![1])] as [number, number],
      severity:
        street.severity === 'attention' ||
        street.severity === 'high' ||
        street.severity === 'critical' ||
        street.severity === 'extreme'
          ? street.severity
          : 'attention',
    }));

  return {
    observedRainMmPerHour,
    trend,
    confidence,
    floodedStreets,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.writeHead(200, SSE_HEADERS);

  let previousRainMmPerHour = 0;

  const emit = async () => {
    try {
      const observation = await fetchRealtimeObservation(previousRainMmPerHour);
      previousRainMmPerHour = observation.observedRainMmPerHour;
      const payload = buildLiveSignalPayload(INITIAL_AREAS, observation);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      const payload = buildLiveSignalPayload(INITIAL_AREAS, {
        observedRainMmPerHour: previousRainMmPerHour,
        trend: 'stable',
        confidence: 100,
      });
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  };

  await emit();
  const timer = setInterval(() => {
    void emit();
  }, 60 * 60 * 1000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
}
