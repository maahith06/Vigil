export type SeverityLevel = 'nominal' | 'advisory' | 'warning' | 'critical';
export type DisplayMode = 'daylight' | 'night' | 'glare';

export type DataProvenance = 
  | 'direct_continuous'    // Wearable bioharness, continuous optical, environmental gas analyzer
  | 'derived_algorithmic'  // Autonomic tone, stroke volume index, deconditioning score
  | 'periodic_lab'         // i-STAT cartridge, portable ultrasound, bone density scanner
  | 'self_reported'        // Daily symptom check, fatigue scale, visual check
  | 'missing_data';        // Sensor contact lost, telemetry drop

export interface BaselineReference {
  mean: number;
  stdDev: number;
  acceptableMin: number;
  acceptableMax: number;
  unit: string;
  nominalDirection: 'neutral' | 'higher_is_better' | 'lower_is_better';
}

export interface MetricReading {
  id: string;
  name: string;
  category: 'cardiovascular' | 'musculoskeletal' | 'neuro_cognitive' | 'immune_systemic' | 'radiation' | 'environment';
  currentValue: number | null; // null if missing/sensor failed
  unit: string;
  baseline: BaselineReference;
  provenance: DataProvenance;
  lastUpdated: string; // ISO string
  freshnessSeconds: number;
  signalConfidence: number; // 0 - 100%
  status: SeverityLevel;
  sensorSource: string;
  shortDescription: string;
  clinicalSignificance: string;
}

export interface TimeSeriesPoint {
  timestamp: string; // ISO string
  displayTime: string; // e.g. "14:00" or "Sol 184"
  value: number | null;
  baselineMean: number;
  baselineMin: number;
  baselineMax: number;
}

export interface HealthAlert {
  id: string;
  title: string;
  category: 'cardiovascular' | 'musculoskeletal' | 'neuro_cognitive' | 'immune_systemic' | 'radiation' | 'environment';
  severity: SeverityLevel;
  timestamp: string;
  status: 'active' | 'in_progress' | 'resolving' | 'resolved';
  triggerMetrics: string[]; // IDs of metrics that triggered this
  contributingFactors: string[];
  physiologicalExplanation: string;
  uncertaintyDisclaimer: string;
  recommendedProcedureId?: string;
  reassessmentSchedule: string;
  reassessmentDeltaSummary?: string;
  resolvedAt?: string;
}

export interface ActionProtocolStep {
  id: string;
  label: string;
  description: string;
  requiredResource?: {
    name: string;
    inventoryItemId: string;
    quantity: number;
    unit: string;
  };
  isCompleted: boolean;
  completedAt?: string;
  astronautNotes?: string;
}

export interface DecisionProtocol {
  id: string;
  alertId: string;
  title: string;
  urgency: SeverityLevel;
  objective: string;
  estimatedDuration: string;
  steps: ActionProtocolStep[];
  requiredEquipment: string[];
  clinicalRationale: string;
  followUpWindow: string; // e.g. "Reassess in 4 hours post-countermeasure"
}

export interface MedicalInventoryItem {
  id: string;
  name: string;
  category: 'pharmaceutical' | 'eclss_filter' | 'shielding' | 'diagnostic_tool' | 'hydration';
  totalCount: number;
  availableCount: number;
  unit: string;
  storageLocker: string;
  criticalLevel: number;
}

export interface SensorDevice {
  id: string;
  name: string;
  hardwareModel: string;
  bodySiteOrLocation: string;
  connectionStatus: 'online' | 'degraded' | 'offline';
  dataQualityPct: number;
  batteryPct: number;
  lastCalibrationMET: string;
  monitoredMetrics: string[];
  firmwareVersion: string;
}

export interface PvtTrial {
  trialNumber: number;
  delayMs: number;
  reactionTimeMs: number;
  isLapse: boolean; // > 500ms
  isFalseStart: boolean; // < 100ms
}

export interface PvtAssessmentResult {
  timestamp: string;
  totalTrials: number;
  validTrials: number;
  meanReactionTimeMs: number;
  medianReactionTimeMs: number;
  fastest10PctMs: number;
  slowest10PctMs: number;
  lapseCount: number; // reaction time > 500 ms
  falseStartCount: number;
  cognitiveReadinessScore: number; // 0 - 100
  evaluatedFatigueLevel: 'nominal' | 'mild_fatigue' | 'moderate_fatigue' | 'severe_exhaustion';
}

export interface DailySymptomReport {
  timestamp: string;
  headPressureScore: number; // 0 - 10
  visualBlurringOrScotoma: boolean; // SANS symptom
  motionSicknessScore: number; // SMS 0 - 10
  sinusCongestion: boolean; // Cephalad fluid shift symptom
  generalFatigueScore: number; // 0 - 10
  sleepSubjectiveQuality: number; // 1 - 5
  moodConfinementStress: number; // 1 - 5
  notes: string;
}

export interface MissionContext {
  missionName: string;
  crewMember: {
    name: string;
    role: string;
    callsign: string;
    age: number;
    bloodType: string;
    preflightWeightKg: number;
    currentEstimatedWeightKg: number;
    cumulativeEvaHours: number;
  };
  missionDayMET: string; // e.g. "MET +184d 14h 22m"
  missionPhase: string; // "Mars Transit (Inbound Sol 184)"
  distanceFromEarthKm: number; // 128,450,000 km
  commOneWayDelaySeconds: number; // 862 seconds (14m 22s)
  currentScenario: MissionScenarioId;
  simulatedTimeOffsetHours: number;
}

export type MissionScenarioId = 
  | 'nominal_cruise'
  | 'co2_hypercapnia_fatigue'
  | 'solar_particle_event'
  | 'cardiovascular_deconditioning'
  | 'sensor_fault_missing_data'
  | 'upper_respiratory_syndrome';

export interface ScenarioDefinition {
  id: MissionScenarioId;
  name: string;
  badge: string;
  summary: string;
  clinicalDomain: string;
  expectedOutcome: string;
}
