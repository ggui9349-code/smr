import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_AREAS } from '../src/data/initialAreas';
import { buildLiveSignalPayload } from '../src/domain/realtimeSignals';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

async function fetchRealtimeObservation(previousRainMmPerHour = 0) {
  const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-8.0476&longitude=-34.8770&current=rain&forecast_days=1');
  if (!response.ok) {
    throw new Error('Falha ao consultar Open-Meteo');
  }

  const payload = (await response.json()) as {
    current?: {
      rain?: number;
    };
  };

  const observedRainMmPerHour = Math.max(0, Number(payload.current?.rain ?? 0));
  const diff = observedRainMmPerHour - previousRainMmPerHour;
  const trend: 'rising' | 'stable' | 'falling' = diff > 0.2 ? 'rising' : diff < -0.2 ? 'falling' : 'stable';

  return {
    observedRainMmPerHour,
    trend,
    confidence: 100,
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
  }, 3000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
}
