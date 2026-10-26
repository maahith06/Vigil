import {
  MetricReading,
  HealthAlert,
  SensorDevice,
  DecisionProtocol,
  MissionScenarioId,
  ScenarioDefinition,
  SeverityLevel,
} from '../types/health';
import { evaluateMetricSeverity } from '../utils/mathAndBaselines';

export const MISSION_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'nominal_cruise',
    name: '1. Nominal Deep-Space Cruise',
    badge: 'NOMINAL',
    summary: 'All life support and physiological markers within expected long-duration flight baselines.',
    clinicalDomain: 'Systemic Health',
    expectedOutcome: 'Stable baselines; routine circadian rhythm; no acute interventions required.',
  },
  {
    id: 'co2_hypercapnia_fatigue',
    name: '2. Cabin CO2 Rise & Cognitive Fatigue',
    badge: 'CRITICAL DEMO',
    summary: 'Scrubber canister bed A saturated -> pCO2 reaches 3.7 mmHg -> sleep disruption, morning headache, and PVT lapses.',
    clinicalDomain: 'ECLSS & Cognitive',
    expectedOutcome: 'Demonstrates end-to-end Gather → Monitor → Evaluate → Explain → Act → Reassess workflow.',
  },
  {
    id: 'solar_particle_event',
    name: '3. Solar Particle Event (SPE) Hazard',
    badge: 'RADIATION ALERT',
    summary: 'Coronal Mass Ejection proton storm raises dosimeter rate from 26 to 184 μSv/h. Requires storm shelter protocol.',
    clinicalDomain: 'Space Radiation',
    expectedOutcome: 'Context-sensitive storm shelter protocol and dosimeter rate tracking.',
  },
  {
    id: 'cardiovascular_deconditioning',
    name: '4. Cephalad Shift & Orthostatic Risk',
    badge: 'CARDIOVASCULAR',
    summary: 'Microgravity plasma volume contraction, reduced stroke volume index, and compensatory resting tachycardia.',
    clinicalDomain: 'Cardiovascular',
    expectedOutcome: 'Prescribes target lower-body negative pressure (LBNP) & saline fluid countermeasure.',
  },
  {
    id: 'sensor_fault_missing_data',
    name: '5. Bio-Harness Sensor Dropout',
    badge: 'DATA LOSS',
    summary: 'Mid-thorax ECG patch loses skin electrode contact. Demonstrates graceful missing-data handling without false-healthy assumptions.',
    clinicalDomain: 'Telemetry Health',
    expectedOutcome: 'System highlights data gap, marks confidence at 0%, and prompts astronaut to inspect hardware.',
  },
  {
    id: 'upper_respiratory_syndrome',
    name: '6. Spaceflight Latent Viral / Immune Reactivation',
    badge: 'IMMUNE / ILLNESS',
    summary: 'Core temp elevated to 38.2°C, elevated leukocyte count on i-STAT cartridge, and nasal mucosal congestion.',
    clinicalDomain: 'Immune & Systemic',
    expectedOutcome: 'Differential diagnosis guidance, antipyretic administration, and biological barrier check.',
  },
];

/**
 * Transforms base metrics and state based on the selected scenario and simulated progression
 */
