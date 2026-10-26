import { BaselineReference, SeverityLevel, PvtTrial, PvtAssessmentResult } from '../types/health';

/**
 * Calculates standard z-score (deviations from personal baseline mean)
 */
export function calculateZScore(value: number | null, mean: number, stdDev: number): number | null {
  if (value === null || stdDev <= 0) return null;
  const z = (value - mean) / stdDev;
  return Math.round(z * 100) / 100;
}

/**
 * Evaluates individual metric severity based on personal baseline and clinical boundaries
 */
export function evaluateMetricSeverity(
  value: number | null,
  baseline: BaselineReference
): SeverityLevel {
  if (value === null) {
    // Missing data is UNKNOWN/WARNING, never assumed nominal!
    return 'warning';
  }

  const { acceptableMin, acceptableMax, mean, stdDev, nominalDirection } = baseline;

  // Severe out of bounds (beyond acceptable min/max)
  if (value < acceptableMin || value > acceptableMax) {
    const deviation = Math.abs(value - mean);
    if (deviation > 3.0 * stdDev) {
      return 'critical';
    }
    return 'warning';
  }

  // Check statistical anomaly (between 1.8 and 2.5 std deviations)
  const z = Math.abs((value - mean) / (stdDev || 1));
  if (z >= 2.0) {
    if (nominalDirection === 'higher_is_better' && value > mean) {
      return 'nominal';
    }
    if (nominalDirection === 'lower_is_better' && value < mean) {
      return 'nominal';
    }
    return 'advisory';
  }

  return 'nominal';
}

/**
 * Evaluates Psychomotor Vigilance Task (PVT) trial series
 */
export function calculatePvtMetrics(
  trials: Array<{ reactionTimeMs: number; isFalseStart: boolean; isLapse: boolean }>
): PvtAssessmentResult {
  const validTrials = trials.filter((t) => !t.isFalseStart && t.reactionTimeMs >= 100);
  const falseStartCount = trials.filter((t) => t.isFalseStart || t.reactionTimeMs < 100).length;
  const lapseCount = trials.filter((t) => t.isLapse || t.reactionTimeMs >= 500).length;

  if (validTrials.length === 0) {
    return {
      timestamp: new Date().toISOString(),
      totalTrials: trials.length,
      validTrials: 0,
      meanReactionTimeMs: 0,
      medianReactionTimeMs: 0,
      fastest10PctMs: 0,
      slowest10PctMs: 0,
      lapseCount,
      falseStartCount,
      cognitiveReadinessScore: 0,
      evaluatedFatigueLevel: 'severe_exhaustion',
    };
  }

  const rts = validTrials.map((t) => t.reactionTimeMs).sort((a, b) => a - b);
  const sum = rts.reduce((acc, curr) => acc + curr, 0);
  const meanReactionTimeMs = Math.round(sum / rts.length);

  const mid = Math.floor(rts.length / 2);
  const medianReactionTimeMs = rts.length % 2 !== 0 ? rts[mid] : Math.round((rts[mid - 1] + rts[mid]) / 2);

  const tenPctCount = Math.max(1, Math.round(rts.length * 0.1));
  const fastest10PctMs = Math.round(rts.slice(0, tenPctCount).reduce((a, b) => a + b, 0) / tenPctCount);
  const slowest10PctMs = Math.round(rts.slice(-tenPctCount).reduce((a, b) => a + b, 0) / tenPctCount);

  // Astronaut cognitive readiness score: 100 = 200ms baseline, drops with slowing RT and lapses
  // Baseline astronaut nominal RT ~ 220ms.
  let score = 100 - Math.max(0, (meanReactionTimeMs - 220) * 0.28) - (lapseCount * 12) - (falseStartCount * 6);
  score = Math.max(10, Math.min(100, Math.round(score)));

  let evaluatedFatigueLevel: PvtAssessmentResult['evaluatedFatigueLevel'] = 'nominal';
  if (score < 45 || lapseCount >= 3 || meanReactionTimeMs >= 390) {
    evaluatedFatigueLevel = 'severe_exhaustion';
  } else if (score < 70 || lapseCount >= 1 || meanReactionTimeMs >= 310) {
    evaluatedFatigueLevel = 'moderate_fatigue';
  } else if (score < 85 || meanReactionTimeMs >= 270) {
    evaluatedFatigueLevel = 'mild_fatigue';
  }

  return {
    timestamp: new Date().toISOString(),
    totalTrials: trials.length,
    validTrials: validTrials.length,
    meanReactionTimeMs,
    medianReactionTimeMs,
    fastest10PctMs,
    slowest10PctMs,
    lapseCount,
    falseStartCount,
    cognitiveReadinessScore: score,
    evaluatedFatigueLevel,
  };
}

