import {
  MetricReading,
  HealthAlert,
  DecisionProtocol,
  MedicalInventoryItem,
  SensorDevice,
  MissionContext,
  TimeSeriesPoint,
} from '../types/health';

export const INITIAL_MISSION_CONTEXT: MissionContext = {
  missionName: 'ARES-V: MARS CRUISE',
  crewMember: {
    name: 'Dr. Elena Rostova',
    role: 'Flight Bioengineer / Medical Lead',
    callsign: 'Ares-3',
    age: 36,
    bloodType: 'O-Rh+',
    preflightWeightKg: 64.2,
    currentEstimatedWeightKg: 62.8,
    cumulativeEvaHours: 34.5,
  },
  missionDayMET: 'MET +184d 14h 28m',
  missionPhase: 'Mars Transit — Mid-Cruise Phase 2',
  distanceFromEarthKm: 128450000,
  commOneWayDelaySeconds: 862, // 14m 22s
  currentScenario: 'nominal_cruise',
  simulatedTimeOffsetHours: 0,
};

export const INITIAL_METRICS: MetricReading[] = [
  // CARDIOVASCULAR
  {
    id: 'hr_resting',
    name: 'Resting Heart Rate',
    category: 'cardiovascular',
    currentValue: 62,
    unit: 'bpm',
    baseline: {
      mean: 60,
      stdDev: 4,
      acceptableMin: 48,
      acceptableMax: 76,
      unit: 'bpm',
      nominalDirection: 'neutral',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 3,
    signalConfidence: 98,
    status: 'nominal',
    sensorSource: 'Bio-Harness Chest Patch (BH-03)',
    shortDescription: 'Sleep and quiet resting pulse derived from continuous 3-lead ECG.',
    clinicalSignificance: 'Elevations signal microgravity plasma volume contraction, stress, infection, or hypercapnia.',
  },
  {
    id: 'hrv_rmssd',
    name: 'Heart Rate Variability (rMSSD)',
    category: 'cardiovascular',
    currentValue: 56,
    unit: 'ms',
    baseline: {
      mean: 58,
      stdDev: 6,
      acceptableMin: 40,
      acceptableMax: 85,
      unit: 'ms',
      nominalDirection: 'higher_is_better',
    },
    provenance: 'derived_algorithmic',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 4,
    signalConfidence: 96,
    status: 'nominal',
    sensorSource: 'ECG Autonomic Algorithmic Decomposition',
    shortDescription: 'Root mean square of successive RR interval differences (parasympathetic autonomic tone).',
    clinicalSignificance: 'Direct marker of autonomic recovery, systemic fatigue, and physiological reserve.',
  },
  {
    id: 'bp_systolic',
    name: 'Blood Pressure (Systolic)',
    category: 'cardiovascular',
    currentValue: 114,
    unit: 'mmHg',
    baseline: {
      mean: 116,
      stdDev: 5,
      acceptableMin: 100,
      acceptableMax: 132,
      unit: 'mmHg',
      nominalDirection: 'neutral',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 120,
    signalConfidence: 94,
    status: 'nominal',
    sensorSource: 'Optical Tonometry Wrist Band (OTW-1)',
    shortDescription: 'Calibrated arterial pulse waveform systolic peak.',
    clinicalSignificance: 'Monitors microgravity cephalad fluid redistribution and arterial compliance.',
  },
  {
    id: 'spo2',
    name: 'Blood Oxygen Saturation (SpO2)',
    category: 'cardiovascular',
    currentValue: 98,
    unit: '%',
    baseline: {
      mean: 98,
      stdDev: 0.8,
      acceptableMin: 95,
      acceptableMax: 100,
      unit: '%',
      nominalDirection: 'higher_is_better',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 4,
    signalConfidence: 99,
    status: 'nominal',
    sensorSource: 'Reflectance Pulse Oximeter',
    shortDescription: 'Peripheral arterial oxygen saturation.',
    clinicalSignificance: 'Monitors cabin oxygenation efficiency and respiratory adequacy.',
  },
  {
    id: 'sv_index',
    name: 'Stroke Volume Index',
    category: 'cardiovascular',
    currentValue: 44,
    unit: 'mL/m²',
    baseline: {
      mean: 45,
      stdDev: 3.5,
      acceptableMin: 36,
      acceptableMax: 56,
      unit: 'mL/m²',
      nominalDirection: 'higher_is_better',
    },
    provenance: 'derived_algorithmic',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 300,
    signalConfidence: 91,
    status: 'nominal',
    sensorSource: 'Bioimpedance Cardiography (ICG-2)',
    shortDescription: 'Left ventricular stroke volume indexed to body surface area.',
    clinicalSignificance: 'Monitors progressive microgravity myocardial deconditioning and venous return.',
  },

  // MUSCULOSKELETAL
  {
    id: 'dxa_bmd_tscore',
    name: 'Calcaneus BMD (Ultrasound T-Score)',
    category: 'musculoskeletal',
    currentValue: -0.28,
    unit: 'T-score',
    baseline: {
      mean: -0.20,
      stdDev: 0.12,
      acceptableMin: -1.0,
      acceptableMax: 1.0,
      unit: 'T-score',
      nominalDirection: 'higher_is_better',
    },
    provenance: 'periodic_lab',
    lastUpdated: new Date(Date.now() - 3600000 * 48).toISOString(),
    freshnessSeconds: 172800, // 48h ago
    signalConfidence: 95,
    status: 'nominal',
    sensorSource: 'Portable Quantitative Ultrasound (QUS-Space)',
    shortDescription: 'Broadband ultrasound attenuation score evaluating cancellous bone mineral density.',
    clinicalSignificance: 'Detects microgravity osteopenia prior to irreversible trabecular microarchitectural loss.',
  },
  {
    id: 'soleus_peak_torque',
    name: 'Soleus Isometric Peak Torque',
    category: 'musculoskeletal',
    currentValue: 182,
    unit: 'N·m',
    baseline: {
      mean: 185,
      stdDev: 8,
      acceptableMin: 160,
      acceptableMax: 220,
      unit: 'N·m',
      nominalDirection: 'higher_is_better',
    },
    provenance: 'periodic_lab',
    lastUpdated: new Date(Date.now() - 3600000 * 24).toISOString(),
    freshnessSeconds: 86400,
    signalConfidence: 92,
    status: 'nominal',
    sensorSource: 'ARED Dynamometer Telemetry Unit',
    shortDescription: 'Maximal voluntary isometric contraction torque of postural anti-gravity calf musculature.',
    clinicalSignificance: 'Postural muscles (soleus, gastrocnemius) atrophy rapidly without high-load resistive countermeasures.',
  },
  {
    id: 'spine_elongation_cm',
    name: 'Spinal Elongation',
    category: 'musculoskeletal',
    currentValue: 4.1,
    unit: 'cm',
    baseline: {
      mean: 4.0,
      stdDev: 0.5,
      acceptableMin: 2.0,
      acceptableMax: 6.2,
      unit: 'cm',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'self_reported',
    lastUpdated: new Date(Date.now() - 3600000 * 8).toISOString(),
    freshnessSeconds: 28800,
    signalConfidence: 89,
    status: 'nominal',
    sensorSource: 'Laser Anthropometric Stadiometer',
    shortDescription: 'Microgravity intervertebral disc expansion and spinal unloading.',
    clinicalSignificance: 'Correlates with spaceflight lumbar back pain and herniation risk.',
  },

  // NEURO-COGNITIVE & BEHAVIORAL
  {
    id: 'sleep_duration',
    name: 'Total Sleep Duration',
    category: 'neuro_cognitive',
    currentValue: 7.3,
    unit: 'hours',
    baseline: {
      mean: 7.4,
      stdDev: 0.5,
      acceptableMin: 6.2,
      acceptableMax: 8.8,
      unit: 'hours',
      nominalDirection: 'higher_is_better',
    },
    provenance: 'derived_algorithmic',
    lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString(),
    freshnessSeconds: 21600,
    signalConfidence: 96,
    status: 'nominal',
    sensorSource: 'Polysomnography Sleep Patch & Actigraphy',
    shortDescription: 'Nocturnal total sleep time excluding awakenings.',
    clinicalSignificance: 'Chronic sleep debt degrades executive function, situational awareness, and immune competence.',
  },
  {
    id: 'pvt_reaction_time',
    name: 'PVT Mean Reaction Time',
    category: 'neuro_cognitive',
    currentValue: 228,
    unit: 'ms',
    baseline: {
      mean: 220,
      stdDev: 15,
      acceptableMin: 185,
      acceptableMax: 275,
      unit: 'ms',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'self_reported',
    lastUpdated: new Date(Date.now() - 3600000 * 7).toISOString(),
    freshnessSeconds: 25200,
    signalConfidence: 99,
    status: 'nominal',
    sensorSource: 'VIGIL Built-in Psychomotor Vigilance Task',
    shortDescription: 'Validated 10-minute millisecond-precision sustained visual attention test.',
    clinicalSignificance: 'Gold standard spaceflight operational metric for acute cognitive fatigue and lapse propensity.',
  },
  {
    id: 'pvt_lapse_rate',
    name: 'PVT Lapse Count (>500ms)',
    category: 'neuro_cognitive',
    currentValue: 0,
    unit: 'lapses',
    baseline: {
      mean: 0.2,
      stdDev: 0.4,
      acceptableMin: 0,
      acceptableMax: 1,
      unit: 'lapses',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'self_reported',
    lastUpdated: new Date(Date.now() - 3600000 * 7).toISOString(),
    freshnessSeconds: 25200,
    signalConfidence: 99,
    status: 'nominal',
    sensorSource: 'VIGIL Built-in Psychomotor Vigilance Task',
    shortDescription: 'Number of delayed attentional responses exceeding 500 milliseconds.',
    clinicalSignificance: 'Microsleeps and lapses correlate directly with manual docking and critical EVA errors.',
  },

  // IMMUNE & SYSTEMIC
  {
    id: 'core_temp_circadian',
    name: 'Core Body Temperature',
    category: 'immune_systemic',
    currentValue: 37.1,
    unit: '°C',
    baseline: {
      mean: 37.1,
      stdDev: 0.2,
      acceptableMin: 36.5,
      acceptableMax: 37.6,
      unit: '°C',
      nominalDirection: 'neutral',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 15,
    signalConfidence: 97,
    status: 'nominal',
    sensorSource: 'Double-Sensor Heat Flux Forehead Sensor (D-Temp)',
    shortDescription: 'Non-invasive continuous deep body temperature measurement.',
    clinicalSignificance: 'Microgravity alters sweat evaporation, raising baseline core temperature (~1°C "space fever").',
  },
  {
    id: 'wbc_count',
    name: 'WBC (Leukocyte Count)',
    category: 'immune_systemic',
    currentValue: 6.4,
    unit: '×10⁹/L',
    baseline: {
      mean: 6.2,
      stdDev: 0.7,
      acceptableMin: 4.2,
      acceptableMax: 9.8,
      unit: '×10⁹/L',
      nominalDirection: 'neutral',
    },
    provenance: 'periodic_lab',
    lastUpdated: new Date(Date.now() - 3600000 * 72).toISOString(),
    freshnessSeconds: 259200,
    signalConfidence: 94,
    status: 'nominal',
    sensorSource: 'i-STAT Bio-MEMS Cartridge Unit',
    shortDescription: 'Automated microfluidic differential white blood cell count.',
    clinicalSignificance: 'Monitors spaceflight immune dysregulation and subclinical latent viral reactivation.',
  },
  {
    id: 'hydration_usg',
    name: 'Urine Specific Gravity (Hydration)',
    category: 'immune_systemic',
    currentValue: 1.017,
    unit: 'SG',
    baseline: {
      mean: 1.016,
      stdDev: 0.003,
      acceptableMin: 1.008,
      acceptableMax: 1.025,
      unit: 'SG',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'periodic_lab',
    lastUpdated: new Date(Date.now() - 3600000 * 5).toISOString(),
    freshnessSeconds: 18000,
    signalConfidence: 95,
    status: 'nominal',
    sensorSource: 'Optoelectronic Refractometer WMS',
    shortDescription: 'Specific gravity of morning void evaluating renal solute concentration.',
    clinicalSignificance: 'Microgravity suppresses thirst; dehydration increases renal calculus (nephrolithiasis) risk.',
  },

  // RADIATION EXPOSURE
  {
    id: 'dosimeter_dose_rate',
    name: 'Active Dosimeter Dose Rate',
    category: 'radiation',
    currentValue: 27.2,
    unit: 'μSv/h',
    baseline: {
      mean: 26.5,
      stdDev: 2.8,
      acceptableMin: 18.0,
      acceptableMax: 45.0,
      unit: 'μSv/h',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 6,
    signalConfidence: 99,
    status: 'nominal',
    sensorSource: 'Active Silicon Pixel Dosimeter (RAM-07)',
    shortDescription: 'Real-time ionizing radiation dose rate inside crew habitat.',
    clinicalSignificance: 'Monitors deep-space Galactic Cosmic Rays (GCR) and detects Solar Particle Events (SPE).',
  },
  {
    id: 'cumulative_mission_dose',
    name: 'Cumulative Mission Dose',
    category: 'radiation',
    currentValue: 118.6,
    unit: 'mSv',
    baseline: {
      mean: 118.0,
      stdDev: 5.0,
      acceptableMin: 0,
      acceptableMax: 250.0,
      unit: 'mSv',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 60,
    signalConfidence: 100,
    status: 'nominal',
    sensorSource: 'Dosimetry Accumulator Registry',
    shortDescription: 'Integrated career equivalent dose for Sol 184 (Mars Transit).',
    clinicalSignificance: 'NASA career limit ~600 mSv; 30-day SPE contingency threshold is 250 mSv.',
  },

  // SPACECRAFT ENVIRONMENT (ECLSS)
  {
    id: 'eclss_co2',
    name: 'Cabin Partial Pressure CO2 (pCO2)',
    category: 'environment',
    currentValue: 2.2,
    unit: 'mmHg',
    baseline: {
      mean: 2.1,
      stdDev: 0.3,
      acceptableMin: 1.2,
      acceptableMax: 2.8,
      unit: 'mmHg',
      nominalDirection: 'lower_is_better',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 2,
    signalConfidence: 99,
    status: 'nominal',
    sensorSource: 'ECLSS Tunable Laser Spectrometer (TLS-02)',
    shortDescription: 'Atmospheric carbon dioxide partial pressure in hab module.',
    clinicalSignificance: 'Microgravity lacks convective air mixing; elevated CO2 causes headache, visual changes (SANS), and lethargy.',
  },
  {
    id: 'eclss_o2',
    name: 'Cabin Partial Pressure O2 (pO2)',
    category: 'environment',
    currentValue: 21.3,
    unit: 'kPa',
    baseline: {
      mean: 21.2,
      stdDev: 0.4,
      acceptableMin: 19.5,
      acceptableMax: 23.0,
      unit: 'kPa',
      nominalDirection: 'neutral',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 2,
    signalConfidence: 99,
    status: 'nominal',
    sensorSource: 'ECLSS Primary Atmosphere Cell',
    shortDescription: 'Cabin oxygen partial pressure.',
    clinicalSignificance: 'Maintains normoxic alveolar oxygenation without hyperoxic flammability risk.',
  },
  {
    id: 'cabin_pressure',
    name: 'Total Cabin Atmospheric Pressure',
    category: 'environment',
    currentValue: 101.4,
    unit: 'kPa',
    baseline: {
      mean: 101.3,
      stdDev: 0.5,
      acceptableMin: 98.5,
      acceptableMax: 103.5,
      unit: 'kPa',
      nominalDirection: 'neutral',
    },
    provenance: 'direct_continuous',
    lastUpdated: new Date().toISOString(),
    freshnessSeconds: 5,
    signalConfidence: 100,
    status: 'nominal',
    sensorSource: 'Barometric Redundant Sensor Bay',
    shortDescription: 'Internal pressure of pressurized habitat vessel (equivalent to 1.0 atm sea level).',
    clinicalSignificance: 'Rapid drops indicate decompression emergency or seal breach.',
  },
];

export const INITIAL_ALERTS: HealthAlert[] = [];

export const INITIAL_PROTOCOLS: DecisionProtocol[] = [
  {
    id: 'proc_co2_remediation',
    alertId: 'alert_co2_hypercapnia_fatigue',
    title: 'ECLSS Scrubber Bed Switch & Hypercapnic Recovery Protocol',
    urgency: 'warning',
    objective: 'Reduce cabin CO2 partial pressure below 2.0 mmHg and clear astronaut cerebral vasodilation.',
    estimatedDuration: '45 minutes',
    requiredEquipment: [
      'ECLSS Amine/LiOH Scrubber Bed B',
      'Portable Air Velocity Meter (check dead-air ventilation pocket)',
      'WHO Oral Rehydration Salt Sachet (1L)',
    ],
    clinicalRationale:
      'Astronauts are uniquely sensitive to CO2 due to cephalad fluid shift and absent convective airflow. Lowering ambient pCO2 and expanding intravascular volume restores cerebral autoregulation.',
    followUpWindow: 'Repeat PVT reaction test and recheck ECLSS CO2 in 4 hours.',
    steps: [
      {
        id: 'step_1',
        label: 'Verify Local Air Circulation Fan in Crew Quarters',
        description: 'Ensure the personal 24V ventilation duct is unblocked and set to >= 0.2 m/s to disperse exhaled CO2 pocket.',
        isCompleted: false,
      },
      {
        id: 'step_2',
        label: 'Switch Primary ECLSS Scrubber to Secondary Amine Bed B',
        description: 'In ECLSS control panel, initiate desorb cycle on Bed A and engage regenerated Bed B.',
        requiredResource: {
          name: 'ECLSS Scrubber Bed B (Standby)',
          inventoryItemId: 'inv_scrubber_bed',
          quantity: 1,
          unit: 'bed',
        },
        isCompleted: false,
      },
      {
        id: 'step_3',
        label: 'Consume 1.0L Oral Electrolyte Solution',
        description: 'Reconstitute 1 sachet in potable water pouch; drink over 30 minutes to support renal bicarbonate compensation.',
        requiredResource: {
          name: 'Oral Electrolyte Rehydration Sachet',
          inventoryItemId: 'inv_ors_electrolytes',
          quantity: 1,
          unit: 'sachet',
        },
        isCompleted: false,
      },
      {
        id: 'step_4',
        label: 'Schedule 30-Minute Rest and Optic SANS Self-Check',
        description: 'Perform visual acuity self-check on the tablet and rest with darkened visor to alleviate photophobia.',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'proc_spe_radiation_shelter',
    alertId: 'alert_spe_radiation',
    title: 'Solar Particle Event (SPE) Radiation Shelter & Shielding Protocol',
    urgency: 'critical',
    objective: 'Minimize proton flux absorption by retreating to central storm shelter and activating water-wall.',
    estimatedDuration: '20 minutes',
    requiredEquipment: [
      'Central Hab Storm Shelter Water-Wall',
      'Passive & Active Dosimeter RAM-07',
      'Personal Radioprotectant Kit (Amifostine/Antioxidant Pack)',
    ],
    clinicalRationale:
      'Coronal Mass Ejections (CME) deliver high-energy solar protons capable of causing acute radiation sickness (ARS) and severe DNA double-strand breaks without hydrogen-rich shielding.',
    followUpWindow: 'Continuous dosimeter monitoring until solar proton flux falls below 10 pfu (particle flux units).',
    steps: [
      {
        id: 'spe_step_1',
        label: 'Cease All Unpressurized Activity / EVA Contingency Abort',
        description: 'Immediate halt of unshielded maintenance tasks and seal module bulkheads.',
        isCompleted: false,
      },
      {
        id: 'spe_step_2',
        label: 'Deploy Water-Wall Radiation Bladders',
        description: 'Open water transfer manifold valve 4B to fill perimeter ballast bladders surrounding crew bunk module.',
        requiredResource: {
          name: 'Water-Wall Radiation Bladder System',
          inventoryItemId: 'inv_water_wall',
          quantity: 1,
          unit: 'system',
        },
        isCompleted: false,
      },
      {
        id: 'spe_step_3',
        label: 'Affix Personal Dosimeter to Central Torso',
        description: 'Keep RAM-07 facing outward; record hourly dose accumulation in VIGIL.',
        isCompleted: false,
      },
      {
        id: 'spe_step_4',
        label: 'Ingest Prescribed Antioxidant/Radioprotective Countermeasure',
        description: 'Oral formulation to scavenge reactive oxygen species (ROS) induced by secondary ionizing radiation.',
        requiredResource: {
          name: 'Radioprotectant Antioxidant Sachet',
          inventoryItemId: 'inv_radioprotectant',
          quantity: 1,
          unit: 'dose',
        },
        isCompleted: false,
      },
    ],
  },
];

export const INITIAL_INVENTORY: MedicalInventoryItem[] = [
  {
    id: 'inv_scrubber_bed',
    name: 'ECLSS Amine Scrubber Canister',
    category: 'eclss_filter',
    totalCount: 6,
    availableCount: 4,
    unit: 'canisters',
    storageLocker: 'ECLSS Bay 2 — Rack Delta',
    criticalLevel: 2,
  },
  {
    id: 'inv_ors_electrolytes',
    name: 'WHO Oral Electrolyte Rehydration Salts',
    category: 'hydration',
    totalCount: 48,
    availableCount: 42,
    unit: 'sachets',
    storageLocker: 'Medical Locker 1 (Galley MedKit)',
    criticalLevel: 10,
  },
  {
    id: 'inv_water_wall',
    name: 'Storm Shelter Water-Wall Bladder Manifold',
    category: 'shielding',
    totalCount: 1,
    availableCount: 1,
    unit: 'unit',
    storageLocker: 'Central Hab Core Storm Bunk',
    criticalLevel: 1,
  },
  {
    id: 'inv_radioprotectant',
    name: 'Radioprotectant Antioxidant Countermeasure Pack',
    category: 'pharmaceutical',
    totalCount: 30,
    availableCount: 28,
    unit: 'doses',
    storageLocker: 'Medical Safe A (Class 1)',
    criticalLevel: 6,
  },
  {
    id: 'inv_acetazolamide',
    name: 'Acetazolamide (Diamox) 250mg',
    category: 'pharmaceutical',
    totalCount: 30,
    availableCount: 30,
    unit: 'tablets',
    storageLocker: 'Medical Safe B (SANS Kit)',
    criticalLevel: 8,
  },
  {
    id: 'inv_istat_cartridges',
    name: 'i-STAT Bio-MEMS Cartridges (CHEM8+)',
    category: 'diagnostic_tool',
    totalCount: 24,
    availableCount: 18,
    unit: 'cartridges',
    storageLocker: 'Bio-Diagnostic Freezers (-20°C)',
    criticalLevel: 5,
  },
];

export const INITIAL_SENSORS: SensorDevice[] = [
  {
    id: 'sens_bh03',
    name: 'Bio-Harness 3-Lead ECG & Respiratory Strap',
    hardwareModel: 'Zephyr-Space Mk IV',
    bodySiteOrLocation: 'Mid-Thorax Skin Contact',
    connectionStatus: 'online',
    dataQualityPct: 98,
    batteryPct: 88,
    lastCalibrationMET: 'MET +178d',
    monitoredMetrics: ['hr_resting', 'hrv_rmssd'],
    firmwareVersion: 'v4.1.2-sp',
  },
  {
    id: 'sens_otw1',
    name: 'Optical Tonometry & Pulse Oximeter Band',
    hardwareModel: 'SentioSpace Wristband Pro',
    bodySiteOrLocation: 'Left Radial Wrist',
    connectionStatus: 'online',
    dataQualityPct: 96,
    batteryPct: 74,
    lastCalibrationMET: 'MET +180d',
    monitoredMetrics: ['bp_systolic', 'spo2'],
    firmwareVersion: 'v3.8.0',
  },
  {
    id: 'sens_dtemp',
    name: 'Double-Sensor Core Heat Flux Patch',
    hardwareModel: 'Dräger-Space Circadian Sensor',
    bodySiteOrLocation: 'Forehead Supraorbital Region',
    connectionStatus: 'online',
    dataQualityPct: 97,
    batteryPct: 91,
    lastCalibrationMET: 'MET +182d',
    monitoredMetrics: ['core_temp_circadian'],
    firmwareVersion: 'v2.4.9',
  },
  {
    id: 'sens_ram07',
    name: 'Silicon Microdosimeter RAM-07',
    hardwareModel: 'Timepix3 Active Dosimeter',
    bodySiteOrLocation: 'Flight Suit Left Lapel / Hab Module',
    connectionStatus: 'online',
    dataQualityPct: 100,
    batteryPct: 95,
    lastCalibrationMET: 'MET +160d',
    monitoredMetrics: ['dosimeter_dose_rate', 'cumulative_mission_dose'],
    firmwareVersion: 'v5.0.1',
  },
  {
    id: 'sens_tls02',
    name: 'ECLSS Tunable Laser Spectrometer Gas Array',
    hardwareModel: 'JPL / Hamilton-Sundstrand TLS-02',
    bodySiteOrLocation: 'Hab Module Duct Inflow 4',
    connectionStatus: 'online',
    dataQualityPct: 99,
    batteryPct: 100, // Hardwired to main bus
    lastCalibrationMET: 'MET +181d',
    monitoredMetrics: ['eclss_co2', 'eclss_o2', 'cabin_pressure'],
    firmwareVersion: 'v8.2.0-eclss',
  },
  {
    id: 'sens_ared',
    name: 'ARED Force Dynamometer Telemetry Unit',
    hardwareModel: 'NASA ARED-II Instrumentation',
    bodySiteOrLocation: 'Exercise Gym Bay Deck',
    connectionStatus: 'online',
    dataQualityPct: 94,
    batteryPct: 100,
    lastCalibrationMET: 'MET +175d',
    monitoredMetrics: ['soleus_peak_torque', 'dxa_bmd_tscore'],
    firmwareVersion: 'v3.1.4',
  },
];

/**
 * Generates realistic longitudinal data points for the given metric
 */
export function generateTimeSeriesData(
  metricId: string,
  timeframe: '24h' | '7d' | '30d',
  scenarioMultiplier: number = 1.0
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const count = timeframe === '24h' ? 24 : timeframe === '7d' ? 28 : 30;
  const now = Date.now();
  const stepMs = timeframe === '24h' ? 3600000 : timeframe === '7d' ? (7 * 86400000) / 28 : 86400000;

  // Base values per metric
  let baseVal = 60;
  let std = 3;
  let minAccept = 48;
  let maxAccept = 80;

  if (metricId === 'hr_resting') {
    baseVal = 60; std = 3.5; minAccept = 48; maxAccept = 76;
  } else if (metricId === 'hrv_rmssd') {
    baseVal = 58; std = 5.0; minAccept = 40; maxAccept = 85;
  } else if (metricId === 'eclss_co2') {
    baseVal = 2.1; std = 0.25; minAccept = 1.2; maxAccept = 2.8;
  } else if (metricId === 'dosimeter_dose_rate') {
    baseVal = 26.5; std = 2.2; minAccept = 18.0; maxAccept = 45.0;
  } else if (metricId === 'pvt_reaction_time') {
    baseVal = 220; std = 12; minAccept = 185; maxAccept = 275;
  } else if (metricId === 'sleep_duration') {
    baseVal = 7.4; std = 0.4; minAccept = 6.2; maxAccept = 8.8;
  } else if (metricId === 'core_temp_circadian') {
    baseVal = 37.1; std = 0.15; minAccept = 36.5; maxAccept = 37.6;
  } else if (metricId === 'sv_index') {
    baseVal = 45; std = 2.5; minAccept = 36; maxAccept = 56;
  } else if (metricId === 'bp_systolic') {
    baseVal = 116; std = 4.0; minAccept = 100; maxAccept = 132;
  }

  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * stepMs);
    const hours = t.getHours().toString().padStart(2, '0');
    const minutes = t.getMinutes().toString().padStart(2, '0');
    const displayTime = timeframe === '24h' ? `${hours}:${minutes}` : `Sol ${184 - Math.floor(i / (count / 7))}`;

    // Natural sinusoidal circadian rhythm + random jitter
    const cycle = Math.sin((i / 24) * Math.PI * 2) * (std * 0.7);
    const noise = ((i * 17) % 7 - 3) * (std * 0.2);

    let val = baseVal + cycle + noise;

    // Apply scenario modifier toward recent points if applicable
    if (scenarioMultiplier !== 1.0 && i < count * 0.4) {
      const blend = (count * 0.4 - i) / (count * 0.4);
      val = val + (baseVal * (scenarioMultiplier - 1.0)) * blend;
    }

    points.push({
      timestamp: t.toISOString(),
      displayTime,
      value: Math.round(val * 100) / 100,
      baselineMean: baseVal,
      baselineMin: minAccept,
      baselineMax: maxAccept,
    });
  }

  return points;
}
