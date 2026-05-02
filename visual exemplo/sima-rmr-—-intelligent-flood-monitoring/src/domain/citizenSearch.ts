import type { MonitoringArea } from '../types';

type CitizenQueryContext = {
  query: string;
  coordinates?: [number, number];
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haversineDistanceKm(a: [number, number], b: [number, number]): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const [lat1, lon1] = a;
  const [lat2, lon2] = b;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function textualScore(area: MonitoringArea, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;

  const name = normalize(area.name);
  const municipality = normalize(area.municipality);

  if (name.includes(normalizedQuery) || municipality.includes(normalizedQuery)) {
    return 10;
  }

  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .reduce((acc, token) => {
      if (name.includes(token)) return acc + 3;
      if (municipality.includes(token)) return acc + 2;
      return acc;
    }, 0);
}

export function findAreaByCitizenContext(
  areas: MonitoringArea[],
  context: CitizenQueryContext
): MonitoringArea | null {
  const normalizedQuery = normalize(context.query);

  const ranked = areas
    .map((area) => {
      const byText = textualScore(area, normalizedQuery);

      if (context.coordinates) {
        const distanceKm = haversineDistanceKm(context.coordinates, area.coordinates);
        const geoScore = Math.max(0, 12 - distanceKm);
        const riskScore = area.operationalPriority / 25;

        return {
          area,
          score: geoScore * 3 + byText * 2 + riskScore,
          byText,
        };
      }

      return {
        area,
        score: byText,
        byText,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;

  if (!context.coordinates && ranked[0].byText <= 0) return null;

  return ranked[0].area;
}

export function findAreaForCitizenQuery(
  areas: MonitoringArea[],
  query: string
): MonitoringArea | null {
  return findAreaByCitizenContext(areas, { query });
}
