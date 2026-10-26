import React from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  Battery,
  RefreshCw,
  Gauge,
  Wind,
  Shield,
  Layers,
} from 'lucide-react';
import { SensorDevice, MetricReading } from '../types/health';

interface LifeSupportSensorsViewProps {
  sensors: SensorDevice[];
  metrics: MetricReading[];
  onToggleSensorStatus: (sensorId: string) => void;
  onRecalibrateSensor: (sensorId: string) => void;
}

export const LifeSupportSensorsView: React.FC<LifeSupportSensorsViewProps> = ({
  sensors,
  metrics,
  onToggleSensorStatus,
  onRecalibrateSensor,
}) => {
  // ECLSS Metrics
  const co2 = metrics.find((m) => m.id === 'eclss_co2');
  const o2 = metrics.find((m) => m.id === 'eclss_o2');
  const pressure = metrics.find((m) => m.id === 'cabin_pressure');
  const dosimeter = metrics.find((m) => m.id === 'dosimeter_dose_rate');

  return (
    <div className="space-y-5 pb-12 font-sans">
      {/* 1. View Header */}
      <div className="bg-[#FAF8F4] border border-[#D6CEC2] p-4 sm:p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#C96E2E]" />
            <h1 className="text-base font-bold text-[#26231F]">
              Hardware Sensor Matrix & Life Support Architecture
            </h1>
          </div>
          <p className="text-xs text-[#6B655E]">
            Monitors telemetry node integrity, packet reliability, and atmospheric conditions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B655E]">Monitored telemetry nodes:</span>
          <span className="text-[#26231F] font-bold font-mono px-2 py-0.5 rounded bg-[#ECE7DE] border border-[#D6CEC2]">
            {sensors.length} Active Nodes
          </span>
        </div>
      </div>

      {/* 2. ECLSS Life Support Environmental Telemetry Rack */}
      <section aria-label="ECLSS Environmental Telemetry" className="bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-2.5">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#C96E2E]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B655E]">
              Habitat Environmental & Life Support Systems (ECLSS-02)
            </h2>
          </div>
          <span className="text-xs text-[#4F7A5A] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4F7A5A]" />
            Loop circulation nominal (0.24 m/s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Cabin CO2 */}
          <div className="p-3.5 rounded-xl bg-[#ECE7DE] border border-[#D6CEC2] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B655E]">
              <span>Cabin pCO2 (Carbon Dioxide)</span>
              <Wind className="w-4 h-4 text-[#6B655E]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className={`text-2xl font-bold ${co2?.status === 'critical' ? 'text-[#B54B3A]' : co2?.status === 'warning' ? 'text-[#C96E2E]' : 'text-[#26231F]'}`}>
                {co2?.currentValue ?? 'N/A'} <span className="text-xs font-normal text-[#6B655E]">mmHg</span>
              </span>
              <span className="text-[11px] text-[#6B655E]">Max limit: 2.8</span>
            </div>
            <div className="w-full bg-[#FAF8F4] h-2 rounded-full overflow-hidden border border-[#D6CEC2]">
              <div
                className={`h-full ${
                  co2 && co2.currentValue && co2.currentValue > 3.0
                    ? 'bg-[#B54B3A]'
                    : 'bg-[#4F7A5A]'
                }`}
                style={{ width: `${Math.min(100, ((co2?.currentValue || 2.1) / 4.0) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#6B655E]">
              {co2?.status === 'critical' ? 'Scrubber saturated' : 'LiOH / Amine bed nominal'}
            </div>
          </div>

          {/* Cabin pO2 */}
          <div className="p-3.5 rounded-xl bg-[#ECE7DE] border border-[#D6CEC2] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B655E]">
              <span>Cabin pO2 (Oxygen)</span>
              <Shield className="w-4 h-4 text-[#6B655E]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-[#26231F]">
                {o2?.currentValue ?? 21.3} <span className="text-xs font-normal text-[#6B655E]">kPa</span>
              </span>
              <span className="text-[11px] text-[#6B655E]">Range: 19.5 - 23.0</span>
            </div>
            <div className="w-full bg-[#FAF8F4] h-2 rounded-full overflow-hidden border border-[#D6CEC2]">
              <div className="bg-[#4F7A5A] h-full" style={{ width: '65%' }} />
            </div>
            <div className="text-[11px] text-[#6B655E]">Normoxic partial pressure</div>
          </div>

          {/* Total Pressure */}
          <div className="p-3.5 rounded-xl bg-[#ECE7DE] border border-[#D6CEC2] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B655E]">
              <span>Total Cabin Pressure</span>
              <Gauge className="w-4 h-4 text-[#6B655E]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-[#26231F]">
                {pressure?.currentValue ?? 101.3} <span className="text-xs font-normal text-[#6B655E]">kPa</span>
              </span>
              <span className="text-[11px] text-[#6B655E]">1.00 atm sea level</span>
            </div>
            <div className="w-full bg-[#FAF8F4] h-2 rounded-full overflow-hidden border border-[#D6CEC2]">
              <div className="bg-[#2E3235] h-full" style={{ width: '80%' }} />
            </div>
            <div className="text-[11px] text-[#6B655E]">Hull differential: 101.4 kPa</div>
          </div>

          {/* Active Radiation */}
          <div className="p-3.5 rounded-xl bg-[#ECE7DE] border border-[#D6CEC2] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B655E]">
              <span>Active Ionizing Flux</span>
              <Layers className="w-4 h-4 text-[#6B655E]" />
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className={`text-2xl font-bold ${dosimeter?.status === 'critical' ? 'text-[#B54B3A]' : 'text-[#26231F]'}`}>
                {dosimeter?.currentValue ?? 26.5} <span className="text-xs font-normal text-[#6B655E]">μSv/h</span>
              </span>
              <span className="text-[11px] text-[#6B655E]">GCR baseline &lt; 35</span>
            </div>
            <div className="w-full bg-[#FAF8F4] h-2 rounded-full overflow-hidden border border-[#D6CEC2]">
              <div
                className={`h-full ${
                  dosimeter && dosimeter.currentValue && dosimeter.currentValue > 50
                    ? 'bg-[#B54B3A]'
                    : 'bg-[#4F7A5A]'
                }`}
                style={{ width: `${Math.min(100, ((dosimeter?.currentValue || 26) / 100) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#6B655E]">
              {dosimeter?.status === 'critical' ? 'SPE Proton storm alert' : 'GCR background nominal'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sensor Hardware Matrix & Missing Data Fault Injection */}
      <section aria-label="Sensor Hardware Matrix" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#C96E2E]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B655E]">
              Hardware Node Matrix & Missing Data Fault Injection
            </h2>
          </div>
          <span className="text-xs text-[#6B655E]">
            Simulate disconnects to verify safe autonomous missing-data behavior
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sensors.map((sens) => {
            const isOnline = sens.connectionStatus === 'online';

            return (
              <div
                key={sens.id}
                className={`p-4 rounded-xl border transition-all ${
                  !isOnline
                    ? 'bg-[#FAF8F4] border-[#B54B3A] shadow-xs'
                    : 'bg-[#FAF8F4] border-[#D6CEC2] hover:border-[#B5ABA0]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#26231F]">
                      {sens.name}
                    </h3>
                    <div className="text-[11px] text-[#6B655E] mt-0.5">
                      {sens.hardwareModel} • FW {sens.firmwareVersion}
                    </div>
                  </div>

                  {isOnline ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#4F7A5A]/15 text-[#4F7A5A] border border-[#4F7A5A]/30">
                      <Wifi className="w-3 h-3" />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#B54B3A]/15 text-[#B54B3A] border border-[#B54B3A]/30">
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs border-t border-[#ECE7DE] pt-2.5 mb-3">
                  <div className="flex justify-between text-[#6B655E]">
                    <span>Placement site:</span>
                    <span className="text-[#26231F] font-medium">{sens.bodySiteOrLocation}</span>
                  </div>
                  <div className="flex justify-between text-[#6B655E]">
                    <span>Data quality / signal:</span>
                    <span className={sens.dataQualityPct < 50 ? 'text-[#B54B3A] font-bold font-mono' : 'text-[#4F7A5A] font-bold font-mono'}>
                      {sens.dataQualityPct}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B655E]">
                    <span>Battery status:</span>
                    <span className="text-[#26231F] font-mono flex items-center gap-1">
                      <Battery className="w-3 h-3 text-[#6B655E]" />
                      {sens.batteryPct}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B655E]">
                    <span>Last calibration:</span>
                    <span className="text-[#26231F] font-mono">{sens.lastCalibrationMET}</span>
                  </div>
                </div>

                {/* Missing Data Policy Note */}
                {!isOnline && (
                  <div className="p-2.5 rounded bg-[#B54B3A]/10 border border-[#B54B3A]/20 text-[11px] text-[#B54B3A] mb-3">
                    <strong>Autonomous Policy:</strong> Biometrics flagged as UNAVAILABLE. Zero false-normal assumptions made.
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#ECE7DE]">
                  <button
                    onClick={() => onRecalibrateSensor(sens.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#6B655E] hover:text-[#26231F] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Calibrate</span>
                  </button>

                  <button
                    onClick={() => onToggleSensorStatus(sens.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isOnline
                        ? 'bg-[#ECE7DE] hover:bg-[#E2DBCF] text-[#B54B3A] border border-[#D6CEC2]'
                        : 'bg-[#4F7A5A] hover:bg-[#3E6247] text-white shadow-xs'
                    }`}
                  >
                    {isOnline ? 'Simulate Disconnect' : 'Reconnect Sensor'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
