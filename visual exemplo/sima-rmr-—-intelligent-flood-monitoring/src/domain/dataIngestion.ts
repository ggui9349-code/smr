export type ExternalAreaSignal = {
  areaId: string;
  rainMmPerHour: number;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
  momentum: number;
  tideMeters?: number;
};

export type AreaSignalMap = Record<string, Omit<ExternalAreaSignal, 'areaId'>>;

export type LiveDynamicArea = {
  areaId: string;
  areaName: string;
  municipality: string;
  coordinates: [number, number];
};

function isValidSignal(signal: ExternalAreaSignal): boolean {
  return (
    signal.areaId.trim().length > 0 &&
    signal.rainMmPerHour >= 0 &&
    signal.confidence >= 0 &&
    signal.confidence <= 100 &&
    signal.momentum >= 0
  );
}

export function buildAreaSignalMap(signals: ExternalAreaSignal[]): AreaSignalMap {
  return signals.reduce<AreaSignalMap>((acc, signal) => {
    if (!isValidSignal(signal)) return acc;

    acc[signal.areaId] = {
      rainMmPerHour: signal.rainMmPerHour,
      trend: signal.trend,
      confidence: signal.confidence,
      momentum: signal.momentum,
      tideMeters: signal.tideMeters,
    };

    return acc;
  }, {});
}
