import { RiskLevel, type Alert, type MonitoringArea } from '../types';

function toRiskLevel(score: number): RiskLevel {
  if (score >= 85) return RiskLevel.EXTREME;
  if (score >= 65) return RiskLevel.CRITICAL;
  if (score >= 45) return RiskLevel.HIGH;
  if (score >= 25) return RiskLevel.ATTENTION;
  return RiskLevel.SAFE;
}

function toClassification(level: RiskLevel): MonitoringArea['classification'] {
  if (level === RiskLevel.EXTREME || level === RiskLevel.CRITICAL) return 'R4';
  if (level === RiskLevel.HIGH) return 'R3';
  if (level === RiskLevel.ATTENTION) return 'R2';
  return 'R1';
}

export function evaluateAreaRisk(area: MonitoringArea): MonitoringArea {
  const trendBoost = area.trend === 'rising' ? 8 : area.trend === 'falling' ? -6 : 0;
  const score =
    area.rainIntensity * 0.62 +
    area.momentum * 22 +
    area.confidence * 0.28 +
    trendBoost +
    Math.min(10, area.populationAtRisk / 600);

  const level = toRiskLevel(score);
  const priority = Math.max(0, Math.min(100, Math.round(score)));

  return {
    ...area,
    riskLevel: level,
    classification: toClassification(level),
    operationalPriority: priority,
    lastUpdate: new Date().toISOString(),
  };
}

export function buildAutomatedAlerts(areas: MonitoringArea[], isAutomatic: boolean): Alert[] {
  if (!isAutomatic) return [];

  return areas
    .filter((area) => area.riskLevel === RiskLevel.EXTREME || area.riskLevel === RiskLevel.CRITICAL)
    .sort((a, b) => b.operationalPriority - a.operationalPriority)
    .slice(0, 3)
    .map((area, index) => ({
      id: `auto-${area.id}-${index}`,
      areaId: area.id,
      areaName: area.name,
      level: area.riskLevel,
      timestamp: new Date().toISOString(),
      eta: area.eta,
      description: `${area.name} em ${area.municipality}: risco ${area.riskLevel} com prioridade operacional ${area.operationalPriority}.`,
      municipality: area.municipality,
      channels: ['sms', 'push'],
      actionType: area.riskLevel === RiskLevel.EXTREME ? 'evacuate' : 'dispatch',
    }));
}