export function applyScenarioToState(
  scenarioId: MissionScenarioId,
  baseMetrics: MetricReading[],
  baseSensors: SensorDevice[],
  timeOffsetHours: number,
  isProtocolCompleted: boolean
): {
  metrics: MetricReading[];
  sensors: SensorDevice[];
  alerts: HealthAlert[];
} {
  // Clone
  const metrics: MetricReading[] = JSON.parse(JSON.stringify(baseMetrics));
  const sensors: SensorDevice[] = JSON.parse(JSON.stringify(baseSensors));
  const alerts: HealthAlert[] = [];

  const now = new Date();

  switch (scenarioId) {
    case 'nominal_cruise': {
      // All nominal, baseline values
      for (const m of metrics) {
        m.status = evaluateMetricSeverity(m.currentValue, m.baseline);
      }
      break;
    }

    case 'co2_hypercapnia_fatigue': {
      // If protocol completed and time offset >= 4h: REASSESSMENT RESOLUTION!
      const isResolved = isProtocolCompleted && timeOffsetHours >= 4;
      const isResolving = isProtocolCompleted && timeOffsetHours < 4;

      const co2 = metrics.find((m) => m.id === 'eclss_co2');
      if (co2) {
        co2.currentValue = isResolved ? 1.8 : isResolving ? 2.3 : 3.7;
        co2.status = isResolved ? 'nominal' : isResolving ? 'advisory' : 'critical';
        co2.shortDescription = isResolved
          ? 'Post-scrubber Bed B transition: pCO2 reduced back to nominal reserve levels.'
          : 'Elevated hab pCO2 due to saturated amine bed A.';
      }

      const pvt = metrics.find((m) => m.id === 'pvt_reaction_time');
      if (pvt) {
        pvt.currentValue = isResolved ? 222 : isResolving ? 245 : 325;
        pvt.status = isResolved ? 'nominal' : isResolving ? 'nominal' : 'warning';
      }

      const lapse = metrics.find((m) => m.id === 'pvt_lapse_rate');
      if (lapse) {
        lapse.currentValue = isResolved ? 0 : 3;
        lapse.status = isResolved ? 'nominal' : 'warning';
      }

      const sleep = metrics.find((m) => m.id === 'sleep_duration');
      if (sleep) {
        sleep.currentValue = 5.2; // Fragmented sleep
        sleep.status = isResolved ? 'nominal' : 'warning';
      }

      const hrv = metrics.find((m) => m.id === 'hrv_rmssd');
      if (hrv) {
        hrv.currentValue = isResolved ? 54 : 34; // autonomic depression
        hrv.status = isResolved ? 'nominal' : 'advisory';
      }

      alerts.push({
        id: 'alert_co2_hypercapnia_fatigue',
        title: isResolved
          ? 'RESOLVED: Hypercapnia & Cognitive Fatigue Event'
          : isResolving
          ? 'RESOLVING: Post-Intervention Stabilization in Progress'
          : 'CRITICAL ALERT: Hypercapnia & Autonomic Fatigue Pattern',
        category: 'environment',
        severity: isResolved ? 'nominal' : isResolving ? 'advisory' : 'critical',
        timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
        status: isResolved ? 'resolved' : isResolving ? 'resolving' : isProtocolCompleted ? 'in_progress' : 'active',
        triggerMetrics: ['eclss_co2', 'pvt_reaction_time', 'sleep_duration', 'hrv_rmssd'],
        contributingFactors: [
          `Cabin pCO2 measured at ${co2?.currentValue} mmHg (Baseline mean: 2.1 mmHg)`,
          `PVT Reaction time slowed to ${pvt?.currentValue} ms (+47% vs baseline)`,
          `Sleep fragmented at 5.2 hrs with frequent autonomic arousals`,
          `rMSSD HRV autonomic tone depressed to ${hrv?.currentValue} ms`,
        ],
        physiologicalExplanation:
          'Cephalad fluid shift combined with microgravity convective stagnation amplifies central nervous sensitivity to ambient CO2. At 3.7 mmHg, cerebral vasodilation induces intracranial venous engorgement, manifesting as cephalic tension, fragmented sleep architecture, and attentional lapses.',
        uncertaintyDisclaimer:
          'Algorithmic correlation derived from TLS-02 gas analyzer, bio-harness ECG, and PVT reaction trial data. Verified with high sensor confidence (>95%).',
        recommendedProcedureId: 'proc_co2_remediation',
        reassessmentSchedule: 'Repeat PVT and recheck ECLSS gas cell at +4h post-countermeasure.',
        reassessmentDeltaSummary: isResolved
          ? 'Reassessment confirmed: Cabin pCO2 decreased by -1.9 mmHg (-51%). PVT reaction time recovered to 222 ms (improvement of 103 ms). Lapses eliminated (0).'
          : isResolving
          ? 'Countermeasures applied. Gas scrubbers purging; ambient CO2 falling. Full physiological normalization expected at +4h.'
          : undefined,
        resolvedAt: isResolved ? new Date().toISOString() : undefined,
      });

      break;
    }

    case 'solar_particle_event': {
      const isSheltered = isProtocolCompleted;

      const dosimeter = metrics.find((m) => m.id === 'dosimeter_dose_rate');
      if (dosimeter) {
        dosimeter.currentValue = isSheltered ? 34.0 : 188.5; // High proton flux
        dosimeter.status = isSheltered ? 'advisory' : 'critical';
        dosimeter.shortDescription = isSheltered
          ? 'Storm shelter water-wall active: dose attenuated to acceptable temporary rate.'
          : 'UNSHIELDED PROTON STORM: Acute SPE event in progress!';
      }

      const cumDose = metrics.find((m) => m.id === 'cumulative_mission_dose');
      if (cumDose) {
        cumDose.currentValue = isSheltered ? 124.2 : 138.8;
      }

      alerts.push({
        id: 'alert_spe_radiation',
        title: isSheltered
          ? 'ADVISORY: Solar Storm Active — Storm Shelter Containment Nominal'
          : 'EMERGENCY: High-Flux Solar Particle Event (SPE) In Progress',
        category: 'radiation',
        severity: isSheltered ? 'advisory' : 'critical',
        timestamp: new Date(now.getTime() - 1800000).toISOString(),
        status: isSheltered ? 'in_progress' : 'active',
        triggerMetrics: ['dosimeter_dose_rate'],
        contributingFactors: [
          `RAM-07 active dosimeter reading ${dosimeter?.currentValue} μSv/h (> 600% above GCR background)`,
          'Solar Proton Flux > 100 MeV detected by Deep Space Gateway telemetry relay',
          'Potential acute hematopoietic and cellular DNA damage risk if unshielded',
        ],
        physiologicalExplanation:
          'Energetic protons (10-100+ MeV) penetrate thin spacecraft hull plating. Hydrogen-dense shielding (water-wall/food lockers) is necessary to thermalize and absorb high-Z and proton components before cellular ionization.',
        uncertaintyDisclaimer:
          'Direct continuous measurement via Silicon Microdosimeter RAM-07. Radiation trajectory confirmed by external solar monitor.',
        recommendedProcedureId: 'proc_spe_radiation_shelter',
        reassessmentSchedule: 'Monitor dose rate continuously. Maintain shelter posture until flux drops below 35 μSv/h.',
        reassessmentDeltaSummary: isSheltered
          ? 'Water-wall deployment successful: Attenuated active dose rate from 188.5 μSv/h down to 34.0 μSv/h (-82% exposure reduction).'
          : undefined,
      });
      break;
    }

    case 'cardiovascular_deconditioning': {
      const hr = metrics.find((m) => m.id === 'hr_resting');
      if (hr) {
        hr.currentValue = 78; // Tachycardia
        hr.status = 'warning';
      }

      const sv = metrics.find((m) => m.id === 'sv_index');
      if (sv) {
        sv.currentValue = 33; // Significantly decreased stroke volume
        sv.status = 'warning';
      }

      const hrv = metrics.find((m) => m.id === 'hrv_rmssd');
      if (hrv) {
        hrv.currentValue = 36;
        hrv.status = 'advisory';
      }

      alerts.push({
        id: 'alert_cv_deconditioning',
        title: 'WARNING: Microgravity Cardiovascular Deconditioning & Hypovolemia',
        category: 'cardiovascular',
        severity: 'warning',
        timestamp: new Date(now.getTime() - 3600000 * 5).toISOString(),
        status: isProtocolCompleted ? 'in_progress' : 'active',
        triggerMetrics: ['hr_resting', 'sv_index', 'hrv_rmssd'],
        contributingFactors: [
          'Resting stroke volume index depressed to 33 mL/m² (Baseline: 45 mL/m²)',
          'Compensatory resting tachycardia at 78 bpm (+30% vs baseline)',
          'Post-exercise recovery heart rate plateau indicating blunted baroreflex',
        ],
        physiologicalExplanation:
          'Prolonged microgravity cephalad fluid redistribution induces renal volume loss (~15% plasma volume reduction). Left ventricular end-diastolic volume drops, reducing stroke volume and triggering compensatory sympathetic chronotropic drive.',
        uncertaintyDisclaimer:
          'Continuous bio-impedance cardiography and 3-lead ECG. Non-invasive estimate; ultrasound verification recommended.',
        reassessmentSchedule: 'Execute fluid loading protocol (1.2L isotonic solution) + 45-min ARED leg press session.',
      });
      break;
    }

    case 'sensor_fault_missing_data': {
      // Simulate ECG Bioharness contact dropout
      const bioHarnessSensor = sensors.find((s) => s.id === 'sens_bh03');
      if (bioHarnessSensor) {
        bioHarnessSensor.connectionStatus = 'offline';
        bioHarnessSensor.dataQualityPct = 0;
      }

      const hr = metrics.find((m) => m.id === 'hr_resting');
      if (hr) {
        hr.currentValue = null; // MISSING!
        hr.provenance = 'missing_data';
        hr.signalConfidence = 0;
        hr.status = 'warning'; // NOT healthy!
        hr.shortDescription = 'DATA LOSS: Bio-Harness ECG electrode contact lost.';
      }

      const hrv = metrics.find((m) => m.id === 'hrv_rmssd');
      if (hrv) {
        hrv.currentValue = null; // MISSING!
        hrv.provenance = 'missing_data';
        hrv.signalConfidence = 0;
        hrv.status = 'warning';
        hrv.shortDescription = 'DATA LOSS: Cannot compute autonomic rMSSD without raw RR intervals.';
      }

      alerts.push({
        id: 'alert_sensor_dropout',
        title: 'HARDWARE ADVISORY: Bio-Harness ECG Telemetry Dropout',
        category: 'cardiovascular',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        status: 'active',
        triggerMetrics: ['hr_resting', 'hrv_rmssd'],
        contributingFactors: [
          'Zephyr-Space Bio-Harness impedance exceeded 500 kΩ (Electrode dry / displaced)',
          'Zero valid R-wave peaks detected in past 180 seconds',
          'VIGIL is refusing to assume normal cardiovascular status during data gap',
        ],
        physiologicalExplanation:
          'Sensor electrode displacement or loss of conductive hydrogel interface. Without continuous telemetry, cardiovascular baseline cannot be certified.',
        uncertaintyDisclaimer:
          'Identified strictly as hardware contact failure. Optical wrist tonometry remains available as secondary backup.',
        reassessmentSchedule: 'Moisten electrode contact pads or replace hydrogel disc on mid-thorax strap.',
      });
      break;
    }

    case 'upper_respiratory_syndrome': {
      const temp = metrics.find((m) => m.id === 'core_temp_circadian');
      if (temp) {
        temp.currentValue = 38.3; // Febrile
        temp.status = 'warning';
      }

      const wbc = metrics.find((m) => m.id === 'wbc_count');
      if (wbc) {
        wbc.currentValue = 11.4; // Leukocytosis
        wbc.status = 'warning';
      }

      const hr = metrics.find((m) => m.id === 'hr_resting');
      if (hr) {
        hr.currentValue = 76;
        hr.status = 'advisory';
      }

      alerts.push({
        id: 'alert_immune_infection',
        title: 'WARNING: Febrile Immune Response & Suspected Spaceflight Pathogen',
        category: 'immune_systemic',
        severity: 'warning',
        timestamp: new Date(now.getTime() - 3600000 * 4).toISOString(),
        status: isProtocolCompleted ? 'in_progress' : 'active',
        triggerMetrics: ['core_temp_circadian', 'wbc_count', 'hr_resting'],
        contributingFactors: [
          'Core body temperature elevated to 38.3°C (+1.2°C above baseline)',
          'i-STAT Cartridge leukocyte count elevated at 11.4 ×10⁹/L',
          'Elevated resting pulse consistent with pyrexic metabolic surge',
        ],
        physiologicalExplanation:
          'Deep-space radiation and isolation induce T-cell immunosuppression and microbial virulence shifts. Presentation indicates upper respiratory mucosal infection or Epstein-Barr / Varicella-Zoster subclinical reactivation.',
        uncertaintyDisclaimer:
          'Measured via forehead heat-flux sensor and i-STAT microfluidic cartridge. Confirmed with 94% diagnostic reliability.',
        reassessmentSchedule: 'Administer Ibuprofen 400mg, hydrate 1.5L, and quarantine personal air loop.',
      });
      break;
    }
  }

  return { metrics, sensors, alerts };
}
