import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { buildLiveSignalPayload } from './src/domain/realtimeSignals';

const STREAM_PATH = '/api/realtime-signals';
const AI_SEARCH_PATH = '/api/ai-citizen-search';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function fetchRealtimeObservation(previousRainMmPerHour = 0, geminiApiKey?: string) {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Retorne APENAS JSON válido com os campos observedRainMmPerHour (número >=0), trend (rising|stable|falling) e confidence (0-100). Valor anterior de chuva: ${previousRainMmPerHour}.`,
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

  return {
    observedRainMmPerHour,
    trend,
    confidence,
  };
}

export default defineConfig(async ({mode}) => {
  const env = loadEnv(mode, '.', '');
  const geminiApiKey = env.GEMINI_API_KEY;
  const { INITIAL_AREAS } = await import('./src/data/initialAreas');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'sima-realtime-sse',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === AI_SEARCH_PATH && req.method === 'POST') {
              const chunks: Uint8Array[] = [];
              req.on('data', (chunk) => chunks.push(chunk));
              req.on('end', async () => {
                try {
                  const raw = Buffer.concat(chunks).toString('utf8');
                  const body = JSON.parse(raw) as { query?: string };
                  const query = body.query?.trim() ?? '';
                  const apiKey = env.GEMINI_API_KEY;

                  if (!query || query.length < 4 || !apiKey) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ query: '' }));
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
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ query: '' }));
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

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ query: enriched.slice(0, 120) }));
                } catch {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ query: '' }));
                }
              });
              return;
            }

            if (req.url !== STREAM_PATH) {
              next();
              return;
            }

            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Accel-Buffering': 'no',
            });

            let previousRainMmPerHour = 0;

            const emit = async () => {
              try {
                const observation = await fetchRealtimeObservation(previousRainMmPerHour, geminiApiKey);
                previousRainMmPerHour = observation.observedRainMmPerHour;
                const payload = buildLiveSignalPayload(INITIAL_AREAS, observation);
                res.write(`data: ${JSON.stringify(payload)}\n\n`);
              } catch {
                const payload = buildLiveSignalPayload(INITIAL_AREAS, {
                  observedRainMmPerHour: previousRainMmPerHour,
                  trend: 'stable',
                  confidence: 40,
                });
                res.write(`data: ${JSON.stringify(payload)}\n\n`);
              }
            };

            void emit();
            const timer = setInterval(() => {
              void emit();
            }, 60 * 60 * 1000);

            req.on('close', () => {
              clearInterval(timer);
              res.end();
            });
          });
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
