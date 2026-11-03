import React from 'react';
import {
  Radio,
  Clock,
  FastForward,
  RotateCcw,
  User,
  Activity,
  Layers,
  HeartPulse,
  ClipboardList,
  Cpu,
  Sparkles,
  Compass,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { MissionContext, MissionScenarioId, DisplayMode } from '../types/health';
import { MISSION_SCENARIOS } from '../data/scenarioData';
import { avionicsAudio } from '../utils/audioFeedback';

interface HeaderMissionBarProps {
  missionContext: MissionContext;
  activeTab: 'overview' | 'analytics' | 'protocols' | 'assessments' | 'sensors' | 'consult';
  setActiveTab: (tab: 'overview' | 'analytics' | 'protocols' | 'assessments' | 'sensors' | 'consult') => void;
  onSelectScenario: (scenarioId: MissionScenarioId) => void;
  onAdvanceTime: (hours: number) => void;
  onResetSimulation: () => void;
  activeAlertCount: number;
  criticalAlertCount: number;
  displayMode: DisplayMode;
  onToggleDisplayMode: (mode: DisplayMode) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onAcknowledgeAlarm?: () => void;
  onOpenHotkeys?: () => void;
  onOpenSymptomLog?: () => void;
}

export const HeaderMissionBar: React.FC<HeaderMissionBarProps> = ({
  missionContext,
  activeTab,
  setActiveTab,
  onSelectScenario,
  onAdvanceTime,
  onResetSimulation,
  activeAlertCount,
  criticalAlertCount,
  displayMode,
  onToggleDisplayMode,
  isAudioMuted,
  onToggleAudio,
  onAcknowledgeAlarm,
  onOpenHotkeys,
  onOpenSymptomLog,
}) => {
  return (
    <header className="border-b border-[#E2E5E9] bg-[#FFFFFF] text-[#1E2227] sticky top-0 z-40 select-none shadow-xs shrink-0">
      {/* 1. Mission Command & Simulation Bar (Dark Aerospace Strip) */}
      <div className="bg-[#1A1D20] text-[#F3F4F6] px-3 sm:px-4 py-1.5 border-b border-[#111316]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 font-sans">
          {/* Left: VIGIL Identity + Mission Context + MET */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D95A11]" />
              <span className="font-extrabold tracking-widest text-xs uppercase text-[#F97316]">VIGIL</span>
              <span className="text-slate-600 font-light text-xs">|</span>
              <span className="font-bold text-xs text-white tracking-wide">{missionContext.missionName}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="font-mono font-medium">{missionContext.missionDayMET}</span>
              {missionContext.simulatedTimeOffsetHours > 0 && (
                <span className="text-[#F97316] font-mono text-[11px] font-bold bg-[#D95A11]/20 px-1.5 py-0.2 rounded border border-[#D95A11]/40">
                  +{missionContext.simulatedTimeOffsetHours}h sim
                </span>
              )}
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-[#9CA3AF] text-xs border-l border-slate-700 pl-2.5">
              <Radio className="w-3.5 h-3.5 text-[#F97316]" />
              <span className="text-[#9CA3AF]">Delay:</span>
              <span className="font-mono text-white font-medium">14m 22s</span>
              <span className="text-[10px] bg-[#2A3038] text-[#F97316] px-1.5 py-0.5 rounded font-semibold border border-[#3E454F]">
                Autonomous
              </span>
            </div>
          </div>

          {/* Right: Simulation Controls, Display Modes, Audio & Crew Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Master Caution & Warning Acknowledge Button if alert active */}
            {activeAlertCount > 0 && onAcknowledgeAlarm && (
              <button
                onClick={() => {
                  avionicsAudio.playClick();
                  onAcknowledgeAlarm();
                }}
                className="bg-[#C62828] hover:bg-[#B71C1C] ring-2 ring-[#EF4444]/60 text-white px-2.5 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Master Caution & Warning (C&W) Acknowledge (Hotkey: A or Esc)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ACK C&W</span>
              </button>
            )}

            {/* Spacecraft Lighting Environment Modes (Daylight / Night Cockpit / High Glare) */}
            <div className="flex items-center bg-[#252A30] border border-[#3A424C] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => {
                  avionicsAudio.playClick();
                  onToggleDisplayMode('daylight');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  displayMode === 'daylight'
                    ? 'bg-[#313740] text-[#F97316] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Daylight Operations Mode (Clean white aerospace theme)"
              >
                <Sun className="w-3 h-3" />
                <span className="hidden sm:inline">Day</span>
              </button>

              <button
                onClick={() => {
                  avionicsAudio.playClick();
                  onToggleDisplayMode('night');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  displayMode === 'night'
                    ? 'bg-[#313740] text-[#F97316] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Night / Rest Cycle Mode (Dark adaptation & red-shield preservation)"
              >
                <Moon className="w-3 h-3" />
                <span className="hidden sm:inline">Night</span>
              </button>

              <button
                onClick={() => {
                  avionicsAudio.playClick();
                  onToggleDisplayMode('glare');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  displayMode === 'glare'
                    ? 'bg-[#313740] text-[#F97316] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="High Glare Solar Mode (Max contrast for cupola flight deck illumination)"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span className="hidden sm:inline">Glare</span>
              </button>
            </div>

            {/* Avionics Audio Mute / Unmute Toggle */}
            <button
              onClick={() => {
                onToggleAudio();
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isAudioMuted
                  ? 'bg-[#252A30] border-[#3A424C] text-slate-400 hover:text-white'
                  : 'bg-[#252A30] border-[#D95A11]/50 text-[#F97316]'
              }`}
              title={isAudioMuted ? 'Telemetry Chimes: MUTED (Hotkey: M)' : 'Telemetry Chimes: ACTIVE (Hotkey: M)'}
              aria-label="Toggle telemetry sound"
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Hotkeys helper button */}
            {onOpenHotkeys && (
              <button
                onClick={() => {
                  avionicsAudio.playClick();
                  onOpenHotkeys();
                }}
                className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#252A30] border border-[#3A424C] text-slate-300 hover:text-white text-[11px] font-mono cursor-pointer transition-colors"
                title="Astronaut Flight Deck Keyboard Shortcuts (Hotkey: ?)"
              >
                <Keyboard className="w-3 h-3 text-[#F97316]" />
                <span>Keys [?]</span>
              </button>
            )}

            {/* Simulation Scenario Controls */}
            <div className="flex items-center gap-1.5 bg-[#252A30] border border-[#3A424C] px-2 py-0.5 rounded-lg text-xs">
              <Compass className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
              <select
                value={missionContext.currentScenario}
                onChange={(e) => {
                  avionicsAudio.playClick();
                  onSelectScenario(e.target.value as MissionScenarioId);
                }}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[210px] truncate"
                aria-label="Mission Simulation Scenario"
              >
                {MISSION_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-[#1A1D20] text-white">
                    {sc.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5">
                <button
                  onClick={() => {
                    avionicsAudio.playClick();
                    onAdvanceTime(4);
                  }}
                  className="px-1.5 py-0.5 rounded bg-[#313740] hover:bg-[#3D4550] text-[#F97316] hover:text-white font-mono text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                  title="Fast forward mission time +4 hours"
                >
                  <FastForward className="w-3 h-3" />
                  <span>+4h</span>
                </button>

                <button
                  onClick={() => {
                    avionicsAudio.playClick();
                    onAdvanceTime(12);
                  }}
                  className="px-1.5 py-0.5 rounded bg-[#313740] hover:bg-[#3D4550] text-[#F97316] hover:text-white font-mono text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                  title="Fast forward mission time +12 hours"
                >
                  <FastForward className="w-3 h-3" />
                  <span>+12h</span>
                </button>

                <button
                  onClick={() => {
                    avionicsAudio.playClick();
                    onResetSimulation();
                  }}
                  className="p-1 rounded bg-[#313740] hover:bg-[#3D4550] text-[#9CA3AF] hover:text-[#EF4444] transition-colors cursor-pointer"
                  title="Reset simulation to initial state"
                  aria-label="Reset simulation"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Crew Member Profile Pill */}
            <div className="hidden lg:flex items-center gap-1.5 bg-[#252A30] border border-[#3A424C] px-2.5 py-1 rounded-lg text-xs text-white">
              <User className="w-3.5 h-3.5 text-[#388E3C]" />
              <span className="font-semibold">{missionContext.crewMember.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 w-full">
          <button
            onClick={() => {
              avionicsAudio.playClick();
              setActiveTab('overview');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#1E2227] text-white shadow-xs'
                : 'text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D95A11]" />
            <span>Operations HUD</span>
            {criticalAlertCount > 0 ? (
              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-[#C62828] text-white font-mono text-[10px] font-bold">
                {criticalAlertCount}
              </span>
            ) : activeAlertCount > 0 ? (
              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-[#D95A11] text-white font-mono text-[10px] font-bold">
                {activeAlertCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => {
              avionicsAudio.playClick();
              setActiveTab('analytics');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-[#1E2227] text-white shadow-xs'
                : 'text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6]'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Deep Telemetry</span>
          </button>

          <button
            onClick={() => {
              avionicsAudio.playClick();
              setActiveTab('protocols');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'protocols'
                ? 'bg-[#1E2227] text-white shadow-xs'
                : 'text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6]'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Decision Support</span>
            {activeAlertCount > 0 && (
              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded bg-[#D95A11]/15 text-[#B84807] border border-[#D95A11]/30 text-[10px] font-bold">
                Action ready
              </span>
            )}
          </button>

          <button
            onClick={() => {
              avionicsAudio.playClick();
              setActiveTab('assessments');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'assessments'
                ? 'bg-[#1E2227] text-white shadow-xs'
                : 'text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Assessments</span>
          </button>

          <button
            onClick={() => {
              avionicsAudio.playClick();
              setActiveTab('sensors');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'sensors'
                ? 'bg-[#1E2227] text-white shadow-xs'
                : 'text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Hardware & ECLSS</span>
          </button>

          <button
            onClick={() => {
              avionicsAudio.playClick();
              setActiveTab('consult');
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
              activeTab === 'consult'
                ? 'bg-[#1E2227] text-white shadow-xs'
                : 'text-[#5A6068] hover:text-[#1E2227] hover:bg-[#F3F4F6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D95A11]" />
            <span>Flight Surgeon</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
