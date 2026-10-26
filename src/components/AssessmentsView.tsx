import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Activity,
  FileCheck,
  Zap,
} from 'lucide-react';
import { PvtTrial, PvtAssessmentResult, DailySymptomReport } from '../types/health';
import { calculatePvtMetrics } from '../utils/mathAndBaselines';

interface AssessmentsViewProps {
  onCommitPvtResult: (result: PvtAssessmentResult) => void;
  onCommitSymptomReport: (report: DailySymptomReport) => void;
  onCommitManualMeasurement: (metricId: string, value: number) => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  onCommitPvtResult,
  onCommitSymptomReport,
  onCommitManualMeasurement,
}) => {
  const [activeTab, setActiveTab] = useState<'pvt' | 'symptoms' | 'manual'>('pvt');

  // --- PVT STATE ---
  const [pvtState, setPvtState] = useState<'idle' | 'waiting' | 'running' | 'trial_done' | 'test_complete'>('idle');
  const [currentTrialNumber, setCurrentTrialNumber] = useState<number>(1);
  const [trials, setTrials] = useState<PvtTrial[]>([]);
  const [displayTimerMs, setDisplayTimerMs] = useState<number>(0);
  const [lastTrialFeedback, setLastTrialFeedback] = useState<string>('');
  const [pvtResult, setPvtResult] = useState<PvtAssessmentResult | null>(null);

  const timerStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_TRIALS = 5;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startNextTrial = (trialIndex: number) => {
    setPvtState('waiting');
    setDisplayTimerMs(0);
    setLastTrialFeedback('STAND BY FOR VISUAL STIMULUS...');

    // Random delay between 1800ms and 4200ms
    const randomDelay = Math.floor(Math.random() * 2400) + 1800;

    timeoutRef.current = setTimeout(() => {
      timerStartRef.current = performance.now();
      setPvtState('running');
      setLastTrialFeedback('');

      const updateClock = () => {
        const elapsed = Math.round(performance.now() - timerStartRef.current);
        setDisplayTimerMs(elapsed);
        animationFrameRef.current = requestAnimationFrame(updateClock);
      };
      animationFrameRef.current = requestAnimationFrame(updateClock);
    }, randomDelay);
  };

  const startPvtTest = () => {
    setTrials([]);
    setCurrentTrialNumber(1);
    setPvtResult(null);
    startNextTrial(1);
  };

  const handlePvtStrike = () => {
    if (pvtState === 'waiting') {
      // False start!
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const newTrial: PvtTrial = {
        trialNumber: currentTrialNumber,
        delayMs: 0,
        reactionTimeMs: 0,
        isFalseStart: true,
        isLapse: false,
      };
      const updatedTrials = [...trials, newTrial];
      setTrials(updatedTrials);
      setLastTrialFeedback('FALSE START: Pressed before counter appeared!');
      setPvtState('trial_done');

      setTimeout(() => {
        if (currentTrialNumber >= TOTAL_TRIALS) {
          completePvtTest(updatedTrials);
        } else {
          setCurrentTrialNumber((prev) => prev + 1);
          startNextTrial(currentTrialNumber + 1);
        }
      }, 1200);
      return;
    }

    if (pvtState === 'running') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      const reactionTime = Math.round(performance.now() - timerStartRef.current);
      setDisplayTimerMs(reactionTime);

      const isLapse = reactionTime >= 500;
      const newTrial: PvtTrial = {
        trialNumber: currentTrialNumber,
        delayMs: 0,
        reactionTimeMs: reactionTime,
        isFalseStart: false,
        isLapse,
      };

      const updatedTrials = [...trials, newTrial];
      setTrials(updatedTrials);
      setLastTrialFeedback(isLapse ? `LAPSE DETECTED: ${reactionTime} ms (>500ms)` : `Recorded: ${reactionTime} ms`);
      setPvtState('trial_done');

      setTimeout(() => {
        if (currentTrialNumber >= TOTAL_TRIALS) {
          completePvtTest(updatedTrials);
        } else {
          setCurrentTrialNumber((prev) => prev + 1);
          startNextTrial(currentTrialNumber + 1);
        }
      }, 1000);
    }
  };

  const completePvtTest = (finalTrials: PvtTrial[]) => {
    setPvtState('test_complete');
    const result = calculatePvtMetrics(finalTrials);
    setPvtResult(result);
  };

  // Keyboard spacebar listener for PVT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (pvtState === 'running' || pvtState === 'waiting')) {
        e.preventDefault();
        handlePvtStrike();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pvtState, trials, currentTrialNumber]);

  // --- SYMPTOM SURVEY STATE ---
  const [headPressure, setHeadPressure] = useState<number>(2);
  const [visualBlurring, setVisualBlurring] = useState<boolean>(false);
  const [motionSickness, setMotionSickness] = useState<number>(1);
  const [sinusCongestion, setSinusCongestion] = useState<boolean>(true);
  const [fatigueScore, setFatigueScore] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [symptomNotes, setSymptomNotes] = useState<string>('');
  const [symptomSaved, setSymptomSaved] = useState<boolean>(false);

  const handleSaveSymptoms = (e: React.FormEvent) => {
    e.preventDefault();
    onCommitSymptomReport({
      timestamp: new Date().toISOString(),
      headPressureScore: headPressure,
      visualBlurringOrScotoma: visualBlurring,
      motionSicknessScore: motionSickness,
      sinusCongestion,
      generalFatigueScore: fatigueScore,
      sleepSubjectiveQuality: sleepQuality,
      moodConfinementStress: 2,
      notes: symptomNotes,
    });
    setSymptomSaved(true);
    setTimeout(() => setSymptomSaved(false), 3000);
  };

  // --- MANUAL MEASUREMENT ENTRY STATE ---
  const [manualBpSys, setManualBpSys] = useState<string>('118');
  const [manualUsg, setManualUsg] = useState<string>('1.018');
  const [manualLactate, setManualLactate] = useState<string>('1.4');
  const [manualSaved, setManualSaved] = useState<boolean>(false);

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBpSys) onCommitManualMeasurement('bp_systolic', parseFloat(manualBpSys));
    if (manualUsg) onCommitManualMeasurement('hydration_usg', parseFloat(manualUsg));
    setManualSaved(true);
    setTimeout(() => setManualSaved(false), 3000);
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      {/* 1. Header & Assessment Mode Selector */}
      <div className="bg-[#FAF8F4] border border-[#D6CEC2] p-4 sm:p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#C96E2E]" />
            <h1 className="text-base font-bold text-[#26231F]">
              Interactive Self-Assessments & Diagnostic Bay
            </h1>
          </div>
          <p className="text-xs text-[#6B655E]">
            Gathers active astronaut data feeding directly into longitudinal telemetry and alerts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-[#ECE7DE] p-1 rounded-lg border border-[#D6CEC2] text-xs font-medium">
          <button
            onClick={() => setActiveTab('pvt')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pvt'
                ? 'bg-[#2E3235] text-white font-bold shadow-xs'
                : 'text-[#6B655E] hover:text-[#26231F]'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>PVT Reaction Task</span>
          </button>

          <button
            onClick={() => setActiveTab('symptoms')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'symptoms'
                ? 'bg-[#2E3235] text-white font-bold shadow-xs'
                : 'text-[#6B655E] hover:text-[#26231F]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Daily SANS & Symptoms</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#2E3235] text-white font-bold shadow-xs'
                : 'text-[#6B655E] hover:text-[#26231F]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Manual Lab Entry</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PSYCHOMOTOR VIGILANCE TASK (PVT) */}
      {activeTab === 'pvt' && (
        <div className="bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-5 sm:p-6 shadow-xs space-y-5">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#26231F] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C96E2E]" />
                  <span>NASA Psychomotor Vigilance Task (PVT-10)</span>
                </h2>
                <p className="text-xs text-[#6B655E] mt-0.5">
                  Millisecond sustained attention test. Strike the target button or press <strong>SPACEBAR</strong> as soon as the digital counter begins.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#ECE7DE] border border-[#D6CEC2] text-[#26231F]">
                Trial {Math.min(currentTrialNumber, TOTAL_TRIALS)} of {TOTAL_TRIALS}
              </span>
            </div>

            {/* PVT Interactive Surface */}
            <div
              className={`rounded-2xl border p-8 flex flex-col items-center justify-center min-h-[260px] text-center transition-all select-none ${
                pvtState === 'running'
                  ? 'bg-[#A95522]/10 border-[#C96E2E] shadow-sm'
                  : pvtState === 'waiting'
                  ? 'bg-[#ECE7DE] border-[#D6CEC2]'
                  : pvtState === 'trial_done'
                  ? 'bg-[#FAF8F4] border-[#D6CEC2]'
                  : 'bg-[#FAF8F4] border-[#D6CEC2]'
              }`}
            >
              {pvtState === 'idle' && (
                <div className="space-y-4">
                  <div className="text-[#6B655E] text-xs max-w-sm mx-auto">
                    A randomized millisecond timer will start. As soon as the numbers start rolling, click the button or strike the Spacebar immediately.
                  </div>
                  <button
                    onClick={startPvtTest}
                    className="px-6 py-3 rounded-xl bg-[#C96E2E] hover:bg-[#A95522] text-white font-bold text-sm shadow-xs transition-all flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>BEGIN PVT SESSION</span>
                  </button>
                </div>
              )}

              {pvtState === 'waiting' && (
                <div className="space-y-3 cursor-pointer w-full py-6" onClick={handlePvtStrike}>
                  <div className="w-3 h-3 rounded-full bg-[#C96E2E] animate-ping mx-auto" />
                  <div className="text-sm font-bold text-[#26231F] tracking-wide">
                    STAND BY... WAIT FOR STIMULUS
                  </div>
                  <div className="text-xs text-[#6B655E]">
                    Do not strike early (false start penalty)
                  </div>
                </div>
              )}

              {pvtState === 'running' && (
                <button
                  onClick={handlePvtStrike}
                  className="w-full py-8 space-y-2 cursor-pointer focus:outline-none"
                  aria-label="Strike target"
                >
                  <div className="text-5xl font-mono font-extrabold text-[#C96E2E] tracking-tight">
                    {displayTimerMs} <span className="text-xl font-normal text-[#6B655E]">ms</span>
                  </div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider bg-[#C96E2E] px-4 py-1.5 rounded-full inline-block shadow-xs">
                    STRIKE NOW / SPACEBAR!
                  </div>
                </button>
              )}

              {pvtState === 'trial_done' && (
                <div className="space-y-2">
                  <div className="text-3xl font-mono font-bold text-[#26231F]">
                    {displayTimerMs} ms
                  </div>
                  <div className="text-xs font-medium text-[#C96E2E]">
                    {lastTrialFeedback}
                  </div>
                </div>
              )}

              {pvtState === 'test_complete' && pvtResult && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-center gap-2 text-[#4F7A5A] font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>PVT ASSESSMENT COMPLETED</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left font-mono text-xs">
                    <div className="p-2.5 rounded bg-[#ECE7DE] border border-[#D6CEC2]">
                      <span className="text-[#6B655E] text-[10px] block">Mean RT:</span>
                      <span className="text-[#26231F] font-bold text-base">{pvtResult.meanReactionTimeMs} ms</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#ECE7DE] border border-[#D6CEC2]">
                      <span className="text-[#6B655E] text-[10px] block">Median RT:</span>
                      <span className="text-[#26231F] font-bold text-base">{pvtResult.medianReactionTimeMs} ms</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#ECE7DE] border border-[#D6CEC2]">
                      <span className="text-[#6B655E] text-[10px] block">Lapses (&gt;500ms):</span>
                      <span className={`font-bold text-base ${pvtResult.lapseCount > 0 ? 'text-[#B54B3A]' : 'text-[#4F7A5A]'}`}>
                        {pvtResult.lapseCount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-[#ECE7DE] border border-[#D6CEC2]">
                      <span className="text-[#6B655E] text-[10px] block">Cognitive Score:</span>
                      <span className="text-[#C96E2E] font-bold text-base">{pvtResult.cognitiveReadinessScore} / 100</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={startPvtTest}
                      className="px-4 py-2 rounded-lg bg-[#ECE7DE] hover:bg-[#E2DBCF] text-[#26231F] text-xs font-semibold border border-[#D6CEC2] transition-colors cursor-pointer"
                    >
                      Retest Session
                    </button>
                    <button
                      onClick={() => onCommitPvtResult(pvtResult)}
                      className="px-5 py-2 rounded-lg bg-[#C96E2E] hover:bg-[#A95522] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      Commit to Telemetry
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Trial Series Strip */}
            {trials.length > 0 && (
              <div className="p-3 rounded-lg bg-[#ECE7DE] border border-[#D6CEC2] flex items-center justify-between text-xs font-mono">
                <span className="text-[#6B655E]">Trial History:</span>
                <div className="flex items-center gap-2">
                  {trials.map((t, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        t.isFalseStart
                          ? 'bg-[#B54B3A]/15 text-[#B54B3A] border border-[#B54B3A]/30'
                          : t.isLapse
                          ? 'bg-[#D89A3D]/20 text-[#A95522] border border-[#D89A3D]/40'
                          : 'bg-[#FAF8F4] text-[#26231F] border border-[#D6CEC2]'
                      }`}
                    >
                      T{i + 1}: {t.isFalseStart ? 'FS' : `${t.reactionTimeMs}ms`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DAILY SANS & SYMPTOMS SURVEY */}
      {activeTab === 'symptoms' && (
        <div className="bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-5 sm:p-6 shadow-xs">
          <form onSubmit={handleSaveSymptoms} className="max-w-2xl mx-auto space-y-5">
            <div className="border-b border-[#ECE7DE] pb-3">
              <h2 className="text-base font-bold text-[#26231F] flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#C96E2E]" />
                <span>Daily SANS, Neuro-Vestibular & Wellbeing Log</span>
              </h2>
              <p className="text-xs text-[#6B655E] mt-0.5">
                Screening for Spaceflight-Associated Neuro-ocular Syndrome (SANS), cephalad fluid shifts, and microgravity adaptation.
              </p>
            </div>

            {/* Cephalic Head Pressure Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#26231F] font-semibold">Head Pressure / Frontal Headache (0 - 10):</label>
                <span className="text-[#C96E2E] font-bold font-mono">{headPressure} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={headPressure}
                onChange={(e) => setHeadPressure(parseInt(e.target.value))}
                className="w-full accent-[#C96E2E] cursor-pointer"
              />
              <span className="text-[11px] text-[#6B655E]">0 = None, 10 = Incapacitating intracranial hypertension</span>
            </div>

            {/* SANS Visual Blurring Checkbox */}
            <div className="p-3 rounded-lg bg-[#ECE7DE] border border-[#D6CEC2] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#26231F]">
                  Visual Acuity Deficit / Hyperopic Shift / Scotoma
                </div>
                <div className="text-[11px] text-[#6B655E]">
                  Key symptom of SANS (optic disc edema & posterior globe flattening)
                </div>
              </div>
              <input
                type="checkbox"
                checked={visualBlurring}
                onChange={(e) => setVisualBlurring(e.target.checked)}
                className="w-4 h-4 accent-[#C96E2E] cursor-pointer"
              />
            </div>

            {/* Space Motion Sickness (SMS) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#26231F] font-semibold">Space Motion Sickness / Vestibular Disorientation (0 - 10):</label>
                <span className="text-[#C96E2E] font-bold font-mono">{motionSickness} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={motionSickness}
                onChange={(e) => setMotionSickness(parseInt(e.target.value))}
                className="w-full accent-[#C96E2E] cursor-pointer"
              />
            </div>

            {/* Cephalad Sinus Congestion */}
            <div className="p-3 rounded-lg bg-[#ECE7DE] border border-[#D6CEC2] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#26231F]">
                  Nasal Mucosal Congestion / Cephalad Fluid Engorgement
                </div>
                <div className="text-[11px] text-[#6B655E]">
                  Typical facial edema caused by loss of hydrostatic downward gradient
                </div>
              </div>
              <input
                type="checkbox"
                checked={sinusCongestion}
                onChange={(e) => setSinusCongestion(e.target.checked)}
                className="w-4 h-4 accent-[#C96E2E] cursor-pointer"
              />
            </div>

            {/* Samn-Perelli Fatigue Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-[#26231F] font-semibold">Samn-Perelli Fatigue Score (1 - 7):</label>
                <span className="text-[#C96E2E] font-bold font-mono">Level {fatigueScore}</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={fatigueScore}
                onChange={(e) => setFatigueScore(parseInt(e.target.value))}
                className="w-full accent-[#C96E2E] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#6B655E]">
                <span>1 = Fully alert</span>
                <span>4 = Moderately tired</span>
                <span>7 = Completely exhausted</span>
              </div>
            </div>

            {/* Subjective Notes */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#26231F] font-semibold block">
                Astronaut Notes / Mission Activity Context:
              </label>
              <textarea
                rows={2}
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder="e.g. Mild headache following 2.5-hour ARED session, ventilation duct felt stagnant during sleep..."
                className="w-full bg-[#FAF8F4] border border-[#D6CEC2] rounded-lg p-2.5 text-xs text-[#26231F] placeholder-[#A69E93] focus:outline-none focus:border-[#C96E2E] font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {symptomSaved ? (
                <span className="text-xs text-[#4F7A5A] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Symptom survey logged into medical archive.</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#C96E2E] hover:bg-[#A95522] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Daily Check-in
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MANUAL DIAGNOSTIC LAB ENTRY */}
      {activeTab === 'manual' && (
        <div className="bg-[#FAF8F4] rounded-xl border border-[#D6CEC2] p-5 sm:p-6 shadow-xs">
          <form onSubmit={handleSaveManual} className="max-w-2xl mx-auto space-y-5">
            <div className="border-b border-[#ECE7DE] pb-3">
              <h2 className="text-base font-bold text-[#26231F] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C96E2E]" />
                <span>Manual Diagnostic & Lab Telemetry Entry</span>
              </h2>
              <p className="text-xs text-[#6B655E] mt-0.5">
                Record periodic non-continuous measurements (cuff tonometry, i-STAT cartridges, urine refractometer).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#26231F] font-semibold block">
                  Manual Blood Pressure (Systolic mmHg):
                </label>
                <input
                  type="number"
                  value={manualBpSys}
                  onChange={(e) => setManualBpSys(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#D6CEC2] rounded-lg p-2.5 text-xs text-[#26231F] font-mono focus:outline-none focus:border-[#C96E2E]"
                />
                <span className="text-[11px] text-[#6B655E]">Baseline norm: 116 ± 5 mmHg</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#26231F] font-semibold block">
                  Urine Specific Gravity (Hydration USG):
                </label>
                <input
                  type="text"
                  value={manualUsg}
                  onChange={(e) => setManualUsg(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#D6CEC2] rounded-lg p-2.5 text-xs text-[#26231F] font-mono focus:outline-none focus:border-[#C96E2E]"
                />
                <span className="text-[11px] text-[#6B655E]">Baseline norm: 1.016 (Acceptable: &lt;1.025)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              {manualSaved ? (
                <span className="text-xs text-[#4F7A5A] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Manual lab readings updated in system telemetry!</span>
                </span>
              ) : <span />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#C96E2E] hover:bg-[#A95522] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Submit Lab Telemetry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
