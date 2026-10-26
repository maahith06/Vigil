import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart,
  Moon,
  Brain,
  Activity,
  Flame,
  Radio,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  X,
  CheckCircle2,
  Calendar,
  Wind,
  Cpu,
  Clock,
  ShieldAlert,
  CheckSquare,
  Pin,
  BookOpen,
  Info,
} from 'lucide-react';
import { MetricReading, HealthAlert, SeverityLevel, SensorDevice } from '../types/health';
import { calculateZScore } from '../utils/mathAndBaselines';
import { generateTimeSeriesData } from '../data/initialState';

interface OperationalOverviewProps {
  metrics: MetricReading[];
  alerts: HealthAlert[];
  sensors?: SensorDevice[];
  onOpenProtocol: (alertId: string) => void;
  onSelectMetricForDeepView: (metricId: string) => void;
  onOpenAssessments: () => void;
  onOpenSensors?: () => void;
}

type DomainId = 'cardiovascular' | 'sleep' | 'cognitive' | 'musculoskeletal' | 'immune' | 'radiation';

export const OperationalOverview: React.FC<OperationalOverviewProps> = ({
  metrics,
  alerts,
  sensors,
  onOpenProtocol,
  onSelectMetricForDeepView,
  onOpenAssessments,
  onOpenSensors,
}) => {
  // Selected domain state for the interactive featured trend chart
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('cardiovascular');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [pinnedPointIndex, setPinnedPointIndex] = useState<number | null>(null);

  // Progressive Disclosure: Expanded domain modal & Clinical rationale modal
  const [expandedDomain, setExpandedDomain] = useState<DomainId | null>(null);
  const [showRationaleModal, setShowRationaleModal] = useState<boolean>(false);

  // Helper to find metric
  const getMetric = (id: string) => metrics.find((m) => m.id === id);

  // Active alerts
  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');

  // Key primary metrics
  const hrMetric = getMetric('hr_resting');
  const sleepMetric = getMetric('sleep_duration');
  const pvtMetric = getMetric('pvt_reaction_time');
  const lapseMetric = getMetric('pvt_lapse_rate');
  const torqueMetric = getMetric('soleus_peak_torque');
  const bmdMetric = getMetric('dxa_bmd_tscore');
  const tempMetric = getMetric('core_temp_circadian');
  const usgMetric = getMetric('hydration_usg');
  const radRateMetric = getMetric('dosimeter_dose_rate');
  const cumRadMetric = getMetric('cumulative_mission_dose');
  const co2Metric = getMetric('eclss_co2');
  const o2Metric = getMetric('eclss_o2');
  const pressureMetric = getMetric('cabin_pressure');

  // Domain configurations
  const domainConfigs: Record<
    DomainId,
    {
      id: DomainId;
      title: string;
      icon: React.ElementType;
      primaryMetricId: string;
      primaryLabel: string;
      secondaryMetricIds: string[];
      summary: string;
      accentColor: string;
    }
  > = {
    cardiovascular: {
      id: 'cardiovascular',
      title: 'Cardiovascular',
      icon: Heart,
      primaryMetricId: 'hr_resting',
      primaryLabel: 'RESTING HR (ECG CONTINUOUS)',
      secondaryMetricIds: ['hrv_rmssd', 'bp_systolic'],
      summary: 'Resting pulse, parasympathetic recovery tone (rMSSD), and blood pressure regulation in microgravity.',
      accentColor: '#BE123C',
    },
    sleep: {
      id: 'sleep',
      title: 'Recovery & Sleep',
      icon: Moon,
      primaryMetricId: 'sleep_duration',
      primaryLabel: 'LAST SLEEP (ACTIGRAPHY)',
      secondaryMetricIds: ['hrv_rmssd'],
      summary: 'Nocturnal sleep duration, slow-wave architecture, and circadian phase alignment.',
      accentColor: '#4338CA',
    },
    cognitive: {
      id: 'cognitive',
      title: 'Cognitive Readiness',
      icon: Brain,
      primaryMetricId: 'pvt_reaction_time',
      primaryLabel: 'REACTION TIME (PVT TRIAL)',
      secondaryMetricIds: ['pvt_lapse_rate'],
      summary: 'Psychomotor vigilance reaction time, attentional lapse rate (>500ms), and operational readiness.',
      accentColor: '#B45309',
    },
    musculoskeletal: {
      id: 'musculoskeletal',
      title: 'Musculoskeletal',
      icon: Activity,
      primaryMetricId: 'soleus_peak_torque',
      primaryLabel: 'SOLEUS TORQUE (DIRECT TEST)',
      secondaryMetricIds: ['dxa_bmd_tscore'],
      summary: 'Soleus anti-gravity muscle torque, bone mineral density T-score, and countermeasure load compliance.',
      accentColor: '#047857',
    },
    immune: {
      id: 'immune',
      title: 'Immune & Thermal',
      icon: Flame,
      primaryMetricId: 'core_temp_circadian',
      primaryLabel: 'CORE TEMP (HEAT-FLUX)',
      secondaryMetricIds: ['wbc_count', 'hydration_usg'],
      summary: 'Circadian heat-flux temperature, leukocyte count, and morning urine hydration index.',
      accentColor: '#C2410C',
    },
    radiation: {
      id: 'radiation',
      title: 'Radiation & Habitat',
      icon: Radio,
      primaryMetricId: 'dosimeter_dose_rate',
      primaryLabel: 'DOSE RATE (ACTIVE DOSIMETER)',
      secondaryMetricIds: ['cumulative_mission_dose', 'eclss_co2'],
      summary: 'Active personal dosimeter flux, cumulative career dose, and cabin life support gas balance.',
      accentColor: '#7C3AED',
    },
  };

  // Scenario-adaptive focus: automatically highlight affected domain when alert occurs
  useEffect(() => {
    if (activeAlerts.length > 0) {
      const topAlert = activeAlerts[0];
      if (topAlert.triggerMetrics.includes('dosimeter_dose_rate')) {
        setSelectedDomain('radiation');
      } else if (topAlert.triggerMetrics.includes('eclss_co2') || topAlert.triggerMetrics.includes('pvt_reaction_time')) {
        setSelectedDomain('cognitive');
      } else if (topAlert.triggerMetrics.includes('hr_resting') || topAlert.triggerMetrics.includes('bp_systolic')) {
        setSelectedDomain('cardiovascular');
      } else if (topAlert.triggerMetrics.includes('core_temp_circadian')) {
        setSelectedDomain('immune');
      }
    }
  }, [activeAlerts]);

  // Determine overall astronaut health state
  const criticalCount = metrics.filter((m) => m.status === 'critical').length;
  const warningCount = metrics.filter((m) => m.status === 'warning').length;
  const advisoryCount = metrics.filter((m) => m.status === 'advisory').length;

  const overallStatus: SeverityLevel =
    criticalCount > 0
      ? 'critical'
      : warningCount > 0
      ? 'warning'
      : advisoryCount > 0
      ? 'advisory'
      : 'nominal';

  // Count nominal domains out of 6
  const nominalDomainCount = useMemo(() => {
    return (Object.keys(domainConfigs) as DomainId[]).filter((domId) => {
      const cfg = domainConfigs[domId];
      const pMet = getMetric(cfg.primaryMetricId);
      const sMets = cfg.secondaryMetricIds.map((id) => getMetric(id)).filter(Boolean) as MetricReading[];
      const allMets = [pMet, ...sMets].filter(Boolean) as MetricReading[];
      return !allMets.some((m) => m.status === 'critical' || m.status === 'warning');
    }).length;
  }, [metrics]);

  // Check if a domain has active alert triggers
  const isDomainTriggered = (domId: DomainId) => {
    if (activeAlerts.length === 0) return false;
    const alert = activeAlerts[0];
    const cfg = domainConfigs[domId];
    const metricIds = [cfg.primaryMetricId, ...cfg.secondaryMetricIds];
    return alert.triggerMetrics.some((id) => metricIds.includes(id));
  };

  // Selected featured metric for the graph
  const selectedConfig = domainConfigs[selectedDomain];
  const featuredMetric = getMetric(selectedConfig.primaryMetricId) || hrMetric!;

  // Generate featured time series
  const featuredSeries = useMemo(() => {
    const mult =
      featuredMetric.currentValue !== null && featuredMetric.baseline.mean > 0
        ? featuredMetric.currentValue / featuredMetric.baseline.mean
        : 1.0;
    return generateTimeSeriesData(featuredMetric.id, timeframe, mult);
  }, [featuredMetric.id, featuredMetric.currentValue, timeframe]);

  // Featured chart bounds and stats
  const validVals = featuredSeries.map((p) => p.value).filter((v): v is number => v !== null);
  const minVal = validVals.length > 0 ? Math.min(...validVals) : 0;
  const maxVal = validVals.length > 0 ? Math.max(...validVals) : 0;

  const chartMin = Math.min(minVal, featuredMetric.baseline.acceptableMin) * 0.94;
  const chartMax = Math.max(maxVal, featuredMetric.baseline.acceptableMax) * 1.06;
  const range = chartMax - chartMin || 1;

  const svgWidth = 720;
  const svgHeight = 145;
  const padX = 36;
  const padY = 14;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padY * 2;

  const getY = (v: number) => {
    const norm = (v - chartMin) / range;
    return svgHeight - padY - norm * plotH;
  };
  const getX = (idx: number, total: number) => {
    return padX + (idx / (total - 1 || 1)) * plotW;
  };

  const featuredPathD = featuredSeries
    .map((p, idx) => {
      if (p.value === null) return '';
      const x = getX(idx, featuredSeries.length);
      const y = getY(p.value);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  const baseBandYTop = getY(featuredMetric.baseline.acceptableMax);
  const baseBandYBottom = getY(featuredMetric.baseline.acceptableMin);
  const baselineBandD = `
    M ${padX} ${baseBandYTop.toFixed(1)}
    L ${svgWidth - padX} ${baseBandYTop.toFixed(1)}
    L ${svgWidth - padX} ${baseBandYBottom.toFixed(1)}
    L ${padX} ${baseBandYBottom.toFixed(1)}
    Z
  `;
  const meanY = getY(featuredMetric.baseline.mean);

  // Active inspected point resolution (pinned has priority over hover, fallback to latest)
  const activeIndex =
    pinnedPointIndex !== null
      ? pinnedPointIndex
      : hoveredPointIndex !== null
      ? hoveredPointIndex
      : featuredSeries.length - 1;

  const activePoint = featuredSeries[activeIndex];
  const isPinned = pinnedPointIndex !== null;

  // Timeline events contextual to domain and mission scenario
  interface TimelineEvent {
    index: number;
    time: string;
    label: string;
    detail: string;
    severity: 'critical' | 'warning' | 'nominal';
  }

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (timeframe !== '24h') return [];
    const len = featuredSeries.length;
    const evts: TimelineEvent[] = [];

    if (selectedDomain === 'cognitive') {
      if (activeAlerts.some((a) => a.id.includes('co2'))) {
        evts.push({
          index: Math.min(13, len - 1),
          time: '12:30 MET',
          label: 'ECLSS Bed A Saturated',
          detail: 'Ambient pCO2 exceeded 2.8 mmHg threshold',
          severity: 'warning',
        });
        evts.push({
          index: Math.min(19, len - 1),
          time: '18:15 MET',
          label: 'PVT Lapses Detected (3x)',
          detail: 'Mean RT delayed to 325 ms',
          severity: 'critical',
        });
      } else {
        evts.push({
          index: Math.min(14, len - 1),
          time: '13:00 MET',
          label: 'PVT Session (Nominal)',
          detail: 'Mean RT 220 ms, 0 lapses',
          severity: 'nominal',
        });
      }
    } else if (selectedDomain === 'radiation') {
      if (activeAlerts.some((a) => a.id.includes('spe'))) {
        evts.push({
          index: Math.min(14, len - 1),
          time: '13:30 MET',
          label: 'SPE Ingress (>100 MeV)',
          detail: 'RAM-07 flux rose to 188.5 μSv/h',
          severity: 'critical',
        });
        evts.push({
          index: Math.min(20, len - 1),
          time: '19:00 MET',
          label: 'Shelter Protocol Active',
          detail: 'Water-wall deployment attenuation',
          severity: 'warning',
        });
      } else {
        evts.push({
          index: Math.min(16, len - 1),
          time: '15:00 MET',
          label: 'GCR Background Routine Check',
          detail: 'Flux steady at 27.2 μSv/h',
          severity: 'nominal',
        });
      }
    } else if (selectedDomain === 'cardiovascular') {
      if (activeAlerts.some((a) => a.id.includes('cv'))) {
        evts.push({
          index: Math.min(15, len - 1),
          time: '14:00 MET',
          label: 'Compensatory HR Shift',
          detail: 'Resting pulse elevated to 78 bpm',
          severity: 'warning',
        });
      } else {
        evts.push({
          index: Math.min(8, len - 1),
          time: '07:30 MET',
          label: 'Circadian Waking Zenith',
          detail: 'Vagal parasympathetic tone intact',
          severity: 'nominal',
        });
        evts.push({
          index: Math.min(17, len - 1),
          time: '16:00 MET',
          label: 'ARED Resistance Cycle',
          detail: 'Completed 45 min lower-body load',
          severity: 'nominal',
        });
      }
    } else if (selectedDomain === 'sleep') {
      evts.push({
        index: Math.min(7, len - 1),
        time: '06:00 MET',
        label: 'Actigraphy Sleep Record',
        detail: 'Nocturnal duration computed',
        severity: sleepMetric?.currentValue && sleepMetric.currentValue < 6.0 ? 'warning' : 'nominal',
      });
    } else if (selectedDomain === 'musculoskeletal') {
      evts.push({
        index: Math.min(15, len - 1),
        time: '14:30 MET',
        label: 'Dynamometer Torque Trial',
        detail: 'Soleus peak measured at 182 N·m',
        severity: 'nominal',
      });
    } else if (selectedDomain === 'immune') {
      evts.push({
        index: Math.min(9, len - 1),
        time: '08:30 MET',
        label: 'Circadian Zenith Core Temp',
        detail: 'Continuous heat flux 37.1°C',
        severity: tempMetric?.currentValue && tempMetric.currentValue > 38.0 ? 'critical' : 'nominal',
      });
    }

    return evts;
  }, [timeframe, selectedDomain, activeAlerts, featuredSeries.length, sleepMetric?.currentValue, tempMetric?.currentValue]);

  // Clinical telemetry interpretation banner
  const getClinicalInterpretation = (): string => {
    switch (selectedDomain) {
      case 'cardiovascular':
        if (hrMetric?.currentValue === null) {
          return 'Telemetry Discontinuity: Electrocardiogram lead displacement or disconnection detected. Sensor repositioning protocol required.';
        }
        if (hrMetric?.currentValue && hrMetric.currentValue >= 75) {
          return 'Compensatory Tachycardia (+18 bpm elevation): Elevated resting pulse indicates orthostatic compensation to microgravity cephalad plasma volume contraction.';
        }
        return 'Resting pulse stable within personal baseline limits (48–76 bpm). Intact nocturnal dip and vagal parasympathetic recovery tone observed.';

      case 'sleep':
        if (sleepMetric?.currentValue && sleepMetric.currentValue < 6.0) {
          return 'Acute Sleep Fragmentation: Nocturnal duration curtailed to 5.2h with frequent autonomic micro-arousals. Correlated with elevated ambient CO2.';
        }
        return 'Sleep duration stable over 7-day cruise baseline (7.3h mean). Sleep latency and slow-wave restorative architecture within nominal limits.';

      case 'cognitive':
        if (pvtMetric?.currentValue && pvtMetric.currentValue >= 300) {
          return 'Psychomotor Vigilance Delayed (+105 ms shift): Mean reaction latency shifted to 325 ms with 3 attentional lapses (>500 ms). Operational high-risk state.';
        }
        return 'Psychomotor vigilance speed nominal (mean 228 ms). Zero attentional lapses detected across last 3 test sessions. Cognitive readiness preserved.';

      case 'musculoskeletal':
        return 'Measured isometric soleus torque at 182 N·m (87% pre-flight baseline). ARED resistance countermeasure adherence at 98% target compliance. Next DXA scan: Sol 190.';

      case 'immune':
        if (tempMetric?.currentValue && tempMetric.currentValue >= 38.0) {
          return 'Febrile Elevation (38.2°C): Circadian temperature shifted with elevated leukocyte count, indicating acute immune response or latent viral reactivation.';
        }
        return 'Core body temperature entrained with normal 24-hour circadian heat-flux amplitude (36.8°C–37.3°C). Routine daily symptom screening negative.';

      case 'radiation':
        if (radRateMetric?.currentValue && radRateMetric.currentValue >= 50) {
          return 'Solar Particle Event (SPE) Proton Flux Spike: Measured dose rate at 184 μSv/h exceeding 50 μSv/h action limit. Immediate storm shelter entry required.';
        }
        return 'Galactic Cosmic Ray (GCR) background flux stable at 27.2 μSv/h. Safe cumulative career radiation envelope (118.6 mSv) maintained.';

      default:
        return 'All telemetry signals operating within calibrated aerospace baselines.';
    }
  };

  // Status badges
  const renderStatusBadge = (status: SeverityLevel) => {
    switch (status) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] animate-pulse" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#D95A11]/15 text-[#B84807] border border-[#D95A11]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D95A11]" />
            Attention
          </span>
        );
      case 'advisory':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F4F6] text-[#5A6068] border border-[#E2E5E9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5A6068]" />
            Advisory
          </span>
        );
      case 'nominal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#2E7D32]/12 text-[#2E7D32] border border-[#2E7D32]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
            Stable
          </span>
        );
    }
  };

  // 1. Cardiovascular Sparkline & Personal Reference Range
  const renderCardioGlyph = (met: MetricReading | undefined, status: SeverityLevel) => {
    if (!met || met.currentValue === null) {
      return (
        <div className="flex flex-col items-end gap-1 w-[90px]">
          <div className="h-[24px] w-full flex items-center justify-center border border-dashed border-[#C62828]/50 rounded bg-[#FEF2F2]">
            <span className="text-[10px] font-bold text-[#C62828] font-mono">SIGNAL LOST</span>
          </div>
          <span className="text-[10px] text-[#C62828] font-mono font-semibold">ECG Lead Disconnected</span>
        </div>
      );
    }
    const mult = met.currentValue / (met.baseline.mean || 1);
    const pts = generateTimeSeriesData(met.id, '24h', mult);
    const vals = pts.map((p) => p.value).filter((v): v is number => v !== null);
    const min = Math.min(...vals, met.baseline.acceptableMin) * 0.98;
    const max = Math.max(...vals, met.baseline.acceptableMax) * 1.02;
    const rng = max - min || 1;
    const w = 84;
    const h = 26;

    const pathD = pts
      .map((p, i) => {
        if (p.value === null) return '';
        const x = (i / (pts.length - 1)) * w;
        const y = h - ((p.value - min) / rng) * h;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .filter(Boolean)
      .join(' ');

    const strokeColor =
      status === 'critical' ? '#C62828' : status === 'warning' ? '#D95A11' : '#2E7D32';

    return (
      <div className="flex flex-col items-end gap-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-[84px] h-[24px] overflow-visible">
          {/* Shaded personal reference band */}
          <rect
            x="0"
            y={h * 0.2}
            width={w}
            height={h * 0.6}
            fill="#2E7D32"
            fillOpacity="0.08"
            rx="2"
          />
          <line
            x1="0"
            y1={h / 2}
            x2={w}
            y2={h / 2}
            stroke="#2E7D32"
            strokeDasharray="2 2"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">Ref:</span>
          <span className="font-semibold text-[#1E2227]">{met.baseline.acceptableMin}–{met.baseline.acceptableMax}</span>
        </div>
      </div>
    );
  };

  // 2. Sleep 7-day mini bar chart relative to 8.0h baseline
  const renderSleepGlyph = () => {
    const dailySleep = [7.2, 7.8, 6.9, 7.4, 7.5, 6.8, sleepMetric?.currentValue ?? 7.3];
    const maxBarH = 24;

    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-end gap-1.5 h-[26px] px-1 relative">
          {/* 8h Target Dashed Line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-[#8C939E]/60 pointer-events-none z-10"
            style={{ bottom: `${(8.0 / 9.0) * maxBarH}px` }}
            title="8.0h baseline target"
          />
          {dailySleep.map((hrs, idx) => {
            const hRatio = Math.min(1, Math.max(0.2, hrs / 9.0));
            const barH = Math.round(hRatio * maxBarH);
            const isLatest = idx === dailySleep.length - 1;
            const isLow = hrs < 6.5;

            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  style={{ height: `${barH}px` }}
                  className={`w-2 rounded-t-xs transition-all ${
                    isLatest
                      ? isLow
                        ? 'bg-[#C62828]'
                        : 'bg-[#D95A11]'
                      : isLow
                      ? 'bg-[#C62828]/50'
                      : 'bg-[#CBD5E1]'
                  }`}
                  title={`Day ${idx - 6}: ${hrs}h`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">Target:</span>
          <span className="font-semibold text-[#1E2227]">8.0h</span>
        </div>
      </div>
    );
  };

  // 3. Cognitive Reaction Time Mini Trend with latest performance highlighted
  const renderCognitiveGlyph = () => {
    const rt = pvtMetric?.currentValue ?? 228;
    const lapses = lapseMetric?.currentValue ?? 0;
    const sessions = [218, 224, 219, 225, rt];
    const w = 80;
    const h = 24;
    const minS = 180;
    const maxS = 340;
    const rng = maxS - minS;

    const pathD = sessions
      .map((s, idx) => {
        const x = (idx / (sessions.length - 1)) * w;
        const y = h - ((s - minS) / rng) * h;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const isDegraded = rt > 270 || lapses > 0;

    return (
      <div className="flex flex-col items-end gap-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-[80px] h-[22px] overflow-visible">
          {/* Baseline reference line at 220ms */}
          <line
            x1="0"
            y1={h - ((220 - minS) / rng) * h}
            x2={w}
            y2={h - ((220 - minS) / rng) * h}
            stroke="#CBD5E1"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <path
            d={pathD}
            fill="none"
            stroke={isDegraded ? '#D95A11' : '#2E7D32'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {sessions.map((s, idx) => {
            const x = (idx / (sessions.length - 1)) * w;
            const y = h - ((s - minS) / rng) * h;
            const isLast = idx === sessions.length - 1;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={isLast ? 4 : 2}
                fill={isLast ? (isDegraded ? '#D95A11' : '#2E7D32') : '#FFFFFF'}
                stroke={isDegraded ? '#D95A11' : '#2E7D32'}
                strokeWidth={isLast ? 2 : 1.5}
              />
            );
          })}
        </svg>
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className="text-[#8C939E]">Lapses:</span>
          <span className={`font-bold px-1.5 py-0.2 rounded ${lapses > 0 ? 'bg-[#C62828]/15 text-[#C62828]' : 'text-[#1E2227]'}`}>
            {lapses}
          </span>
        </div>
      </div>
    );
  };

  // 4. Musculoskeletal Measured Torque & DXA Scan Schedule
  const renderMusculoGlyph = () => {
    const torque = torqueMetric?.currentValue ?? 182;
    const target = torqueMetric?.baseline.mean ?? 210;
    const pct = Math.min(120, Math.round((torque / target) * 100));
    const isDegraded = pct < 85;

    return (
      <div className="w-[104px] space-y-1">
        <div className="flex justify-between items-center text-[11px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">ARED Load</span>
          <span className="font-bold text-[#1E2227]">98%</span>
        </div>
        <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden relative">
          <div
            style={{ width: `98%` }}
            className={`h-full rounded-full transition-all ${isDegraded ? 'bg-[#D95A11]' : 'bg-[#2E7D32]'}`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">DXA Scan:</span>
          <span className="font-semibold text-[#1E2227]">Sol 190</span>
        </div>
      </div>
    );
  };

  // 5. Immune & Thermal (Circadian Heat-Flux Wave & Symptom Screening)
  const renderImmuneGlyph = () => {
    const temp = tempMetric?.currentValue ?? 37.1;
    const usg = usgMetric?.currentValue ?? 1.018;
    const isNormalTemp = temp >= 36.6 && temp <= 37.5;
    const w = 84;
    const h = 24;

    // Circadian sinusoid wave (24-hour heat wave model)
    const points: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      const normY = 0.5 + 0.35 * Math.sin((i / 10) * Math.PI * 2 - Math.PI / 2);
      points.push([x, normY * h]);
    }
    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

    return (
      <div className="flex flex-col items-end gap-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-[84px] h-[22px] overflow-visible">
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#E2E5E9" strokeDasharray="2 2" strokeWidth="1" />
          <path d={pathD} fill="none" stroke={isNormalTemp ? '#2E7D32' : '#D95A11'} strokeWidth="2" strokeLinecap="round" />
          {/* Current circadian phase marker */}
          <circle cx={w * 0.65} cy={h * 0.25} r="3" fill={isNormalTemp ? '#2E7D32' : '#D95A11'} stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">USG:</span>
          <span className="font-semibold text-[#1E2227]">{usg.toFixed(3)}</span>
          <span className={`text-[10px] font-bold px-1 rounded ${isNormalTemp ? 'bg-[#2E7D32]/12 text-[#2E7D32]' : 'bg-[#D95A11]/15 text-[#D95A11]'}`}>
            {isNormalTemp ? 'Entrained' : 'Shifted'}
          </span>
        </div>
      </div>
    );
  };

  // 6. Radiation Rate Meter & Cumulative Career Dose
  const renderRadiationGlyph = () => {
    const rate = radRateMetric?.currentValue ?? 27.2;
    const isStorm = rate > 50;
    const pct = Math.min(100, Math.round((rate / 100) * 100));
    const cumDose = cumRadMetric?.currentValue ?? 118.6;

    return (
      <div className="w-[104px] space-y-1">
        <div className="flex justify-between items-center text-[11px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">Limit</span>
          <span className={`font-bold whitespace-nowrap ${isStorm ? 'text-[#C62828]' : 'text-[#2E7D32]'}`}>
            {isStorm ? 'SPE STORM' : '<50 μSv/h'}
          </span>
        </div>
        <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden relative">
          <div
            style={{ width: `${pct}%` }}
            className={`h-full rounded-full transition-all ${isStorm ? 'bg-[#C62828] animate-pulse' : 'bg-[#2E7D32]'}`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-[#5A6068]">
          <span className="text-[#8C939E]">Career:</span>
          <span className="font-bold text-[#1E2227] whitespace-nowrap">{cumDose.toFixed(1)} mSv</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2 font-sans">
      {/* ========================================================
          1. PROMINENT OPERATIONAL HEALTH STATUS STRIP
          ======================================================== */}
      <section
        aria-label="Current Mission Health Summary"
        className="bg-[#FFFFFF] border border-[#E2E5E9] rounded-xl px-4 py-2 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0"
      >
        {/* Left: Overall Health State with Large Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase font-mono shadow-xs ${
              overallStatus === 'nominal'
                ? 'bg-[#2E7D32] text-white'
                : overallStatus === 'warning'
                ? 'bg-[#D95A11] text-white'
                : 'bg-[#C62828] text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>{overallStatus === 'nominal' ? 'NOMINAL' : overallStatus === 'warning' ? 'ATTENTION' : 'CRITICAL'}</span>
          </div>

          <div>
            <div className="text-sm sm:text-[15px] font-bold text-[#1E2227] leading-tight flex items-center gap-2.5">
              <span>
                {overallStatus === 'nominal'
                  ? 'All 6 monitored physiological domains within baseline limits'
                  : overallStatus === 'warning'
                  ? 'Physiological compensation strain detected — Clinical review advised'
                  : 'Critical life-support or radiation excursion — Protocol active'}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F4F5F7] text-[#5A6068] border border-[#E2E5E9]">
                {nominalDomainCount}/6 Domains Nominal
              </span>
            </div>
          </div>
        </div>

        {/* Center: Contextual Summary */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-[#5A6068] border-l border-[#E2E5E9] pl-4 max-w-sm">
          <span className="truncate">
            {overallStatus === 'nominal'
              ? 'Continuous telemetry verifies nominal vitals and stable life support loop.'
              : activeAlerts[0]?.title || 'Active telemetry deviation. Review clinical protocol.'}
          </span>
        </div>

        {/* Right: Operational Counts & Touch-Friendly Action CTA */}
        <div className="flex items-center gap-2.5">
          {/* Active Alerts Pill */}
          <div className="flex items-center gap-1.5 bg-[#F4F5F7] border border-[#E2E5E9] rounded-lg px-2.5 py-1 text-xs">
            <span className="text-xs text-[#5A6068] font-semibold">Alerts:</span>
            <span className={`font-mono font-bold text-sm ${activeAlerts.length > 0 ? 'text-[#C62828]' : 'text-[#2E7D32]'}`}>
              {activeAlerts.length}
            </span>
          </div>

          {/* Next Required Action */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#F4F5F7] border border-[#E2E5E9] rounded-lg px-2.5 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#5A6068]" />
            <span className="text-xs text-[#5A6068] font-semibold">Next:</span>
            <span className="font-semibold text-xs text-[#1E2227] max-w-[140px] truncate">
              {activeAlerts.length > 0 ? 'Protocol Triage' : 'PVT Test (21:00 MET)'}
            </span>
          </div>

          {/* Direct Dashboard CTA Button */}
          {activeAlerts.length > 0 ? (
            <button
              onClick={() => onOpenProtocol(activeAlerts[0].id)}
              className="bg-[#D95A11] hover:bg-[#B84807] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Open Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenAssessments}
              className="bg-[#1E2227] hover:bg-[#2F363F] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Launch PVT Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* ========================================================
          2. TWO-COLUMN MAIN DASHBOARD (Strict 1440×900 Fit)
          Left (~66% / 8 cols): 6 Domains Grid + Selected Trend Chart
          Right (~34% / 4 cols): Decision Support & Cabin Habitat
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* ==========================================
            LEFT COLUMN (Col span 8):
            6 Tailored Domains + Featured Chart
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          {/* 6 DOMAIN WIDGETS (Responsive Grid, Clean & Scaled Up) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 min-[1380px]:grid-cols-3 gap-2.5">
            {(Object.keys(domainConfigs) as DomainId[]).map((domId) => {
              const config = domainConfigs[domId];
              const isSelected = selectedDomain === domId;
              const isTriggered = isDomainTriggered(domId);
              const primaryMet = getMetric(config.primaryMetricId);
              const secMets = config.secondaryMetricIds
                .map((id) => getMetric(id))
                .filter(Boolean) as MetricReading[];

              // Calculate domain status
              const allDomMets = [primaryMet, ...secMets].filter(Boolean) as MetricReading[];
              const severities = allDomMets.map((m) => m.status);
              const domStatus: SeverityLevel = severities.includes('critical')
                ? 'critical'
                : severities.includes('warning')
                ? 'warning'
                : severities.includes('advisory')
                ? 'advisory'
                : 'nominal';

              const Icon = config.icon;

              // Calculate delta vs baseline mean
              const delta =
                primaryMet?.currentValue !== null && primaryMet?.baseline.mean !== undefined
                  ? (primaryMet.currentValue - primaryMet.baseline.mean).toFixed(1)
                  : null;

              return (
                <div
                  key={domId}
                  onClick={() => setSelectedDomain(domId)}
                  className={`bg-[#FFFFFF] border rounded-xl p-2.5 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isTriggered
                      ? 'border-[#D95A11] shadow-md ring-2 ring-[#D95A11] bg-[#FFFBF8]'
                      : isSelected
                      ? 'border-[#1E2227] shadow-xs ring-2 ring-[#1E2227] bg-[#FFFFFF]'
                      : 'border-[#E2E5E9] hover:border-[#D1D5DB] hover:bg-[#F8F9FA]'
                  }`}
                >
                  {/* Top Line: Domain Icon with subtle tint + Domain Title (15-16px) + Status Badge + Expand */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${config.accentColor}15`,
                          color: config.accentColor,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[15px] font-bold text-[#1E2227] truncate tracking-tight">
                        {config.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderStatusBadge(domStatus)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDomain(domId);
                        }}
                        className="p-1 rounded text-[#8C939E] hover:text-[#1E2227] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        title="Expand detailed telemetry breakdown"
                        aria-label={`Expand ${config.title}`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Line: Dominant Dashboard Reading (32px) & Tailored Domain Visual */}
                  <div className="my-1.5 flex items-end justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6068] block mb-0.5">
                        {config.primaryLabel}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[30px] sm:text-[32px] font-bold font-mono text-[#1E2227] leading-none tracking-tight">
                          {primaryMet?.currentValue !== null && primaryMet?.currentValue !== undefined
                            ? primaryMet.currentValue
                            : '--'}
                        </span>
                        <span className="text-sm font-semibold font-mono text-[#5A6068] ml-1">
                          {primaryMet?.unit}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#5A6068] mt-1">
                        {delta !== null ? (
                          <span>
                            vs base:{' '}
                            <strong className={`font-semibold ${Number(delta) > 0 ? 'text-[#D95A11]' : 'text-[#1E2227]'}`}>
                              {Number(delta) > 0 ? `+${delta}` : delta}
                            </strong>
                          </span>
                        ) : (
                          <span className="text-[#C62828] font-bold">Signal Gap</span>
                        )}
                      </div>
                    </div>

                    {/* Domain-Specific Miniature Visualisation */}
                    <div className="shrink-0">
                      {domId === 'cardiovascular' && renderCardioGlyph(primaryMet, domStatus)}
                      {domId === 'sleep' && renderSleepGlyph()}
                      {domId === 'cognitive' && renderCognitiveGlyph()}
                      {domId === 'musculoskeletal' && renderMusculoGlyph()}
                      {domId === 'immune' && renderImmuneGlyph()}
                      {domId === 'radiation' && renderRadiationGlyph()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SELECTED DETAIL TREND PANEL WITH CLINICAL INTERPRETATION */}
          <div className="bg-[#FFFFFF] border border-[#E2E5E9] rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
            {/* Chart Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedConfig.accentColor }}
                />
                <h3 className="text-sm font-bold text-[#1E2227]">
                  {selectedConfig.title} — {featuredMetric.name} ({featuredMetric.unit})
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[#F4F5F7] text-[#5A6068] border border-[#E2E5E9]">
                  Personal Baseline: {featuredMetric.baseline.acceptableMin} – {featuredMetric.baseline.acceptableMax} {featuredMetric.unit}
                </span>
              </div>

              {/* Timeframe selector (Segmented control) */}
              <div className="flex items-center gap-1 bg-[#F4F5F7] p-0.5 rounded-lg border border-[#E2E5E9] text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#5A6068] ml-1 mr-0.5" />
                {(['24h', '7d', '30d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      timeframe === tf
                        ? 'bg-[#FFFFFF] text-[#1E2227] shadow-xs'
                        : 'text-[#5A6068] hover:text-[#1E2227]'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Chart Canvas */}
            <div className="relative w-full bg-[#FFFFFF] rounded-lg p-0.5 select-none my-0.5">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible cursor-crosshair"
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                {/* Horizontal Grid lines */}
                {[0, 0.33, 0.66, 1].map((ratio) => {
                  const y = padY + ratio * plotH;
                  const val = chartMax - ratio * range;
                  return (
                    <g key={ratio}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={svgWidth - padX}
                        y2={y}
                        stroke="#F0F2F5"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={padX - 6}
                        y={y + 3.5}
                        fill="#8C939E"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Personal Baseline Acceptable Band */}
                <path
                  d={baselineBandD}
                  fill="#2E7D32"
                  fillOpacity="0.08"
                  stroke="#2E7D32"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Mean Baseline Dashed Line */}
                <line
                  x1={padX}
                  y1={meanY}
                  x2={svgWidth - padX}
                  y2={meanY}
                  stroke="#2E7D32"
                  strokeWidth="1.4"
                  strokeDasharray="4 4"
                />

                {/* Event Markers (Vertical Dashed Lines & Clickable Event Tags) */}
                {timelineEvents.map((evt, eIdx) => {
                  const evX = getX(evt.index, featuredSeries.length);
                  const isCritical = evt.severity === 'critical';
                  const isWarning = evt.severity === 'warning';
                  const markerColor = isCritical ? '#C62828' : isWarning ? '#D95A11' : '#2E7D32';
                  const tagWidth = 84;
                  const tagX = Math.max(padX, Math.min(svgWidth - padX - tagWidth, evX - tagWidth / 2));

                  return (
                    <g
                      key={`evt-${eIdx}`}
                      className="cursor-pointer"
                      onClick={() => setPinnedPointIndex(pinnedPointIndex === evt.index ? null : evt.index)}
                    >
                      {/* Vertical line through chart */}
                      <line
                        x1={evX}
                        y1={padY + 14}
                        x2={evX}
                        y2={svgHeight - padY}
                        stroke={markerColor}
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                        strokeOpacity="0.75"
                      />
                      {/* Event badge at top */}
                      <rect
                        x={tagX}
                        y={2}
                        width={tagWidth}
                        height={16}
                        rx={3}
                        fill={isCritical ? '#FEF2F2' : isWarning ? '#FFF7ED' : '#F0FDF4'}
                        stroke={markerColor}
                        strokeWidth="1"
                      />
                      <text
                        x={tagX + tagWidth / 2}
                        y={13.5}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill={markerColor}
                      >
                        ⚡ {evt.time.split(' ')[0]} {evt.label.slice(0, 8)}
                      </text>
                    </g>
                  );
                })}

                {/* Telemetry Trajectory Line */}
                <path
                  d={featuredPathD}
                  fill="none"
                  stroke="#D95A11"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {featuredSeries.map((p, idx) => {
                  if (p.value === null) return null;
                  const cx = getX(idx, featuredSeries.length);
                  const cy = getY(p.value);
                  const isHovered = hoveredPointIndex === idx;
                  const isThisPinned = pinnedPointIndex === idx;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onClick={() => setPinnedPointIndex(pinnedPointIndex === idx ? null : idx)}
                    >
                      {/* Pinned Outer Pulsing Ring */}
                      {isThisPinned && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8.5}
                          fill="none"
                          stroke="#D95A11"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isThisPinned ? 6 : isHovered ? 5.5 : 3}
                        fill={isThisPinned || isHovered ? '#D95A11' : '#FFFFFF'}
                        stroke="#D95A11"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}

                {/* Crosshair on active point */}
                {(hoveredPointIndex !== null || pinnedPointIndex !== null) && (
                  <line
                    x1={getX(activeIndex, featuredSeries.length)}
                    y1={padY + 14}
                    x2={getX(activeIndex, featuredSeries.length)}
                    y2={svgHeight - padY}
                    stroke="#D95A11"
                    strokeWidth="1.4"
                    strokeDasharray="2 2"
                  />
                )}
              </svg>
            </div>

            {/* Concise Clinical Telemetry Interpretation Strip */}
            <div className="bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-[#1E2227] shrink-0 font-mono text-[11px] uppercase tracking-wider">
                  Interpretation:
                </span>
                <span className="text-[#475569] leading-snug truncate">
                  {getClinicalInterpretation()}
                </span>
              </div>
              <button
                onClick={() => setShowRationaleModal(true)}
                className="shrink-0 text-[11px] font-bold text-[#D95A11] hover:text-[#B84807] flex items-center gap-1 cursor-pointer"
                title="View physiological basis, Z-score formulas, and NASA standards"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rationale & Criteria →</span>
              </button>
            </div>

            {/* Pinned / Hovered Telemetry Inspector & Deep Link */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-[#F3F4F6] text-xs">
              <div
                className={`rounded-lg px-2.5 py-1 border transition-colors ${
                  isPinned
                    ? 'bg-[#FFF8F3] border-[#D95A11]/40 ring-1 ring-[#D95A11]/30'
                    : 'bg-[#F8F9FA] border-[#E2E5E9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#8C939E] block text-[10px] font-medium font-mono uppercase">
                    {isPinned ? '📌 PINNED READING' : 'INSPECTED VALUE'}
                  </span>
                  {isPinned && (
                    <button
                      onClick={() => setPinnedPointIndex(null)}
                      className="text-[10px] font-bold text-[#D95A11] hover:underline cursor-pointer"
                    >
                      Live →
                    </button>
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-[#1E2227] block truncate">
                  {activePoint?.value ?? '--'} {featuredMetric.unit}{' '}
                  <span className="text-[10px] text-[#5A6068] font-normal">
                    ({activePoint?.displayTime})
                  </span>
                </span>
              </div>

              <div className="bg-[#F8F9FA] rounded-lg px-2.5 py-1 border border-[#E2E5E9]">
                <span className="text-[#8C939E] block text-[10px] font-medium font-mono uppercase">
                  Variance & Z-Score
                </span>
                <span className="font-mono text-xs font-bold text-[#1E2227] block truncate">
                  {activePoint?.value !== null && featuredMetric.baseline.mean !== undefined
                    ? `${(activePoint.value - featuredMetric.baseline.mean) > 0 ? '+' : ''}${(activePoint.value - featuredMetric.baseline.mean).toFixed(1)} ${featuredMetric.unit} (${calculateZScore(activePoint.value, featuredMetric.baseline.mean, featuredMetric.baseline.stdDev) ?? '0'}σ)`
                    : '--'}
                </span>
              </div>

              <div className="bg-[#F8F9FA] rounded-lg px-2.5 py-1 border border-[#E2E5E9]">
                <span className="text-[#8C939E] block text-[10px] font-medium font-mono uppercase">
                  Telemetry Mode
                </span>
                <span className="text-xs font-semibold text-[#1E2227] truncate block">
                  {selectedConfig.primaryLabel.includes('CONTINUOUS')
                    ? 'Continuous Stream'
                    : selectedConfig.primaryLabel.includes('PVT')
                    ? 'Periodic Trial'
                    : selectedConfig.primaryLabel.includes('DIRECT')
                    ? 'Direct Isokinetic Test'
                    : selectedConfig.primaryLabel.includes('ACTIVE')
                    ? 'Active Microdosimeter'
                    : 'Periodic Actigraphy'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowRationaleModal(true)}
                  className="flex-1 bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#1E2227] border border-[#E2E5E9] font-bold text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs truncate"
                  title="View clinical rationale, Z-score formulas, and NASA standards"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#D95A11] shrink-0" />
                  <span className="truncate">Rationale</span>
                </button>
                <button
                  onClick={() => onSelectMetricForDeepView(featuredMetric.id)}
                  className="bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#1E2227] border border-[#E2E5E9] font-bold text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs shrink-0"
                  title="Open Deep Telemetry View"
                >
                  <span>Deep</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D95A11]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            RIGHT COLUMN (Col span 4):
            1) Operational Decision Support & Actions
            2) Cabin ECLSS & Sensor Telemetry Integrity
            ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          {/* 1. OPERATIONAL DECISION SUPPORT CARD */}
          <div className="bg-[#FFFFFF] border border-[#E2E5E9] rounded-xl p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`w-4 h-4 ${activeAlerts.length > 0 ? 'text-[#D95A11]' : 'text-[#2E7D32]'}`} />
                <h3 className="text-xs sm:text-[13px] font-bold text-[#1E2227] uppercase tracking-wider">
                  Operational Decision Support
                </h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${activeAlerts.length > 0 ? 'bg-[#D95A11]/15 text-[#B84807]' : 'bg-[#2E7D32]/12 text-[#2E7D32]'}`}>
                {activeAlerts.length > 0 ? `${activeAlerts.length} Action Required` : 'Routine Monitoring'}
              </span>
            </div>

            {activeAlerts.length > 0 ? (
              <div className="mt-2 space-y-2">
                {/* Active Concern Alert Banner */}
                <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#B84807] uppercase tracking-wider font-mono flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#B84807]" />
                      Priority 1: {activeAlerts[0].severity.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[#8C939E] font-mono">
                      MET +184 08:30
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1E2227] leading-snug">
                    {activeAlerts[0].title}
                  </h4>
                  <p className="text-xs text-[#5A6068] leading-relaxed">
                    {activeAlerts[0].physiologicalExplanation}
                  </p>

                  {/* Contributing Measurements List */}
                  {activeAlerts[0].contributingFactors && activeAlerts[0].contributingFactors.length > 0 && (
                    <div className="pt-1.5 border-t border-[#E2E5E9] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6068] block">
                        Contributing Observations:
                      </span>
                      <ul className="text-[11px] text-[#1E2227] font-mono space-y-0.5">
                        {activeAlerts[0].contributingFactors.slice(0, 3).map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-[#D95A11] font-bold">•</span>
                            <span className="truncate">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reassessment Status */}
                  {activeAlerts[0].reassessmentSchedule && (
                    <div className="text-[11px] text-[#5A6068] font-mono pt-1 border-t border-[#E2E5E9] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#5A6068]" />
                      <span>{activeAlerts[0].reassessmentSchedule}</span>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-xs font-mono font-semibold text-[#5A6068] truncate max-w-[150px]">
                    Proc: {activeAlerts[0].recommendedProcedureId?.toUpperCase() || 'STANDARD'}
                  </span>
                  <button
                    onClick={() => onOpenProtocol(activeAlerts[0].id)}
                    className="bg-[#D95A11] hover:bg-[#B84807] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <span>Execute Checklist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {/* Nominal State: Qualified Monitoring Statement (No false clearance claims) */}
                <div className="p-2.5 rounded-lg bg-[#2E7D32]/8 border border-[#2E7D32]/20 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-xs sm:text-[13px] text-[#1E2227] block">
                      Routine Telemetry Monitoring: No Excursions Detected
                    </span>
                    <span className="text-[#5A6068] text-xs block mt-0.5 leading-relaxed">
                      Continuous telemetry verifies all monitored physiological markers and cabin life support remain within acceptable cruise baselines.
                    </span>
                  </div>
                </div>

                {/* What the astronaut needs to do: Scheduled Assessment */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] text-xs">
                  <div className="flex items-center gap-1.5 text-[#5A6068]">
                    <Clock className="w-3.5 h-3.5 text-[#D95A11]" />
                    <div>
                      <span className="font-semibold text-[#1E2227] block">PVT Cognitive Vigilance Test</span>
                      <span className="text-[10px] text-[#5A6068]">Scheduled: 21:00 MET (in 4h 32m)</span>
                    </div>
                  </div>
                  <button
                    onClick={onOpenAssessments}
                    className="bg-[#1E2227] hover:bg-[#2F363F] text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Outstanding Routine Tasks */}
                <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#5A6068]">
                      Routine Mission Tasks:
                    </span>
                    <span className="text-[10px] font-mono text-[#2E7D32] font-semibold">1/2 Completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#1E2227]">
                    <CheckSquare className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>ARED Resistance Exercise (45 min) — Completed Sol 184</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#5A6068]">
                    <Clock className="w-3.5 h-3.5 text-[#D95A11]" />
                    <span>Evening Symptom & Hydration Log — Due 21:30 MET</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. CABIN ECLSS & TELEMETRY INTEGRITY (Consolidated Operational Panel) */}
          <div className="bg-[#FFFFFF] border border-[#E2E5E9] rounded-xl p-3 shadow-xs space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-[#D95A11]" />
                <h3 className="text-xs sm:text-[13px] font-bold text-[#1E2227] uppercase tracking-wider">
                  Cabin Environment (ECLSS)
                </h3>
              </div>
              <span className="text-xs text-[#2E7D32] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                Loop Active
              </span>
            </div>

            {/* 4-Vital Environmental Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Cabin CO2 */}
              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
                <div className="flex justify-between items-center text-xs text-[#5A6068]">
                  <span className="font-semibold">Cabin CO2</span>
                  <span className="font-mono text-[#8C939E]">Max 2.8</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold font-mono ${co2Metric?.status === 'critical' ? 'text-[#C62828]' : 'text-[#1E2227]'}`}>
                    {co2Metric?.currentValue ?? '--'}
                  </span>
                  <span className="text-xs text-[#5A6068] font-mono">mmHg</span>
                </div>
                <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, ((co2Metric?.currentValue ?? 1.8) / 4.0) * 100)}%` }}
                    className={`h-full rounded-full ${co2Metric?.status === 'critical' ? 'bg-[#C62828]' : 'bg-[#2E7D32]'}`}
                  />
                </div>
              </div>

              {/* Cabin O2 */}
              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
                <div className="flex justify-between items-center text-xs text-[#5A6068]">
                  <span className="font-semibold">Cabin O2</span>
                  <span className="font-mono text-[#8C939E]">21.3 kPa</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-[#1E2227]">
                    {o2Metric?.currentValue ?? '21.3'}
                  </span>
                  <span className="text-xs text-[#5A6068] font-mono">kPa</span>
                </div>
                <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: '100%' }} className="h-full rounded-full bg-[#2E7D32]" />
                </div>
              </div>

              {/* Total Pressure */}
              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
                <div className="flex justify-between items-center text-xs text-[#5A6068]">
                  <span className="font-semibold">Total Pressure</span>
                  <span className="font-mono text-[#8C939E]">101 kPa</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-[#1E2227]">
                    {pressureMetric?.currentValue ?? '101.4'}
                  </span>
                  <span className="text-xs text-[#5A6068] font-mono">kPa</span>
                </div>
                <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: '100%' }} className="h-full rounded-full bg-[#2E7D32]" />
                </div>
              </div>

              {/* Radiation Flux */}
              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] space-y-1">
                <div className="flex justify-between items-center text-xs text-[#5A6068]">
                  <span className="font-semibold">Rad Flux</span>
                  <span className="font-mono text-[#8C939E]">&lt;50 μSv/h</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold font-mono ${radRateMetric?.status === 'critical' ? 'text-[#C62828]' : 'text-[#1E2227]'}`}>
                    {radRateMetric?.currentValue ?? '27.2'}
                  </span>
                  <span className="text-xs text-[#5A6068] font-mono">μSv/h</span>
                </div>
                <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, ((radRateMetric?.currentValue ?? 27.2) / 100) * 100)}%` }}
                    className={`h-full rounded-full ${radRateMetric?.status === 'critical' ? 'bg-[#C62828]' : 'bg-[#2E7D32]'}`}
                  />
                </div>
              </div>
            </div>

            {/* Sensor Telemetry Integrity (Stream Summary) */}
            <div className="pt-2 border-t border-[#F3F4F6] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#5A6068]" />
                  <span className="font-bold text-[#1E2227] uppercase tracking-wider text-[11px]">
                    Hardware & Telemetry Streams
                  </span>
                </div>
                {onOpenSensors && (
                  <button
                    onClick={onOpenSensors}
                    className="text-[11px] font-bold text-[#D95A11] hover:underline cursor-pointer"
                  >
                    Hardware Tab →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {/* Hexoskin */}
                <div className="p-1.5 rounded-md bg-[#F8F9FA] border border-[#E2E5E9] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${hrMetric?.currentValue !== null ? 'bg-[#2E7D32]' : 'bg-[#C62828] animate-pulse'}`} />
                    <span className="font-semibold text-[#1E2227] text-[11px] truncate">Hexoskin</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#5A6068] mt-0.5">
                    {hrMetric?.currentValue !== null ? '98% Conf' : 'Signal Gap'}
                  </span>
                </div>

                {/* Tonometry */}
                <div className="p-1.5 rounded-md bg-[#F8F9FA] border border-[#E2E5E9] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                    <span className="font-semibold text-[#1E2227] text-[11px] truncate">Tonometry</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#5A6068] mt-0.5">96% Conf</span>
                </div>

                {/* ECLSS Bus */}
                <div className="p-1.5 rounded-md bg-[#F8F9FA] border border-[#E2E5E9] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                    <span className="font-semibold text-[#1E2227] text-[11px] truncate">ECLSS Bus</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#5A6068] mt-0.5">99% Conf</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. EXPANDED DOMAIN MODAL (Progressive Disclosure)
          ======================================================== */}
      {expandedDomain && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1E2227]/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setExpandedDomain(null)}
        >
          <div
            className="bg-[#FFFFFF] border border-[#E2E5E9] rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E5E9] pb-2.5">
              <div>
                <h3 className="text-base font-bold text-[#1E2227]">
                  {domainConfigs[expandedDomain].title} Telemetry Details
                </h3>
                <p className="text-xs text-[#5A6068] mt-0.5">
                  {domainConfigs[expandedDomain].summary}
                </p>
              </div>

              <button
                onClick={() => setExpandedDomain(null)}
                className="p-1.5 rounded-lg text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metric Details List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {[
                domainConfigs[expandedDomain].primaryMetricId,
                ...domainConfigs[expandedDomain].secondaryMetricIds,
              ].map((mId) => {
                const m = getMetric(mId);
                if (!m) return null;
                const z = calculateZScore(m.currentValue, m.baseline.mean, m.baseline.stdDev);

                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-[#1E2227]">{m.name}</div>
                        <div className="text-xs text-[#5A6068]">{m.shortDescription}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-[#1E2227]">
                          {m.currentValue ?? 'DATA GAP'} {m.unit}
                        </div>
                        {renderStatusBadge(m.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[#5A6068] pt-1.5 border-t border-[#E2E5E9]">
                      <div>
                        <span>Baseline: </span>
                        <strong className="text-[#1E2227]">
                          {m.baseline.mean} {m.unit}
                        </strong>
                      </div>
                      <div>
                        <span>Range: </span>
                        <strong className="text-[#1E2227]">
                          {m.baseline.acceptableMin} - {m.baseline.acceptableMax}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span>Z-Score: </span>
                        <strong className={z && Math.abs(z) >= 2.0 ? 'text-[#D95A11]' : 'text-[#1E2227]'}>
                          {z !== null ? (z > 0 ? `+${z}σ` : `${z}σ`) : 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <div className="text-xs text-[#5A6068] pt-0.5 flex items-center justify-between">
                      <span>Source: {m.sensorSource}</span>
                      <span>Signal Confidence: {m.signalConfidence}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E5E9]">
              <span className="text-xs text-[#5A6068]">
                Autonomous local clinical evaluation engine
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectMetricForDeepView(domainConfigs[expandedDomain].primaryMetricId);
                    setExpandedDomain(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#1E2227] border border-[#E2E5E9] text-xs font-bold transition-colors cursor-pointer"
                >
                  Inspect in Deep Telemetry
                </button>
                <button
                  onClick={() => setExpandedDomain(null)}
                  className="px-4 py-2 rounded-lg bg-[#1E2227] hover:bg-[#2F363F] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          4. CLINICAL RATIONALE & NASA STANDARDS MODAL
          ======================================================== */}
      {showRationaleModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1E2227]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowRationaleModal(false)}
        >
          <div
            className="bg-[#FFFFFF] border border-[#E2E5E9] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-100 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E2E5E9] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${selectedConfig.accentColor}18`,
                    color: selectedConfig.accentColor,
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E2227]">
                    Clinical Rationale & Decision Criteria: {selectedConfig.title}
                  </h3>
                  <p className="text-xs text-[#5A6068] mt-0.5">
                    NASA-STD-3001 Human-System Standard • Baseline Z-Score Architecture
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRationaleModal(false)}
                className="p-1.5 rounded-lg text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {/* 1. Microgravity Pathophysiology */}
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E2227] uppercase tracking-wider font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#D95A11]" />
                  <span>1. Aerospace Pathophysiology & Mechanisms</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {selectedDomain === 'cardiovascular' &&
                    'Microgravity eliminates the hydrostatic fluid column, driving approximately 1.5–2.0 L of blood and interstitial fluid cephalad into the thorax and head. Central volume expansion triggers baroreceptor diuresis, reducing total plasma volume by ~15%. Decreased ventricular filling reduces stroke volume index, requiring compensatory resting tachycardia (+15–20 bpm) to maintain cardiac output.'}
                  {selectedDomain === 'sleep' &&
                    'Sleep architecture in deep space is challenged by circadian misalignment, ambient habitat acoustic noise, proprioceptive unweighting, and cephalic venous congestion. Reductions in slow-wave sleep (SWS) and rapid eye movement (REM) stages impair memory consolidation and autonomic recovery.'}
                  {selectedDomain === 'cognitive' &&
                    'Psychomotor Vigilance Testing (PVT) evaluates sustainment of prefrontal attentional networks. Under microgravity-induced cephalad venous pooling and elevated ambient pCO2 (>2.8 mmHg), intracranial venous pressure rises, causing cerebral vasodilation, cephalic tension, and delayed reaction latency (>280 ms) with attentional lapses (>500 ms).'}
                  {selectedDomain === 'musculoskeletal' &&
                    'Without gravitational ground reaction forces, postural slow-twitch oxidative muscle fibers (notably soleus and gastrocnemius) undergo rapid disuse atrophy, losing up to 10% cross-sectional area per month without countermeasure loading. Cancellous bone demineralization in weight-bearing sites requires continuous high-resistance ARED loading.'}
                  {selectedDomain === 'immune' &&
                    'Deep-space radiation exposure combined with chronic isolation and microgravity induces immune dysregulation, suppressing T-cell blastogenesis and natural killer cell cytotoxicity. Subclinical reactivation of latent herpesviruses (EBV, VZV) and upper respiratory mucosal edema present as circadian thermoregulatory shifts.'}
                  {selectedDomain === 'radiation' &&
                    'Interplanetary transit outside Earth magnetosphere involves continuous Galactic Cosmic Ray (GCR) background flux (~25–30 μSv/h) and acute episodic Solar Particle Events (SPE) delivering high-energy proton fluxes (>100 MeV). Unshielded exposures above 50 μSv/h pose acute radiation sickness and hematopoietic degradation risks.'}
                </p>
              </div>

              {/* 2. Statistical Baseline & Z-Score Analysis */}
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E2227] uppercase tracking-wider font-mono">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                    <span>2. Statistical Baseline & Z-Score Model</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#D95A11] bg-[#D95A11]/10 px-2 py-0.5 rounded">
                    Formula: Z = (X - μ) / σ
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E2E5E9]">
                    <span className="text-[#8C939E] block text-[10px]">Baseline Mean (μ)</span>
                    <span className="font-bold text-[#1E2227] text-sm">
                      {featuredMetric.baseline.mean} {featuredMetric.unit}
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E2E5E9]">
                    <span className="text-[#8C939E] block text-[10px]">Std Deviation (σ)</span>
                    <span className="font-bold text-[#1E2227] text-sm">
                      ±{featuredMetric.baseline.stdDev} {featuredMetric.unit}
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E2E5E9]">
                    <span className="text-[#8C939E] block text-[10px]">Current Z-Score</span>
                    <span className="font-bold text-[#1E2227] text-sm">
                      {activePoint?.value !== null && featuredMetric.baseline.mean !== undefined
                        ? `${calculateZScore(activePoint.value, featuredMetric.baseline.mean, featuredMetric.baseline.stdDev) ?? '0'}σ`
                        : '--'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#5A6068] space-y-1 bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E2E5E9]">
                  <div className="flex items-center justify-between">
                    <span>• |Z| &lt; 1.5σ: Nominal flight envelope</span>
                    <strong className="text-[#2E7D32]">Stable</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• 1.5σ ≤ |Z| &lt; 2.5σ: Physiological strain threshold</span>
                    <strong className="text-[#D95A11]">Advisory</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• |Z| ≥ 2.5σ: Acute clinical excursion threshold</span>
                    <strong className="text-[#C62828]">Critical</strong>
                  </div>
                </div>
              </div>

              {/* 3. NASA Standard & Reference Grounding */}
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E2227] uppercase tracking-wider font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                  <span>3. NASA-STD-3001 Compliance Specifications</span>
                </div>
                <div className="text-xs text-[#475569] space-y-1.5 leading-relaxed">
                  <p>
                    <strong>NASA-STD-3001 Volume 1 & Volume 2:</strong> Defines limits for environmental habitability and medical monitoring. Specifically mandates that habitable cabin CO2 be maintained below 2.8 mmHg (0.37 kPa) during crew awake intervals, dosimeter rate remain below 50 μSv/h without storm sheltering, and daily countermeasure resistance loading meet target neuromuscular strain.
                  </p>
                </div>
              </div>

              {/* 4. Telemetry Stream Distinction */}
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E2E5E9] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E2227] uppercase tracking-wider font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#047857]" />
                  <span>4. Telemetry Type Distinction</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#E2E5E9]">
                    <strong className="text-[#1E2227] block mb-0.5">Continuous Streams</strong>
                    <span className="text-[#5A6068]">
                      Hexoskin 3-lead ECG, TLS-02 Tunable Laser Spectrometer (CO2/O2), Forehead Heat-Flux Sensor, and Silicon Microdosimeter.
                    </span>
                  </div>
                  <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#E2E5E9]">
                    <strong className="text-[#1E2227] block mb-0.5">Periodic Operational Trials</strong>
                    <span className="text-[#5A6068]">
                      PVT Psychomotor Vigilance Trials (morning/evening), Isokinetic Dynamometer torque testing, and Scheduled DXA Bone Scans (Sol 190).
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Autonomous Prototype Disclaimer */}
              <div className="p-3 rounded-lg bg-[#FAF5ED] border border-[#E8D9C0] text-[11px] text-[#785E3A] leading-relaxed">
                <strong>NASA Space Apps Prototype Qualification:</strong> VIGIL demonstrates an autonomous clinical decision support architecture designed for communication-delayed deep-space exploration. Telemetry classifications and protocols represent aerospace medical design models and do not replace ground-based flight surgeon consensus.
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E5E9]">
              <span className="text-xs text-[#5A6068] font-mono">
                Telemetry Inspected: MET +184d {activePoint?.displayTime}
              </span>
              <button
                onClick={() => setShowRationaleModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1E2227] hover:bg-[#2F363F] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
