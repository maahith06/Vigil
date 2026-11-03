import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_MISSION_CONTEXT,
  INITIAL_METRICS,
  INITIAL_ALERTS,
  INITIAL_PROTOCOLS,
  INITIAL_INVENTORY,
  INITIAL_SENSORS,
} from './data/initialState';
import {
  MetricReading,
  HealthAlert,
  DecisionProtocol,
  MedicalInventoryItem,
  SensorDevice,
  MissionContext,
  MissionScenarioId,
  PvtAssessmentResult,
  DailySymptomReport,
  DisplayMode,
} from './types/health';
import { applyScenarioToState } from './data/scenarioData';
import { avionicsAudio } from './utils/audioFeedback';
import { HeaderMissionBar } from './components/HeaderMissionBar';
import { OperationalOverview } from './components/OperationalOverview';
import { DeepAnalyticsView } from './components/DeepAnalyticsView';
import { DecisionSupportView } from './components/DecisionSupportView';
import { AssessmentsView } from './components/AssessmentsView';
import { LifeSupportSensorsView } from './components/LifeSupportSensorsView';
import { FlightSurgeonAssistantModal } from './components/FlightSurgeonAssistantModal';
import { Keyboard, X } from 'lucide-react';

export default function App() {
  const [missionContext, setMissionContext] = useState<MissionContext>(INITIAL_MISSION_CONTEXT);
  const [metrics, setMetrics] = useState<MetricReading[]>(INITIAL_METRICS);
  const [alerts, setAlerts] = useState<HealthAlert[]>(INITIAL_ALERTS);
  const [protocols, setProtocols] = useState<DecisionProtocol[]>(INITIAL_PROTOCOLS);
  const [inventory, setInventory] = useState<MedicalInventoryItem[]>(INITIAL_INVENTORY);
  const [sensors, setSensors] = useState<SensorDevice[]>(INITIAL_SENSORS);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'analytics' | 'protocols' | 'assessments' | 'sensors' | 'consult'
  >('overview');
  const [selectedMetricId, setSelectedMetricId] = useState<string>('hr_resting');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Spaceflight Display Modes: Daylight, Night Cockpit (circadian red), High-Glare Solar
  const [displayMode, setDisplayMode] = useState<DisplayMode>('daylight');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(avionicsAudio.getMuted());
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  const handleToggleDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode);
    avionicsAudio.playClick();
    showToast(`Display mode: ${mode.toUpperCase()}`);
  };

  const handleToggleAudio = () => {
    const nextMuted = avionicsAudio.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      avionicsAudio.playClick();
      showToast('Avionics acoustic telemetry feedback enabled.');
    } else {
      showToast('Avionics acoustic telemetry feedback muted.');
    }
  };

  // Global Flight Deck Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHotkeysModal((prev) => !prev);
        avionicsAudio.playClick();
      } else if (e.key === 'Escape') {
        setShowHotkeysModal(false);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleAudio();
      } else if (e.key.toLowerCase() === 'n') {
        setDisplayMode((prev) => {
          const next: DisplayMode =
            prev === 'daylight' ? 'night' : prev === 'night' ? 'glare' : 'daylight';
          avionicsAudio.playClick();
          showToast(`Display mode: ${next.toUpperCase()}`);
          return next;
        });
      } else if (e.key.toLowerCase() === 'o') {
        setActiveTab('overview');
        avionicsAudio.playClick();
      } else if (e.key.toLowerCase() === 'd') {
        setActiveTab('analytics');
        avionicsAudio.playClick();
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTab('protocols');
        avionicsAudio.playClick();
      } else if (e.key.toLowerCase() === 'a') {
        setActiveTab('assessments');
        avionicsAudio.playClick();
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTab('sensors');
        avionicsAudio.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Switch Scenario handler
  const handleSelectScenario = useCallback((scenarioId: MissionScenarioId) => {
    const updated = applyScenarioToState(
      scenarioId,
      INITIAL_METRICS,
      INITIAL_SENSORS,
      0,
      false
    );

    setMissionContext((prev) => ({
      ...prev,
      currentScenario: scenarioId,
      simulatedTimeOffsetHours: 0,
    }));

    setMetrics(updated.metrics);
    setSensors(updated.sensors);
    setAlerts(updated.alerts);

    // Reset protocol step completion for fresh scenario testing
    setProtocols(JSON.parse(JSON.stringify(INITIAL_PROTOCOLS)));
    showToast(`Simulation updated to: ${scenarioId.replace(/_/g, ' ').toUpperCase()}`);
  }, []);

  // Advance simulated time (+4h, +12h, etc.)
  const handleAdvanceTime = useCallback((hours: number) => {
    setMissionContext((prev) => {
      const nextOffset = prev.simulatedTimeOffsetHours + hours;
      return {
        ...prev,
        simulatedTimeOffsetHours: nextOffset,
      };
    });

    // If an alert is in_progress, advancing time allows it to transition to resolved
    setAlerts((prevAlerts) =>
      prevAlerts.map((alt) => {
        if (alt.status === 'in_progress') {
          return {
            ...alt,
            status: 'resolved',
            reassessmentDeltaSummary:
              'Autonomous Reassessment (+4h): Telemetry normalized. CO2 down to 1.8 mmHg, cognitive reaction times restored.',
          };
        }
        return alt;
      })
    );

    showToast(`Fast-forwarded simulated time by +${hours} hours.`);
  }, []);

  // Reset simulation to initial state
  const handleResetSimulation = useCallback(() => {
    setMissionContext(INITIAL_MISSION_CONTEXT);
    setMetrics(INITIAL_METRICS);
    setAlerts(INITIAL_ALERTS);
    setProtocols(INITIAL_PROTOCOLS);
    setInventory(INITIAL_INVENTORY);
    setSensors(INITIAL_SENSORS);
    showToast('Simulation reset to baseline nominal cruise.');
  }, []);

  // Toggle protocol checklist step
  const handleToggleStep = useCallback(
    (protocolId: string, stepId: string) => {
      setProtocols((prevProtocols) =>
        prevProtocols.map((p) => {
          if (p.id !== protocolId) return p;
          const updatedSteps = p.steps.map((s) => {
            if (s.id !== stepId) return s;
            const willComplete = !s.isCompleted;

            // If required resource exists, decrement available count in inventory
            if (willComplete && s.requiredResource) {
              const resId = s.requiredResource.inventoryItemId;
              const qty = s.requiredResource.quantity;
              setInventory((prevInv) =>
                prevInv.map((item) =>
                  item.id === resId
                    ? { ...item, availableCount: Math.max(0, item.availableCount - qty) }
                    : item
                )
              );
            }

            return {
              ...s,
              isCompleted: willComplete,
              completedAt: willComplete ? new Date().toISOString() : undefined,
            };
          });

          // Check if all steps in this protocol are now complete
          const allDone = updatedSteps.every((s) => s.isCompleted);
          if (allDone) {
            setAlerts((prevAlerts) =>
              prevAlerts.map((alt) =>
                alt.recommendedProcedureId === protocolId || alt.id === p.alertId
                  ? { ...alt, status: 'in_progress' }
                  : alt
              )
            );
            showToast('All procedural steps checked off. Ready for Reassessment!');
          }

          return { ...p, steps: updatedSteps };
        })
      );
    },
    []
  );

  // Update astronaut notes on a step
  const handleUpdateStepNotes = useCallback(
    (protocolId: string, stepId: string, notes: string) => {
      setProtocols((prevProtocols) =>
        prevProtocols.map((p) =>
          p.id !== protocolId
            ? p
            : {
                ...p,
                steps: p.steps.map((s) =>
                  s.id === stepId ? { ...s, astronautNotes: notes } : s
                ),
              }
        )
      );
    },
    []
  );

  // Execute Reassessment workflow
  const handleExecuteReassessment = useCallback((alertId: string) => {
    // Advance simulated time by +4h and trigger resolution
    setMissionContext((prev) => ({
      ...prev,
      simulatedTimeOffsetHours: prev.simulatedTimeOffsetHours + 4,
    }));

    // Update metrics and alerts to resolved state
    setAlerts((prevAlerts) =>
      prevAlerts.map((alt) => {
        if (alt.id !== alertId) return alt;
        return {
          ...alt,
          title: `RESOLVED: ${alt.title.replace('CRITICAL ALERT: ', '').replace('WARNING: ', '')}`,
          status: 'resolved',
          severity: 'nominal',
          resolvedAt: new Date().toISOString(),
          reassessmentDeltaSummary:
            'Post-Intervention Reassessment (+4h): ECLSS ambient pCO2 decreased to 1.8 mmHg (-51% improvement). PVT Mean RT recovered to 222 ms (+103 ms improvement). Lapses: 0.',
        };
      })
    );

    // Update the relevant metrics back to nominal
    setMetrics((prevMetrics) =>
      prevMetrics.map((m) => {
        if (m.id === 'eclss_co2') {
          return { ...m, currentValue: 1.8, status: 'nominal', shortDescription: 'Post-intervention: Scrubber bed purged.' };
        }
        if (m.id === 'pvt_reaction_time') {
          return { ...m, currentValue: 222, status: 'nominal' };
        }
        if (m.id === 'pvt_lapse_rate') {
          return { ...m, currentValue: 0, status: 'nominal' };
        }
        if (m.id === 'hrv_rmssd') {
          return { ...m, currentValue: 54, status: 'nominal' };
        }
        if (m.id === 'dosimeter_dose_rate') {
          return { ...m, currentValue: 34.0, status: 'advisory', shortDescription: 'Water-wall shielding active.' };
        }
        return m;
      })
    );

    showToast('Reassessment complete! Telemetry normalized & incident logged.');
  }, []);

  // Commit PVT test result from interactive assessment
  const handleCommitPvtResult = useCallback((result: PvtAssessmentResult) => {
    setMetrics((prevMetrics) =>
      prevMetrics.map((m) => {
        if (m.id === 'pvt_reaction_time') {
          return {
            ...m,
            currentValue: result.meanReactionTimeMs,
            status: result.meanReactionTimeMs > 280 ? 'warning' : 'nominal',
            lastUpdated: new Date().toISOString(),
            freshnessSeconds: 1,
          };
        }
        if (m.id === 'pvt_lapse_rate') {
          return {
            ...m,
            currentValue: result.lapseCount,
            status: result.lapseCount > 0 ? 'warning' : 'nominal',
            lastUpdated: new Date().toISOString(),
            freshnessSeconds: 1,
          };
        }
        return m;
      })
    );
    showToast(`PVT Result Logged: Mean RT ${result.meanReactionTimeMs}ms, Readiness: ${result.cognitiveReadinessScore}/100.`);
  }, []);

  // Commit symptom check-in
  const handleCommitSymptomReport = useCallback((report: DailySymptomReport) => {
    showToast('Daily SANS & Symptom Check-in archived into Flight Medical Records.');
  }, []);

  // Commit manual lab measurement
  const handleCommitManualMeasurement = useCallback((metricId: string, value: number) => {
    setMetrics((prevMetrics) =>
      prevMetrics.map((m) =>
        m.id === metricId
          ? {
              ...m,
              currentValue: value,
              provenance: 'periodic_lab',
              lastUpdated: new Date().toISOString(),
              freshnessSeconds: 1,
            }
          : m
      )
    );
    showToast(`Lab measurement recorded for ${metricId}: ${value}`);
  }, []);

  // Toggle sensor hardware connection status
  const handleToggleSensorStatus = useCallback((sensorId: string) => {
    setSensors((prevSensors) =>
      prevSensors.map((s) => {
        if (s.id !== sensorId) return s;
        const nextStatus = s.connectionStatus === 'online' ? 'offline' : 'online';

        // Update corresponding metrics
        setMetrics((prevMetrics) =>
          prevMetrics.map((m) => {
            if (s.monitoredMetrics.includes(m.id)) {
              if (nextStatus === 'offline') {
                return {
                  ...m,
                  currentValue: null,
                  provenance: 'missing_data',
                  signalConfidence: 0,
                  status: 'warning', // Missing data is never assumed healthy!
                };
              } else {
                return {
                  ...m,
                  currentValue: m.baseline.mean,
                  provenance: 'direct_continuous',
                  signalConfidence: 98,
                  status: 'nominal',
                };
              }
            }
            return m;
          })
        );

        return {
          ...s,
          connectionStatus: nextStatus,
          dataQualityPct: nextStatus === 'online' ? 98 : 0,
        };
      })
    );

    showToast(`Sensor hardware state toggled.`);
  }, []);

  // Recalibrate sensor
  const handleRecalibrateSensor = useCallback((sensorId: string) => {
    setSensors((prevSensors) =>
      prevSensors.map((s) =>
        s.id === sensorId ? { ...s, dataQualityPct: 100, connectionStatus: 'online' } : s
      )
    );
    showToast('Sensor recalibration routine completed (Zero-drift adjusted).');
  }, []);

  const activeAlertCount = alerts.filter((a) => a.status !== 'resolved').length;
  const criticalAlertCount = alerts.filter(
    (a) => a.status !== 'resolved' && a.severity === 'critical'
  ).length;

  return (
    <div
      data-mode={displayMode}
      className="min-h-screen bg-[#F4F5F7] text-[#1E2227] flex flex-col font-sans selection:bg-[#D95A11]/15 selection:text-[#B84807]"
    >
      {/* Top Header & Simulation Controller */}
      <HeaderMissionBar
        missionContext={missionContext}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectScenario={handleSelectScenario}
        onAdvanceTime={handleAdvanceTime}
        onResetSimulation={handleResetSimulation}
        activeAlertCount={activeAlertCount}
        criticalAlertCount={criticalAlertCount}
        displayMode={displayMode}
        onToggleDisplayMode={handleToggleDisplayMode}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onAcknowledgeAlarm={() => {
          avionicsAudio.playStepSuccess();
          showToast('Master Caution & Warning Acknowledged.');
        }}
        onOpenHotkeys={() => {
          setShowHotkeysModal(true);
          avionicsAudio.playClick();
        }}
      />

      {/* Main Container Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-2 flex flex-col">
        {activeTab === 'overview' && (
          <OperationalOverview
            metrics={metrics}
            alerts={alerts}
            sensors={sensors}
            onOpenProtocol={(alertId) => {
              setActiveTab('protocols');
            }}
            onSelectMetricForDeepView={(metricId) => {
              setSelectedMetricId(metricId);
              setActiveTab('analytics');
            }}
            onOpenAssessments={() => setActiveTab('assessments')}
            onOpenSensors={() => setActiveTab('sensors')}
          />
        )}

        {activeTab === 'analytics' && (
          <DeepAnalyticsView
            metrics={metrics}
            selectedMetricId={selectedMetricId}
            onSelectMetricId={setSelectedMetricId}
            scenarioTimeOffsetHours={missionContext.simulatedTimeOffsetHours}
          />
        )}

        {activeTab === 'protocols' && (
          <DecisionSupportView
            alerts={alerts}
            protocols={protocols}
            inventory={inventory}
            metrics={metrics}
            onToggleStep={handleToggleStep}
            onUpdateStepNotes={handleUpdateStepNotes}
            onExecuteReassessment={handleExecuteReassessment}
            onOpenAssessments={() => setActiveTab('assessments')}
          />
        )}

        {activeTab === 'assessments' && (
          <AssessmentsView
            onCommitPvtResult={handleCommitPvtResult}
            onCommitSymptomReport={handleCommitSymptomReport}
            onCommitManualMeasurement={handleCommitManualMeasurement}
          />
        )}

        {activeTab === 'sensors' && (
          <LifeSupportSensorsView
            sensors={sensors}
            metrics={metrics}
            onToggleSensorStatus={handleToggleSensorStatus}
            onRecalibrateSensor={handleRecalibrateSensor}
          />
        )}

        {activeTab === 'consult' && (
          <FlightSurgeonAssistantModal
            missionContext={missionContext}
            metrics={metrics}
            alerts={alerts}
          />
        )}
      </main>

      {/* Persistent Toast Banner */}
      {toastNotification && (
        <div className="fixed bottom-3 right-4 z-50 bg-[#1E2227] border border-[#3E454F] text-white px-3.5 py-2 rounded-lg shadow-lg text-xs font-sans font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-[#D95A11] animate-pulse" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Compact Operational Footer */}
      <footer className="border-t border-[#E2E5E9] bg-[#FFFFFF] py-1 px-4 text-center text-[10px] font-mono text-[#5A6068] shrink-0">
        VIGIL Autonomous Spaceflight HMI • NASA Space Apps Challenge Autonomous Medicine System • MET +184 • Deep-Space Cruise
      </footer>

      {/* ========================================================
          FLIGHT DECK PHYSICAL KEYBOARD SHORTCUTS MODAL [?]
          Operational microgravity rapid-access reference
          ======================================================== */}
      {showHotkeysModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0F14]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E2E5E9] space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E5E9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] text-[#1E2227] flex items-center justify-center border border-[#E2E5E9]">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E2227]">
                    Flight Deck Operational Hotkeys
                  </h3>
                  <p className="text-xs text-[#5A6068] font-mono">
                    Tactile microgravity controls (Designed for zero-g glove use)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="p-1.5 text-[#5A6068] hover:text-[#1E2227] rounded-lg hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                title="Close [Esc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hotkeys Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Column 1: Domain Selection */}
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E5E9] space-y-2">
                <span className="font-bold font-mono text-[11px] text-[#1E2227] uppercase tracking-wider block">
                  Health Domains
                </span>
                <div className="space-y-1.5 text-[#475569]">
                  <div className="flex items-center justify-between">
                    <span>Cardiovascular</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">1</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sleep & Recovery</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">2</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cognitive / PVT</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">3</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Musculoskeletal</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">4</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Immune & Hydration</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">5</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Radiation Dosimetry</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">6</kbd>
                  </div>
                </div>
              </div>

              {/* Column 2: Navigation & Systems */}
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E5E9] space-y-2">
                <span className="font-bold font-mono text-[11px] text-[#1E2227] uppercase tracking-wider block">
                  Consoles & Avionics
                </span>
                <div className="space-y-1.5 text-[#475569]">
                  <div className="flex items-center justify-between">
                    <span>Operations HUD</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">O</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Deep Telemetry</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">D</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Decision Protocols</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">P</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>PVT & Assessments</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">A</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ECLSS Sensors</span>
                    <kbd className="font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">H</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Log Vitals / Symptoms</span>
                    <kbd className="font-mono bg-[#FFF7ED] px-1.5 py-0.5 rounded border border-[#FED7AA] font-bold text-[#D95A11]">S</kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Microgravity Avionics Controls */}
            <div className="p-3 bg-[#FFFBF8] rounded-xl border border-[#FEEAD9] text-xs space-y-2">
              <span className="font-bold font-mono text-[11px] text-[#D95A11] uppercase tracking-wider block">
                Lighting & Audio Controls
              </span>
              <div className="grid grid-cols-3 gap-2 text-[#475569]">
                <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#FEEAD9] flex items-center justify-between">
                  <span>Display Mode</span>
                  <kbd className="font-mono bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">N</kbd>
                </div>
                <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#FEEAD9] flex items-center justify-between">
                  <span>Audio Feedback</span>
                  <kbd className="font-mono bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">M</kbd>
                </div>
                <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#FEEAD9] flex items-center justify-between">
                  <span>Dismiss / Silence</span>
                  <kbd className="font-mono bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E2E5E9] font-bold text-[#1E2227]">Esc</kbd>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E2E5E9]">
              <span className="text-[11px] text-[#5A6068]">
                Press <kbd className="font-mono bg-[#F1F3F5] px-1 py-0.5 rounded border border-[#E2E5E9]">?</kbd> anytime to open this guide
              </span>
              <button
                onClick={() => setShowHotkeysModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1E2227] hover:bg-[#2F363F] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