/**
 * Computes human-readable relative data freshness
 */
export function formatDataFreshness(secondsAgo: number): string {
  if (secondsAgo < 5) return 'Live (< 5s)';
  if (secondsAgo < 60) return `${Math.round(secondsAgo)}s ago`;
  const minutes = Math.floor(secondsAgo / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Calculates comparative delta between pre- and post-intervention measurements
 */
export function calculateReassessmentDelta(
  preValue: number,
  postValue: number,
  unit: string,
  higherIsBetter: boolean = false
): { deltaPct: number; text: string; isImprovement: boolean } {
  if (preValue === 0) {
    return { deltaPct: 0, text: 'No baseline change', isImprovement: false };
  }
  const delta = postValue - preValue;
  const deltaPct = Math.round((delta / preValue) * 1000) / 10;
  const sign = delta > 0 ? '+' : '';
  const text = `${sign}${delta.toFixed(1)} ${unit} (${sign}${deltaPct}%)`;

  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  return { deltaPct, text, isImprovement };
}

/**
 * Multi-signal clinical rule engine: checks for combined physiological & environmental syndromes
 */
export interface MultiSignalDetection {
  alertId: string;
  detected: boolean;
  severity: SeverityLevel;
  contributingMetrics: string[];
  explanation: string;
}

export function detectHypercapniaSyndrome(
  co2Reading: number | null,
  sleepDurationHrs: number | null,
  pvtReactionTimeMs: number | null,
  hrvRmssd: number | null
): MultiSignalDetection {
  if (co2Reading === null) {
    return {
      alertId: 'hypercapnia_risk',
      detected: false,
      severity: 'nominal',
      contributingMetrics: [],
      explanation: 'ECLSS CO2 sensor offline; risk undetermined.',
    };
  }

  const isCo2High = co2Reading >= 3.2; // space standard nominal < 2.5 - 3.0 mmHg
  const isSleepLow = sleepDurationHrs !== null && sleepDurationHrs < 5.8;
  const isPvtImpaired = pvtReactionTimeMs !== null && pvtReactionTimeMs > 300;
  const isHrvDepressed = hrvRmssd !== null && hrvRmssd < 38;

  const count = [isCo2High, isSleepLow, isPvtImpaired, isHrvDepressed].filter(Boolean).length;

  if (isCo2High && count >= 2) {
    return {
      alertId: 'hypercapnia_fatigue_syndrome',
      detected: true,
      severity: co2Reading >= 4.0 || count >= 3 ? 'critical' : 'warning',
      contributingMetrics: ['eclss_co2', 'sleep_duration', 'pvt_reaction_time', 'hrv_rmssd'].filter(
        (id) => {
          if (id === 'eclss_co2') return isCo2High;
          if (id === 'sleep_duration') return isSleepLow;
          if (id === 'pvt_reaction_time') return isPvtImpaired;
          if (id === 'hrv_rmssd') return isHrvDepressed;
          return false;
        }
      ),
      explanation: `Elevated cabin pCO2 (${co2Reading.toFixed(1)} mmHg) coupled with sleep disruption and cognitive psychomotor slowing (${pvtReactionTimeMs ?? 'N/A'} ms) indicates developing spaceflight hypercapnia and secondary autonomic strain.`,
    };
  }

  return {
    alertId: 'hypercapnia_fatigue_syndrome',
    detected: false,
    severity: 'nominal',
    contributingMetrics: [],
    explanation: 'Atmospheric CO2 and cognitive parameters within mission tolerances.',
  };
}
