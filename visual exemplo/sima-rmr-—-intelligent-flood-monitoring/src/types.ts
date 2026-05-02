export enum RiskLevel {
  SAFE = 'safe',
  ATTENTION = 'attention',
  HIGH = 'high',
  CRITICAL = 'critical',
  EXTREME = 'extreme',
}

export enum SystemMode {
  NORMAL = 'NORMAL',
  ALERT = 'ALERT',
  CRITICAL = 'CRITICAL',
  DEGRADED = 'DEGRADED',
}

export interface RiskCause {
  label: string;
  intensity: number;
}

export interface HistoricalEvent {
  time: string;
  type: 'warning' | 'trend' | 'alert' | 'community' | 'weather';
  description: string;
}

export interface UrbanImpact {
  schools: number;
  hospitals: number;
  blockedRoads: string[];
}

export interface StationData {
  id: string;
  name: string;
  capacity: number;
  currentUsage: number;
  status: 'online' | 'offline' | 'alert';
}

export interface MonitoringArea {
  id: string;
  name: string;
  municipality: string;
  coordinates: [number, number];
  futureCoordinates?: [number, number];
  riskLevel: RiskLevel;
  classification: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
  populationAtRisk: number;
  housesAtRisk: number;
  rainIntensity: number;
  lastUpdate: string;
  trend: 'rising' | 'stable' | 'falling';
  eta: string;
  confidence: number;
  momentum: number;
  causes: RiskCause[];
  recommendations: string[];
  operationalPriority: number;
  assignedTeams: number;
  playbookStatus: 'pending' | 'active' | 'completed';
  urbanImpact: UrbanImpact;
  trustScore: number;
  history: HistoricalEvent[];
  stations: StationData[];
}

export interface Alert {
  id: string;
  areaId: string;
  areaName: string;
  level: RiskLevel;
  timestamp: string;
  eta: string;
  description: string;
  municipality: string;
  channels: ('sms' | 'push' | 'radio' | 'agency')[];
  actionType: 'evacuate' | 'monitor' | 'dispatch';
}

export interface HistoricalData {
  time: string;
  rain: number;
  risk: number;
}
