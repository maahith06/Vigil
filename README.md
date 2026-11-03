<div align="center">

# 🛰️ VIGIL — Autonomous Astronaut Health Management System

**NASA Space Apps Challenge: Autonomous Health Decision Support for Long-Duration Exploration Missions**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](https://nodejs.org/api/test.html)
[![Security](https://img.shields.io/badge/Secrets-Zero_Exposed-success.svg)](SECURITY.md)

<p align="center">
  <em>An autonomous, explainable clinical decision-support and physiological monitoring platform engineered for crewed interplanetary transit beyond Earth orbit, where communication latencies make real-time Mission Control tele-medicine impossible.</em>
</p>

</div>

---

## 📋 Table of Contents

- [The Challenge: Healthcare in Deep Space](#-the-challenge-healthcare-in-deep-space)
- [System Architecture & The Closed-Loop Workflow](#-system-architecture--the-closed-loop-workflow)
- [The 6 Monitored Health Domains](#-the-6-monitored-health-domains)
- [Interactive Mission Scenarios](#-interactive-mission-scenarios)
- [Mathematical Baselines & Z-Score Detection](#-mathematical-baselines--z-score-detection)
- [Psychomotor Vigilance Task (PVT) Engine](#-psychomotor-vigilance-task-pvt-engine)
- [NASA Standards & Clinical Compliance](#-nasa-standards--clinical-compliance)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Running Tests & Linting](#-running-tests--linting)
- [Security & Zero-Secret Guarantee](#-security--zero-secret-guarantee)
- [Clinical & Educational Disclaimer](#-clinical--educational-disclaimer)
- [License](#-license)

---

## 🌌 The Challenge: Healthcare in Deep Space

During transit to Mars (e.g., the Ares-V reference mission at 128+ million kilometers from Earth), one-way radio latency exceeds **14 to 22 minutes**. Real-time telemedicine is physically prohibited by the speed of light. 

Astronauts face complex physiological hazards:
- **Cephalad Fluid Shift:** Redistribution of 1.5–2.0 L of fluid into the upper body, resulting in Spaceflight-Associated Neuro-ocular Syndrome (SANS), elevated intracranial pressure, and renal volume loss.
- **Cardiovascular & Musculoskeletal Deconditioning:** Microgravity disuse atrophy of postural slow-twitch muscle fibers (notably soleus) and bone mineral density loss.
- **Space Radiation & Solar Particle Events (SPE):** High-energy proton flux (>100 MeV) during coronal mass ejections requiring immediate storm sheltering.
- **Cabin Environmental Fluctuations (ECLSS):** Microgravity stagnant air pockets causing localized hypercapnia (elevated ambient pCO₂) that triggers frontal headaches and cognitive degradation.
- **Circadian Misalignment & Cumulative Fatigue:** Micro-arousals and fragmented nocturnal restorative architecture.

**VIGIL** provides an autonomous, local, explainable clinical engine that enables crew members to gather biometric telemetry, detect anomalies, understand underlying pathophysiology, execute procedural countermeasures, and audit recovery—without waiting for ground confirmation.

---

## 🔄 System Architecture & The Closed-Loop Workflow

VIGIL enforces a rigorous 6-stage clinical decision-support loop:

```
┌───────────┐     ┌───────────┐     ┌────────────┐
│ 1. GATHER │ ──> │ 2. MONITOR│ ──> │ 3. EVALUATE│
│ Telemetry │     │ Baselines │     │  Z-Scores  │
└───────────┘     └───────────┘     └────────────┘
                                           │
┌─────────────┐   ┌───────────┐     ┌──────▼─────┐
│6. REASSESS  │ <─┤  5. ACT   │ <── │ 4. EXPLAIN │
│ +4h Recovery│   │ Protocols │     │ Mechanism  │
└─────────────┘   └───────────┘     └────────────┘
```

1. **GATHER:** Ingest continuous streams (Hexoskin 3-lead ECG, forehead heat-flux core temperature, TLS-02 laser gas spectrometer, RAM-07 silicon microdosimeter) and periodic trials (PVT reaction assessments, isokinetic dynamometry).
2. **MONITOR:** Track data against individualized pre-flight physiological baselines rather than generic population averages.
3. **EVALUATE:** Detect multi-signal patterns and calculate standard-deviation Z-scores ($Z = \frac{X - \mu}{\sigma}$). Gracefully handle missing data or sensor dropouts without assuming false-healthy states.
4. **EXPLAIN:** Provide concise aerospace pathophysiological rationale, contributing telemetry factors, and diagnostic confidence boundaries.
5. **ACT:** Guide astronauts through step-by-step procedural checklists that consume onboard medical and life-support resources (e.g., CDRA scrubber beds, oral electrolytes, anti-inflammatories).
6. **REASSESS:** Fast-forward simulated time (+4h) to perform automated clinical audits, logging delta improvements and resolution in the flight surgeon archive.

---

## 🩺 The 6 Monitored Health Domains

| Domain | Primary Metric | Telemetry Mode | Aerospace Clinical Significance |
| :--- | :--- | :--- | :--- |
| **Cardiovascular** | Resting Heart Rate (bpm) | Continuous (ECG) | Detects orthostatic hypovolemia, baroreflex blunting, and compensatory tachycardia. |
| **Recovery & Sleep** | Sleep Duration (hours) | Periodic (Actigraphy) | Monitors slow-wave restorative architecture and autonomic recovery tone (rMSSD). |
| **Cognitive Readiness** | Reaction Time (ms) | Periodic (PVT Trials) | Evaluates sustained attentional networks, reaction latency, and lapses (>500 ms). |
| **Musculoskeletal** | Soleus Peak Torque (N·m) | Direct Isokinetic Test | Assesses anti-gravity postural torque retention and ARED resistance adherence. |
| **Immune & Thermal** | Core Temperature (°C) | Continuous (Heat-Flux) | Tracks circadian phase alignment, pyrexic metabolic surge, and viral reactivation. |
| **Radiation & Habitat** | Dosimeter Rate (μSv/h) | Active Microdosimetry | Detects Galactic Cosmic Ray (GCR) background vs. Solar Particle Event (SPE) proton storm. |

---

## 🧪 Interactive Mission Scenarios

VIGIL includes 6 fully simulated operational scenarios that exercise the entire closed-loop architecture:

1. **Nominal Deep-Space Cruise:** All life-support and biometric markers operate within expected personal envelopes.
2. **Cabin CO₂ Hypercapnia & Cognitive Fatigue (Flagship Demo):** Saturated amine scrubber bed A elevates cabin pCO₂ to 3.7 mmHg. Astronaut experiences fragmented sleep, morning headache, and PVT reaction delays (325 ms, 3 lapses). Completing the CDRA remediation protocol and advancing time (+4h) normalizes pCO₂ to 1.8 mmHg, restores reaction speed to 222 ms, and logs the incident.
3. **Solar Particle Event (SPE) Hazard:** Coronal Mass Ejection proton storm raises dosimeter flux from 26 to 188.5 μSv/h. Triggers water-wall storm shelter deployment and dose attenuation tracking.
4. **Cephalad Fluid Shift & Cardiovascular Deconditioning:** Microgravity plasma volume contraction induces depressed stroke volume index (33 mL/m²) and compensatory resting tachycardia (78 bpm). Prescribes Lower Body Negative Pressure (LBNP) and fluid loading.
5. **Bio-Harness Sensor Dropout (Data Integrity):** Mid-thorax ECG patch loses skin contact. VIGIL flags a data gap, marks confidence at 0%, avoids false-healthy assumptions, and prompts hardware lead repositioning.
6. **Latent Viral / Immune Reactivation:** Core temperature rises to 38.3°C with leukocytosis (11.4 ×10⁹/L on i-STAT cartridge), driving targeted differential diagnosis and antipyretic administration.

---

## 📊 Mathematical Baselines & Z-Score Detection

VIGIL evaluates biometric telemetry using standard score deviation:

$$Z = \frac{X - \mu}{\sigma}$$

Where:
- $X$ is the observed telemetry value.
- $\mu$ is the astronaut's pre-flight personal cruise baseline mean.
- $\sigma$ is the personal baseline standard deviation.

### Severity Classification Thresholds:
- **Nominal (Stable):** $|Z| < 1.5\sigma$ — Within normal operational flight envelope.
- **Advisory (Attention):** $1.5\sigma \le |Z| < 2.5\sigma$ — Physiological strain or trend deviation.
- **Critical (Action Required):** $|Z| \ge 2.5\sigma$ (or missing continuous telemetry on critical life-support sensors) — Immediate procedural triage triggered.

---

## ⏱️ Psychomotor Vigilance Task (PVT) Engine

The integrated **PVT Assessment Tool** provides NASA-standard psychomotor vigilance testing:
- Randomized inter-stimulus intervals (2000 ms to 10000 ms) preventing anticipation.
- Millisecond-accurate reaction timing via spacebar or touch trigger.
- Detection of **false starts** (< 100 ms) and **attentional lapses** (> 500 ms).
- Automated post-test stratification (Nominal, Mild, Moderate, or Severe Cognitive Fatigue).
- Seamless integration: committing test results immediately updates the dashboard cognitive trend and alerts.

---

## 📜 NASA Standards & Clinical Compliance

VIGIL is modeled against published aerospace medical specifications:
- **NASA-STD-3001 Volume 1 & Volume 2:** Human-System Standard for Crew Health, Habitability, and Environmental Control.
- **Cabin CO₂ Limits:** Habitable volume pCO₂ action threshold set at 2.8 mmHg (0.37 kPa).
- **Radiation Exposure Limits:** Career cumulative dose monitoring (ALARA principles) with immediate shelter alerts at > 50 μSv/h.
- **Autonomous Degradation Guard:** The system refuses to assume crew health when telemetry feeds drop offline.

---

## 💻 Technology Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with aerospace-grade white, graphite (`#1E2227`), and burnt-orange (`#D95A11`) mission identity
- **Icons:** [Lucide React](https://lucide.dev/)
- **Testing:** Node.js native test runner (`node:test` + `node:assert/strict`) via `tsx`
- **Zero External Secrets:** Completely functional offline and self-contained; optional Gemini API integration via environment proxy

---

## 📁 Repository Structure

```
.
├── .env.example               # Template environment configuration (no secrets)
├── .gitignore                  # Production gitignore (ignores all credentials & builds)
├── CONTRIBUTING.md             # Contribution guidelines and coding conventions
├── LICENSE                     # MIT Open Source License
├── README.md                   # Project documentation
├── SECURITY.md                 # Security policy and vulnerability disclosure
├── index.html                  # Application HTML entry point
├── metadata.json               # AI Studio application metadata
├── package.json                # Project dependencies and operational scripts
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite build and server configuration
└── src/
    ├── App.tsx                 # Core application controller and scenario state
    ├── main.tsx                # React DOM mounting
    ├── index.css               # Tailwind CSS imports and base styles
    ├── types/
    │   └── health.ts           # Comprehensive medical & telemetry type definitions
    ├── data/
    │   ├── initialState.ts     # Baseline telemetry, devices, inventory, and protocols
    │   └── scenarioData.ts     # 6 operational mission scenario definitions and transitions
    ├── utils/
    │   ├── mathAndBaselines.ts # Z-score models, PVT calculations, and delta evaluation
    │   └── mathAndBaselines.test.ts # Unit test suite
    └── components/
        ├── HeaderMissionBar.tsx           # Mission context, MET clock, and scenario picker
        ├── OperationalOverview.tsx        # Operations HUD (6 domain tiles, featured trend, ECLSS)
        ├── DecisionSupportView.tsx        # 6-step clinical protocol checklists & reassessment
        ├── DeepAnalyticsView.tsx          # Multi-parameter telemetry inspector
        ├── AssessmentsView.tsx            # Interactive PVT test & SANS vision exam
        ├── LifeSupportSensorsView.tsx     # Hardware devices and ECLSS bus diagnostics
        └── FlightSurgeonAssistantModal.tsx# Clinical debrief generator & consult engine
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `bun`

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/vigil-astronaut-health.git
   cd vigil-astronaut-health
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to interact with VIGIL.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🧪 Running Tests & Linting

VIGIL includes automated unit tests covering mathematical calculations, Z-score models, PVT trials, and syndrome detection:

```bash
# Run the test suite
npm run test

# Run TypeScript typechecking
npm run lint

# Build the production bundle
npm run build
```

---

## 🔒 Security & Zero-Secret Guarantee

- **No Hardcoded Secrets:** This repository has been scanned and verified to contain **zero API keys, private tokens, passwords, or personal credentials**.
- **No Private Data:** All astronaut profiles and mission telemetry represent synthetic, scientifically modeled aerospace research data.
- **Offline Self-Sufficiency:** The full platform, including all 6 scenarios, decision support checklists, and PVT testing, functions **100% offline without external network dependencies**.

See [SECURITY.md](SECURITY.md) for full details.

---

## ⚠️ Clinical & Educational Disclaimer

VIGIL is an engineering prototype and conceptual demonstration created for the **NASA Space Apps Challenge**. It demonstrates autonomous decision-support architectures for communication-delayed deep-space transit. 

It is intended strictly for research, educational, and computational design purposes. It is **not** a certified medical device and does not substitute for ground-based medical personnel or certified clinical judgment.

---

## 📄 License

This project is open source and distributed under the [MIT License](LICENSE).

```
Copyright (c) 2026 VIGIL Project Contributors
```
