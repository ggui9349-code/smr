import { RiskLevel, type Alert } from '../types';

type TideAlertInput = {
  previousMeters: number;
  currentMeters: number;
  thresholdMeters: number;
  areaName: string;
  municipality: string;
};

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export function shouldRefreshAreaSnapshot(lastSnapshotIso: string, nowIso: string): boolean {
  const last = Date.parse(lastSnapshotIso);
  const now = Date.parse(nowIso);

  if (Number.isNaN(last) || Number.isNaN(now)) return true;

  return now - last >= THIRTY_MINUTES_MS;
}

export function buildTideAlert(input: TideAlertInput): Alert | null {
  const { previousMeters, currentMeters, thresholdMeters, areaName, municipality } = input;
  const rising = currentMeters > previousMeters;
  const aboveThreshold = currentMeters >= thresholdMeters;

  if (!rising || !aboveThreshold) return null;

  const timestamp = new Date().toISOString();

  return {
    id: `tide-${timestamp}`,
    areaId: 'tide-live',
    areaName,
    level: RiskLevel.HIGH,
    timestamp,
    eta: '30 min',
    description: `Maré em elevação (${currentMeters.toFixed(2)}m) com potencial de agravar alagamentos.`,
    municipality,
    channels: ['push', 'sms', 'agency'],
    actionType: 'monitor',
  };
}
