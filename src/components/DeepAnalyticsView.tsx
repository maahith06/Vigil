import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Activity,
  Calendar,
  Crosshair,
  Cpu,
} from 'lucide-react';
import { MetricReading } from '../types/health';
import { generateTimeSeriesData } from '../data/initialState';
import { calculateZScore } from '../utils/mathAndBaselines';

interface DeepAnalyticsViewProps {
  metrics: MetricReading[];
  selectedMetricId: string;
  onSelectMetricId: (id: string) => void;
  scenarioTimeOffsetHours: number;
}

export const DeepAnalyticsView: React.FC<DeepAnalyticsViewProps> = ({
  metrics,
  selectedMetricId,
  onSelectMetricId,
  scenarioTimeOffsetHours,
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [secondaryMetricId, setSecondaryMetricId] = useState<string>('none');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId) || metrics[0];
  const secondaryMetric = metrics.find((m) => m.id === secondaryMetricId);

  // Clear hovered point when metric or timeframe switches
  React.useEffect(() => {
    setHoveredPointIndex(null);
  }, [selectedMetricId, timeframe]);

  // Generate primary series data
  const primarySeries = useMemo(() => {
    const scenarioMultiplier =
      selectedMetric.currentValue !== null && selectedMetric.baseline.mean > 0
        ? selectedMetric.currentValue / selectedMetric.baseline.mean
        : 1.0;
    return generateTimeSeriesData(selectedMetric.id, timeframe, scenarioMultiplier);
  }, [selectedMetric.id, selectedMetric.currentValue, timeframe, scenarioTimeOffsetHours]);

  // Generate secondary series data if active
  const secondarySeries = useMemo(() => {
    if (!secondaryMetric) return null;
    const mult =
      secondaryMetric.currentValue !== null && secondaryMetric.baseline.mean > 0
        ? secondaryMetric.currentValue / secondaryMetric.baseline.mean
        : 1.0;
    return generateTimeSeriesData(secondaryMetric.id, timeframe, mult);
  }, [secondaryMetric, timeframe, scenarioTimeOffsetHours]);

  // Calculate stats
  const validValues = primarySeries.map((p) => p.value).filter((v): v is number => v !== null);
  const minVal = validValues.length > 0 ? Math.min(...validValues) : 0;
  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 0;
  const avgVal = validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

  // Chart bounds calculation
  const chartMin = Math.min(minVal, selectedMetric.baseline.acceptableMin) * 0.92;
  const chartMax = Math.max(maxVal, selectedMetric.baseline.acceptableMax) * 1.08;
  const range = chartMax - chartMin || 1;

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const getY = (val: number) => {
    const norm = (val - chartMin) / range;
    return svgHeight - paddingY - norm * plotHeight;
  };

  const getX = (index: number, total: number) => {
    return paddingX + (index / (total - 1 || 1)) * plotWidth;
  };

  // SVG points string for primary
  const primaryPathD = primarySeries
    .map((p, idx) => {
      if (p.value === null) return '';
      const x = getX(idx, primarySeries.length);
      const y = getY(p.value);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(Boolean)
    .join(' ');

  // Acceptable baseline band polygon
  const baseBandYTop = getY(selectedMetric.baseline.acceptableMax);
  const baseBandYBottom = getY(selectedMetric.baseline.acceptableMin);
  const baselineBandD = `
    M ${paddingX} ${baseBandYTop}
    L ${svgWidth - paddingX} ${baseBandYTop}
    L ${svgWidth - paddingX} ${baseBandYBottom}
    L ${paddingX} ${baseBandYBottom}
    Z
  `;

  // Mean line
  const meanY = getY(selectedMetric.baseline.mean);

  const activePoint = hoveredPointIndex !== null ? primarySeries[hoveredPointIndex] : primarySeries[primarySeries.length - 1];
  const activeZ = activePoint?.value ? calculateZScore(activePoint.value, selectedMetric.baseline.mean, selectedMetric.baseline.stdDev) : null;

  return (
    <div className="space-y-5 pb-12 font-sans">
      {/* 1. View Header with Metric Tabs */}
      <div className="bg-[#FAF8F4] p-4 sm:p-5 rounded-xl border border-[#D6CEC2] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-[#C96E2E]" />
              <h1 className="text-base font-bold text-[#26231F]">
                Longitudinal Physiological Trend & Personal Baseline Analysis
              </h1>
            </div>
            <p className="text-xs text-[#6B655E]">
              High-resolution trajectory comparison against astronaut pre-flight normative bounds.
            </p>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1.5 bg-[#ECE7DE] p-1 rounded-lg border border-[#D6CEC2] text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#6B655E] ml-1.5 mr-0.5" />
            <button
              onClick={() => setTimeframe('24h')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                timeframe === '24h' ? 'bg-[#FAF8F4] text-[#26231F] font-bold shadow-xs' : 'text-[#6B655E] hover:text-[#26231F]'
              }`}
            >
              Last 24h
            </button>
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                timeframe === '7d' ? 'bg-[#FAF8F4] text-[#26231F] font-bold shadow-xs' : 'text-[#6B655E] hover:text-[#26231F]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                timeframe === '30d' ? 'bg-[#FAF8F4] text-[#26231F] font-bold shadow-xs' : 'text-[#6B655E] hover:text-[#26231F]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#ECE7DE]">
          {metrics.map((m) => {
            const isSelected = m.id === selectedMetric.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMetricId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#2E3235] text-white border-[#2E3235] shadow-xs'
                    : 'bg-[#ECE7DE] text-[#6B655E] border-[#D6CEC2] hover:bg-[#E2DBCF] hover:text-[#26231F]'
                }`}
              >
                <span>{m.name}</span>
                {m.status === 'critical' ? (
                  <span className="w-2 h-2 rounded-full bg-[#B54B3A]" />
                ) : m.status === 'warning' ? (
                  <span className="w-2 h-2 rounded-full bg-[#C96E2E]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Chart Canvas and Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG Interactive Chart (3 Columns) */}
        <div className="lg:col-span-3 bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#C96E2E] inline-block" />
                <span className="font-bold text-[#26231F]">{selectedMetric.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#6B655E]">
                <span className="w-3 h-2 bg-[#4F7A5A]/20 border border-[#4F7A5A]/50 rounded-xs inline-block" />
                <span>Normative Baseline Band</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#6B655E]">
                <span className="w-3 h-0.5 border-b border-dashed border-[#4F7A5A] inline-block" />
                <span>Mean ({selectedMetric.baseline.mean} {selectedMetric.unit})</span>
              </div>
            </div>

            {/* Secondary Metric Overlay Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[#6B655E] text-xs font-medium">Overlay signal:</span>
              <select
                value={secondaryMetricId}
                onChange={(e) => setSecondaryMetricId(e.target.value)}
                className="bg-[#ECE7DE] text-[#26231F] border border-[#D6CEC2] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#C96E2E] font-medium"
              >
                <option value="none">-- None (Single Signal) --</option>
                {metrics
                  .filter((m) => m.id !== selectedMetric.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full overflow-hidden bg-[#FAF8F4] rounded-lg border border-[#D6CEC2] p-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + ratio * plotHeight;
                const val = chartMax - ratio * range;
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#E2DBCF"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      fill="#6B655E"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Baseline acceptable shaded band */}
              <path
                d={baselineBandD}
                fill="#4F7A5A"
                fillOpacity="0.10"
                stroke="#4F7A5A"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Mean dashed line */}
              <line
                x1={paddingX}
                y1={meanY}
                x2={svgWidth - paddingX}
                y2={meanY}
                stroke="#4F7A5A"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Primary metric curve */}
              <path
                d={primaryPathD}
                fill="none"
                stroke="#C96E2E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {primarySeries.map((p, idx) => {
                if (p.value === null) return null;
                const cx = getX(idx, primarySeries.length);
                const cy = getY(p.value);
                const isHovered = hoveredPointIndex === idx;

                return (
                  <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(idx)}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      fill={isHovered ? '#C96E2E' : '#FAF8F4'}
                      stroke="#C96E2E"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Hover indicator crosshair */}
              {hoveredPointIndex !== null && (
                <line
                  x1={getX(hoveredPointIndex, primarySeries.length)}
                  y1={paddingY}
                  x2={getX(hoveredPointIndex, primarySeries.length)}
                  y2={svgHeight - paddingY}
                  stroke="#C96E2E"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}
            </svg>
          </div>

          {/* Active / Hovered Point Inspector Banner */}
          <div className="bg-[#ECE7DE] p-3 rounded-lg border border-[#D6CEC2] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#C96E2E]" />
              <span className="text-[#6B655E]">Sample point:</span>
              <span className="text-[#26231F] font-semibold">{activePoint?.displayTime}</span>
              <span className="text-[#D6CEC2]">|</span>
              <span className="text-[#6B655E]">Value:</span>
              <span className="text-[#26231F] font-mono font-bold text-sm">
                {activePoint?.value ?? 'N/A'} {selectedMetric.unit}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#6B655E]">
                Baseline mean: <strong className="text-[#26231F]">{selectedMetric.baseline.mean} {selectedMetric.unit}</strong>
              </span>
              <span className="text-[#6B655E]">
                Norm range: <strong className="text-[#26231F]">{selectedMetric.baseline.acceptableMin} – {selectedMetric.baseline.acceptableMax}</strong>
              </span>
              {activeZ !== null && (
                <span className={`font-semibold ${Math.abs(activeZ) >= 2.0 ? 'text-[#C96E2E]' : 'text-[#26231F]'}`}>
                  Z-Score: {activeZ > 0 ? `+${activeZ}σ` : `${activeZ}σ`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistical & Provenance Inspector (1 Column) */}
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#ECE7DE] pb-2">
              <Activity className="w-4 h-4 text-[#C96E2E]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B655E]">
                Window Statistics ({timeframe})
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#ECE7DE]">
                <span className="text-[#6B655E]">Sample average:</span>
                <span className="text-[#26231F] font-mono font-bold">{avgVal.toFixed(1)} {selectedMetric.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ECE7DE]">
                <span className="text-[#6B655E]">Minimum:</span>
                <span className="text-[#26231F] font-mono">{minVal.toFixed(1)} {selectedMetric.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ECE7DE]">
                <span className="text-[#6B655E]">Maximum:</span>
                <span className="text-[#26231F] font-mono">{maxVal.toFixed(1)} {selectedMetric.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ECE7DE]">
                <span className="text-[#6B655E]">Personal baseline std:</span>
                <span className="text-[#26231F] font-mono">±{selectedMetric.baseline.stdDev} {selectedMetric.unit}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B655E]">Within normative band:</span>
                <span className="text-[#4F7A5A] font-mono font-bold">
                  {Math.round(
                    (validValues.filter(
                      (v) =>
                        v >= selectedMetric.baseline.acceptableMin &&
                        v <= selectedMetric.baseline.acceptableMax
                    ).length /
                      (validValues.length || 1)) *
                      100
                  )}%
                </span>
              </div>
            </div>
          </div>

          {/* Sensor Provenance Details */}
          <div className="bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-4 space-y-3 text-xs shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#ECE7DE] pb-2">
              <Cpu className="w-4 h-4 text-[#C96E2E]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B655E]">
                Data Provenance & Reliability
              </h2>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-[11px] text-[#6B655E] block">Instrumentation:</span>
                <span className="text-[#26231F] font-semibold">{selectedMetric.sensorSource}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B655E] block">Provenance class:</span>
                <span className="text-[#26231F] font-mono capitalize">{selectedMetric.provenance.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B655E] block">Signal confidence:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden border border-[#D6CEC2]">
                    <div
                      className="bg-[#C96E2E] h-full rounded-full"
                      style={{ width: `${selectedMetric.signalConfidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-[#26231F] font-semibold">{selectedMetric.signalConfidence}%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ECE7DE]">
              <span className="text-[11px] font-bold text-[#6B655E] uppercase block mb-1">
                Clinical Significance:
              </span>
              <p className="text-[#6B655E] text-xs leading-relaxed">
                {selectedMetric.clinicalSignificance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
