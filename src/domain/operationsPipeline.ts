import { RiskLevel, type Alert } from '../types';

export type DecisionAudit = {
  alertId: string;
  areaId: string;
  level: RiskLevel;
  actionType: Alert['actionType'];
  reason: string;
  timestamp: string;
};

export type DispatchTask = {
  alertId: string;
  areaId: string;
  channel: 'sms' | 'whatsapp';
  priority: 1 | 2;
  createdAt: string;
};

function severityWeight(level: RiskLevel): number {
  if (level === RiskLevel.EXTREME) return 100;
  if (level === RiskLevel.CRITICAL) return 80;
  if (level === RiskLevel.HIGH) return 60;
  if (level === RiskLevel.ATTENTION) return 40;
  return 20;
}

export function buildDecisionAuditTrail(alerts: Alert[]): DecisionAudit[] {
  return alerts
    .filter((alert) => alert.level === RiskLevel.EXTREME || alert.level === RiskLevel.CRITICAL)
    .sort((a, b) => severityWeight(b.level) - severityWeight(a.level))
    .map((alert) => ({
      alertId: alert.id,
      areaId: alert.areaId,
      level: alert.level,
      actionType: alert.actionType,
      reason: `Auto decision for ${alert.actionType} due to ${alert.level}`,
      timestamp: new Date().toISOString(),
    }));
}

export function buildDispatchQueue(alerts: Alert[]): DispatchTask[] {
  return alerts
    .filter((alert) => alert.level === RiskLevel.EXTREME || alert.level === RiskLevel.CRITICAL)
    .sort((a, b) => severityWeight(b.level) - severityWeight(a.level))
    .flatMap((alert) => {
      const priority: 1 | 2 = alert.level === RiskLevel.EXTREME ? 1 : 2;
      const channels: Array<'sms' | 'whatsapp'> =
        alert.level === RiskLevel.EXTREME ? ['sms', 'whatsapp'] : ['whatsapp'];

      return channels.map((channel) => ({
        alertId: alert.id,
        areaId: alert.areaId,
        channel,
        priority,
        createdAt: new Date().toISOString(),
      }));
    });
}
