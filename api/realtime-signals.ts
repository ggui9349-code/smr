import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_AREAS } from '../src/data/initialAreas';
import { buildLiveSignalPayload } from '../src/domain/realtimeSignals';

const LIVE_OBSERVATION_API_URL = process.env.LIVE_OBSERVATION_API_URL;

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

async function fetchRealtimeObservation(previousRainMmPerHour = 0) {
  if (!LIVE_OBSERVATION_API_URL) {
    throw new Error('LIVE_OBSERVATION_API_URL não configurada');
  }

  const response = await fetch(LIVE_OBSERVATION_API_URL);
  if (!response.ok) {
    throw new Error('Falha ao consultar API ao vivo');
  }

  const payload = (await response.json()) as {
    current?: {
      rain?: number;
    };
    rain?: number;
    rainMmPerHour?: number;
    observedRainMmPerHour?: number;
  };

  const rainFromApi =
    payload.observedRainMmPerHour ??
    payload.rainMmPerHour ??
    payload.rain ??
    payload.current?.rain ??
    0;

  const observedRainMmPerHour = Math.max(0, Number(rainFromApi));
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
