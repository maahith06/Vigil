import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  FileText,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  HealthAlert,
  DecisionProtocol,
  MedicalInventoryItem,
  MetricReading,
} from '../types/health';

interface DecisionSupportViewProps {
  alerts: HealthAlert[];
  protocols: DecisionProtocol[];
  inventory: MedicalInventoryItem[];
  metrics: MetricReading[];
  onToggleStep: (protocolId: string, stepId: string) => void;
  onUpdateStepNotes: (protocolId: string, stepId: string, notes: string) => void;
  onExecuteReassessment: (alertId: string) => void;
  onOpenAssessments: () => void;
}

export const DecisionSupportView: React.FC<DecisionSupportViewProps> = ({
  alerts,
  protocols,
  inventory,
  metrics,
  onToggleStep,
  onUpdateStepNotes,
  onExecuteReassessment,
  onOpenAssessments,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string>(
    alerts[0]?.id || 'alert_co2_hypercapnia_fatigue'
  );

  const activeAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];
  const activeProtocol = protocols.find(
    (p) => p.alertId === activeAlert?.id || p.id === activeAlert?.recommendedProcedureId
  ) || protocols[0];

  // Helper to get metric by ID
  const getMetric = (id: string) => metrics.find((m) => m.id === id);

  const stepsCompleted = activeProtocol?.steps.filter((s) => s.isCompleted).length || 0;
  const totalSteps = activeProtocol?.steps.length || 0;
  const allStepsCompleted = totalSteps > 0 && stepsCompleted === totalSteps;

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#FFFFFF] border border-[#E2E5E9] p-4 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#D95A11]" />
            <h1 className="text-base font-bold text-[#1E2227]">
              Autonomous Clinical Decision Support & Action Protocols
            </h1>
          </div>
          <p className="text-xs text-[#5A6068]">
            Core workflow: <strong>Gather → Monitor → Evaluate → Explain → Act → Reassess</strong>
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {activeAlert?.status === 'resolved' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2E7D32]/12 text-[#2E7D32] border border-[#2E7D32]/25 text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Event Resolved & Audited
            </span>
          ) : activeAlert?.status === 'in_progress' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D95A11]/15 text-[#B84807] border border-[#D95A11]/30 text-xs font-bold font-mono">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              Countermeasures in Progress
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30 text-xs font-bold font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              Action Required ({stepsCompleted}/{totalSteps} Steps)
            </span>
          )}
        </div>
      </div>

      {/* 2. Alert Selector Tabs if multiple */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {alerts.map((alt) => {
            const isSelected = selectedAlertId === alt.id;
            return (
              <button
                key={alt.id}
                onClick={() => setSelectedAlertId(alt.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1E2227] text-white border-[#1E2227] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#5A6068] border-[#E2E5E9] hover:bg-[#F8F9FA] hover:text-[#1E2227]'
                }`}
              >
                <span className="truncate max-w-[240px] font-semibold">{alt.title}</span>
                {alt.status === 'resolved' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#D95A11]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main Operational Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Clinical Context & Explanation (1 Col) */}
        <div className="space-y-4">
          {/* Trigger Telemetry Breakdown */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E5E9] p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-2">
              <Stethoscope className="w-4 h-4 text-[#D95A11]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2227] font-mono">
                1. Responsible Telemetry
              </h2>
            </div>

            <div className="space-y-2">
              {activeAlert?.triggerMetrics && activeAlert.triggerMetrics.length > 0 ? (
                activeAlert.triggerMetrics.map((metId) => {
                  const met = getMetric(metId);
                  if (!met) return null;
                  const isOut = met.status === 'warning' || met.status === 'critical';

                  return (
                    <div
                      key={met.id}
                      className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#1E2227]">{met.name}</div>
                        <div className="text-[11px] text-[#5A6068]">
                          Baseline: {met.baseline.mean} {met.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold text-sm ${
                            isOut ? 'text-[#C62828]' : 'text-[#1E2227]'
                          }`}
                        >
                          {met.currentValue ?? 'DATA GAP'} {met.unit}
                        </div>
                        <span
                          className={`text-[10px] font-bold font-mono uppercase ${
                            isOut ? 'text-[#C62828]' : 'text-[#2E7D32]'
                          }`}
                        >
                          {met.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E2E5E9] text-xs text-[#5A6068]">
                  All biometric and life support feeds are tracking within nominal parameters.
                </div>
              )}
            </div>
          </div>

          {/* Pathophysiological Explanation */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E5E9] p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-2">
              <FileText className="w-4 h-4 text-[#D95A11]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2227] font-mono">
                2. Physiological Rationale & Uncertainty
              </h2>
            </div>

            <div className="text-xs text-[#1E2227] leading-relaxed space-y-2.5">
              <p className="text-[#475569]">
                {activeAlert?.physiologicalExplanation ||
                  'No acute clinical triggers currently flagged. Ongoing continuous evaluation of circadian rhythm, fluid redistribution, and space radiation dosimeter flux.'}
              </p>
              <div className="p-2.5 rounded bg-[#F8F9FA] border border-[#E2E5E9] text-[11px] text-[#5A6068]">
                <strong className="text-[#1E2227] block mb-1">
                  Confidence & Clinical Boundary:
                </strong>
                {activeAlert?.uncertaintyDisclaimer ||
                  'Long-duration spaceflight medicine autonomous engine. High confidence in continuous biometric telemetry; periodic lab assays verify calibration.'}
              </div>
            </div>
          </div>

          {/* Onboard Medical & Life Support Inventory */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E5E9] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#D95A11]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E2227] font-mono">
                  Onboard Resources
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#5A6068]">HAB LOCKERS</span>
            </div>

            <div className="space-y-2 text-xs">
              {inventory.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded bg-[#F8F9FA] border border-[#E2E5E9]"
                >
                  <div>
                    <div className="text-[#1E2227] font-semibold text-xs">{item.name}</div>
                    <div className="text-[10px] text-[#5A6068]">{item.storageLocker}</div>
                  </div>
                  <div className="text-right font-mono">
                    <span
                      className={`font-bold ${
                        item.availableCount <= item.criticalLevel
                          ? 'text-[#C62828]'
                          : 'text-[#1E2227]'
                      }`}
                    >
                      {item.availableCount}
                    </span>
                    <span className="text-[#5A6068] text-[10px]">
                      {' '}
                      / {item.totalCount} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Protocol & Action Steps (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E5E9] p-5 shadow-xs space-y-4">
            {/* Protocol Header */}
            <div className="border-b border-[#E2E5E9] pb-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-base font-bold text-[#1E2227]">
                  {activeProtocol?.title || 'Operational Routine & Countermeasures'}
                </h2>
                <span className="text-xs font-mono font-bold text-[#B84807] bg-[#D95A11]/15 px-2.5 py-0.5 rounded border border-[#D95A11]/30">
                  Est: {activeProtocol?.estimatedDuration || '20 min'}
                </span>
              </div>
              <p className="text-xs text-[#5A6068]">
                <strong className="text-[#1E2227]">Objective:</strong>{' '}
                {activeProtocol?.objective || 'Routine operational physiological maintenance.'}
              </p>
            </div>

            {/* Checklist of Steps */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#5A6068]">
                <span className="font-semibold uppercase tracking-wider text-[11px] font-mono">
                  Procedural Checklist ({stepsCompleted} of {totalSteps} complete):
                </span>
                <span className="text-[11px]">Click checkbox to record step execution</span>
              </div>

              {activeProtocol?.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all ${
                    step.isCompleted
                      ? 'bg-[#F8F9FA] border-[#E2E5E9]'
                      : 'bg-[#FFFFFF] border-[#E2E5E9] hover:border-[#D1D5DB]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleStep(activeProtocol.id, step.id)}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                        step.isCompleted
                          ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-xs'
                          : 'border-[#CBD5E1] bg-[#FFFFFF] hover:border-[#D95A11]'
                      }`}
                      aria-label={`Mark step ${idx + 1} complete`}
                    >
                      {step.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span
                          className={`text-sm font-bold ${
                            step.isCompleted ? 'text-[#8C939E] line-through' : 'text-[#1E2227]'
                          }`}
                        >
                          {idx + 1}. {step.label}
                        </span>
                        {step.requiredResource && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F8F9FA] border border-[#E2E5E9] text-[#1E2227]">
                            Resource: {step.requiredResource.name} ({step.requiredResource.quantity}{' '}
                            {step.requiredResource.unit})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#5A6068] leading-relaxed">
                        {step.description}
                      </p>

                      {/* Astronaut Notes Input */}
                      <div className="pt-0.5">
                        <input
                          type="text"
                          placeholder="Astronaut observation log / notes (optional)..."
                          value={step.astronautNotes || ''}
                          onChange={(e) =>
                            onUpdateStepNotes(activeProtocol.id, step.id, e.target.value)
                          }
                          className="w-full bg-[#F8F9FA] border border-[#E2E5E9] rounded-lg px-3 py-1.5 text-xs text-[#1E2227] placeholder-[#8C939E] focus:outline-none focus:border-[#D95A11] font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reassessment Action Section (Step 6) */}
            <div className="mt-4 pt-4 border-t border-[#E2E5E9] bg-[#F8F9FA] p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1E2227] flex items-center gap-2 font-mono uppercase">
                  <RotateCcw className="w-4 h-4 text-[#D95A11]" />
                  <span>STEP 6: CLINICAL REASSESSMENT CONTROLLER</span>
                </div>
                <p className="text-xs text-[#5A6068] max-w-md">
                  Once procedural countermeasures are complete, trigger autonomous reassessment to verify physiological recovery and log delta improvements.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAssessments}
                  className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#1E2227] text-xs font-bold border border-[#E2E5E9] transition-colors cursor-pointer"
                >
                  Run PVT Test
                </button>

                <button
                  onClick={() => onExecuteReassessment(activeAlert.id)}
                  disabled={!allStepsCompleted && activeAlert?.status !== 'in_progress'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    allStepsCompleted || activeAlert?.status === 'in_progress'
                      ? 'bg-[#D95A11] hover:bg-[#B84807] text-white'
                      : 'bg-[#E5E7EB] text-[#8C939E] cursor-not-allowed border border-[#D1D5DB]'
                  }`}
                  title={
                    allStepsCompleted
                      ? 'Advance simulated time and record reassessment'
                      : 'Complete checklist steps first'
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Reassessment (+4h)</span>
                </button>
              </div>
            </div>

            {/* Reassessment Delta Audit Results if present */}
            {activeAlert?.reassessmentDeltaSummary && (
              <div className="p-4 rounded-xl bg-[#2E7D32]/8 border border-[#2E7D32]/25 text-[#1E2227] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2E7D32] font-mono uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>REASSESSMENT AUDIT RESULTS & TELEMETRY DELTA</span>
                </div>
                <p className="text-xs leading-relaxed text-[#1E2227]">
                  {activeAlert.reassessmentDeltaSummary}
                </p>
                <div className="text-[11px] font-mono text-[#5A6068] pt-1 border-t border-[#2E7D32]/20">
                  Logged in Flight Surgeon Telemetry Archive • Dr. Elena Rostova
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
