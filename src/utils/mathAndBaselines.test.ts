import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateZScore,
  evaluateMetricSeverity,
  calculatePvtMetrics,
  calculateReassessmentDelta,
  detectHypercapniaSyndrome,
  formatDataFreshness,
} from './mathAndBaselines';
import { BaselineReference } from '../types/health';

test('calculateZScore computes correct deviation', () => {
  assert.equal(calculateZScore(68, 60, 4), 2);
  assert.equal(calculateZScore(52, 60, 4), -2);
  assert.equal(calculateZScore(60, 60, 4), 0);
  assert.equal(calculateZScore(null, 60, 4), null);
  assert.equal(calculateZScore(68, 60, 0), null);
});

test('evaluateMetricSeverity treats missing data as warning rather than nominal', () => {
  const baseline: BaselineReference = {
    mean: 60,
    stdDev: 4,
    acceptableMin: 48,
    acceptableMax: 82,
    unit: 'bpm',
    nominalDirection: 'neutral',
  };
  // Missing data should never be nominal!
  assert.equal(evaluateMetricSeverity(null, baseline), 'warning');
});

test('evaluateMetricSeverity identifies nominal vs warning vs critical', () => {
  const baseline: BaselineReference = {
    mean: 60,
    stdDev: 6,
    acceptableMin: 48,
    acceptableMax: 76,
    unit: 'bpm',
    nominalDirection: 'neutral',
  };
  assert.equal(evaluateMetricSeverity(61, baseline), 'nominal');
  // Mild elevation (Z = 2.17 within acceptable limits 76)
  assert.equal(evaluateMetricSeverity(73, baseline), 'advisory');
  // Outside acceptable limit (78 > 76, deviation 18 <= 3*6)
  assert.equal(evaluateMetricSeverity(78, baseline), 'warning');
  // Severe deviation > 3 std dev outside acceptable (85 - 60 = 25 > 18)
  assert.equal(evaluateMetricSeverity(85, baseline), 'critical');
});

test('calculatePvtMetrics computes valid mean, lapses and fatigue level', () => {
  const trials = [
    { reactionTimeMs: 210, isFalseStart: false, isLapse: false },
    { reactionTimeMs: 230, isFalseStart: false, isLapse: false },
    { reactionTimeMs: 220, isFalseStart: false, isLapse: false },
    { reactionTimeMs: 580, isFalseStart: false, isLapse: true }, // 1 lapse
    { reactionTimeMs: 70, isFalseStart: true, isLapse: false },  // 1 false start
  ];

  const result = calculatePvtMetrics(trials);
  assert.equal(result.totalTrials, 5);
  assert.equal(result.validTrials, 4); // 4 valid, 1 false start excluded
  assert.equal(result.lapseCount, 1);
  assert.equal(result.falseStartCount, 1);
  assert.ok(result.meanReactionTimeMs > 280);
  assert.equal(result.evaluatedFatigueLevel, 'moderate_fatigue');
});

test('calculateReassessmentDelta evaluates improvement correctly', () => {
  // Lower is better (e.g. CO2 or Heart Rate)
  const co2Delta = calculateReassessmentDelta(3.8, 2.2, 'mmHg', false);
  assert.equal(co2Delta.isImprovement, true);
  assert.ok(co2Delta.deltaPct < 0);

  // Higher is better (e.g. HRV or SpO2)
  const hrvDelta = calculateReassessmentDelta(35, 52, 'ms', true);
  assert.equal(hrvDelta.isImprovement, true);
  assert.ok(hrvDelta.deltaPct > 0);
});

test('detectHypercapniaSyndrome identifies combined multi-signal risk', () => {
  // Normal CO2
  const normal = detectHypercapniaSyndrome(2.1, 7.2, 220, 55);
  assert.equal(normal.detected, false);

  // High CO2 alone without secondary signs
  const co2Only = detectHypercapniaSyndrome(3.4, 7.0, 220, 50);
  assert.equal(co2Only.detected, false);

  // High CO2 + sleep deficit + slow PVT reaction
  const combined = detectHypercapniaSyndrome(3.6, 5.1, 340, 32);
  assert.equal(combined.detected, true);
  assert.equal(combined.severity, 'critical');
  assert.ok(combined.contributingMetrics.includes('eclss_co2'));
  assert.ok(combined.contributingMetrics.includes('pvt_reaction_time'));
});

test('formatDataFreshness formats seconds accurately', () => {
  assert.equal(formatDataFreshness(2), 'Live (< 5s)');
  assert.equal(formatDataFreshness(35), '35s ago');
  assert.equal(formatDataFreshness(180), '3m ago');
});
