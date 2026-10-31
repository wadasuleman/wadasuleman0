import React from 'react';
import { ResourceState, TelemetryHistoryPoint } from '../types/simulation';
import { Wind, Droplets, Zap, Shield, Sprout, Heart, Play, Pause, StepForward, Clock, HelpCircle, Info, Keyboard } from 'lucide-react';
import { sound } from '../utils/audio';
import { HelpResourceId } from './ResourceHelpModal';
import { SparklineChart } from './SparklineChart';

interface ResourceTelemetryCardsProps {
  state: ResourceState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepHour: () => void;
  onStepSol: () => void;
  targetDurationHours: number;
  onSelectHelpResource: (resourceId: HelpResourceId) => void;
  isHelpOverlayActive: boolean;
  onToggleHelpOverlay: () => void;
  telemetryHistory?: TelemetryHistoryPoint[];
}

export const ResourceTelemetryCards: React.FC<ResourceTelemetryCardsProps> = ({
  state,
  isPlaying,
  onTogglePlay,
  onStepHour,
  onStepSol,
  targetDurationHours,
  onSelectHelpResource,
  isHelpOverlayActive,
  onToggleHelpOverlay,
  telemetryHistory
}) => {
  const netPower = Number((state.powerKwGenerated - state.powerKwConsumed).toFixed(2));
  const oxygenHoursRemaining = Math.max(0, Math.floor(state.oxygenKg / (state.oxygenConsumptionRateKgPerHour || 0.14)));
  const batteryPercent = Math.min(100, Math.round((state.batteryStorageKwh / state.batteryCapacityKwh) * 100));
  const missionProgressPercent = Math.min(100, Math.round((state.totalElapsedHours / targetDurationHours) * 100));

  // Child-friendly trend statements based on actual telemetry
  const oxygenTrendDiff = Number((state.oxygenProductionRateKgPerHour - state.oxygenConsumptionRateKgPerHour).toFixed(3));
  const oxygenTrendExplanation = oxygenTrendDiff >= 0
    ? 'Your oxygen level is steady and producing a positive surplus.'
    : `Your oxygen reserve is decreasing (${oxygenTrendDiff} kg/h).`;

  const waterTrendDiff = Number((state.waterProductionRateLitersPerHour - state.waterConsumptionRateLitersPerHour).toFixed(2));
  const waterTrendExplanation = waterTrendDiff >= 0
    ? 'Closed-loop water recycling is steady and replenishing storage.'
    : `Water reserves are slowly decreasing (${waterTrendDiff} L/h).`;

  const powerTrendExplanation = netPower > 0
    ? `Your battery level is charging (+${netPower} kW/h).`
    : netPower < 0
    ? `Your battery level is decreasing (${netPower} kW/h).`
    : 'Your battery storage level is balanced.';

  const foodTrendExplanation = 'Rations are being consumed steadily by your 4 crew members.';

  return (
    <div className="space-y-4">
      {/* Time & Mission Progress Ribbon */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Mission Clock</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-base font-bold font-mono text-white">
                Sol {state.missionSol} · {String(state.missionHour).padStart(2, '0')}:00
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{state.totalElapsedHours}h elapsed of {targetDurationHours}h</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400">{missionProgressPercent}% Complete</span>
            </div>
          </div>
        </div>

        {/* Time Progress Bar */}
        <div className="w-full md:w-64">
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${missionProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Simulation Control Deck */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Help Overlay Feature Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleHelpOverlay();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
              isHelpOverlayActive
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 ring-2 ring-cyan-400/40 shadow-sm shadow-cyan-950'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
            }`}
            title="Toggle contextual help guidance on resource cards"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isHelpOverlayActive ? 'Help Active' : 'Telemetry Help'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onTogglePlay();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Sim</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Sim (1 hr/s)</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onStepHour();
            }}
            title="Step simulation 1 hour forward"
            className="flex items-center gap-1 px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>+1 Hour</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onStepSol();
            }}
            title="Advance 1 full Sol (24 hours)"
            className="flex items-center gap-1 px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>+1 Sol</span>
          </button>
        </div>
      </div>

      {/* Contextual Help Banner with Keyboard Shortcuts when active */}
      {isHelpOverlayActive && (
        <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3.5 space-y-2.5 text-xs text-cyan-200 animate-in fade-in duration-200 shadow-lg shadow-cyan-950/20">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Telemetry Help Overlay Active:</strong> Click any resource card below (Oxygen, Water, Power, Shield, Food, Crew) to inspect its physics and see how your engineering settings shape it!
              </span>
            </div>
            <button
              onClick={onToggleHelpOverlay}
              className="text-[11px] font-mono text-cyan-300 hover:text-white underline whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>

          {/* Keyboard Shortcuts guide */}
          <div className="pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-cyan-100">Keyboard Shortcuts:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded-md text-[11px]">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-cyan-300 font-mono text-[10px] font-bold shadow-sm">
                  SPACE
                </kbd>
                <span className="text-slate-300">— Pause / Resume</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 rounded-md text-[11px]">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-cyan-300 font-mono text-[10px] font-bold shadow-sm">
                  S
                </kbd>
                <span className="text-slate-300">— Advance One Sol</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6 Core Resource Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Oxygen & Atmosphere */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            sound.playClick();
            onSelectHelpResource('oxygen');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sound.playClick();
              onSelectHelpResource('oxygen');
            }
          }}
          className={`bg-[#0B132B]/80 border rounded-xl p-4 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHelpOverlayActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40 bg-[#0B132B]'
              : 'border-slate-800 hover:border-cyan-400/50 hover:bg-[#0E1736]'
          }`}
          title="Click to view Oxygen simulation physics and settings guide"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:border-cyan-400/60 transition-colors">
                <Wind className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Oxygen Supply
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-emerald-400">
                {state.oxygenKg > 25 ? '● Nominal' : '▲ Low Reserve'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                ?
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {state.oxygenKg.toFixed(1)} <span className="text-xs font-mono text-slate-400">kg</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              ~{oxygenHoursRemaining}h remaining
            </div>
          </div>

          {/* Progress gauge */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                state.oxygenKg > 40 ? 'bg-blue-400' : state.oxygenKg > 20 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (state.oxygenKg / state.oxygenCapacityKg) * 100)}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>+{state.oxygenProductionRateKgPerHour} kg/h generated</span>
            <span>-{state.oxygenConsumptionRateKgPerHour} kg/h crew</span>
          </div>

          {/* Historical Telemetry Mini-Chart */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>Telemetry (Past 24h)</span>
              <span className={oxygenTrendDiff >= 0 ? "text-cyan-400" : "text-amber-400"}>
                {oxygenTrendDiff >= 0 ? "● Stable" : "▼ Draining"}
              </span>
            </div>
            <SparklineChart
              data={telemetryHistory?.map(p => p.oxygenKg) || [state.oxygenKg]}
              strokeColor="#60a5fa"
              fillColor="rgba(96, 165, 250, 0.12)"
              height={32}
              unit=" kg"
              showMinMax={false}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              {oxygenTrendExplanation}
            </p>
          </div>
        </div>

        {/* Card 2: Closed-Loop Water */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            sound.playClick();
            onSelectHelpResource('water');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sound.playClick();
              onSelectHelpResource('water');
            }
          }}
          className={`bg-[#0B132B]/80 border rounded-xl p-4 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHelpOverlayActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40 bg-[#0B132B]'
              : 'border-slate-800 hover:border-cyan-400/50 hover:bg-[#0E1736]'
          }`}
          title="Click to view Water & ECLSS simulation physics and settings guide"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/60 transition-colors">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Water & ECLSS
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-cyan-400">
                {state.waterRecyclingEfficiencyPercent}% Recovery
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                ?
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {state.waterLiters.toFixed(1)} <span className="text-xs font-mono text-slate-400">L</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Capacity: {state.waterCapacityLiters} L
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                state.waterLiters > 60 ? 'bg-cyan-400' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, (state.waterLiters / state.waterCapacityLiters) * 100)}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>+{state.waterProductionRateLitersPerHour} L/h recycled</span>
            <span>-{state.waterConsumptionRateLitersPerHour} L/h used</span>
          </div>

          {/* Historical Telemetry Mini-Chart */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>Telemetry (Past 24h)</span>
              <span className={waterTrendDiff >= 0 ? "text-cyan-400" : "text-amber-400"}>
                {waterTrendDiff >= 0 ? "● Steady" : "▼ Draining"}
              </span>
            </div>
            <SparklineChart
              data={telemetryHistory?.map(p => p.waterLiters) || [state.waterLiters]}
              strokeColor="#22d3ee"
              fillColor="rgba(34, 211, 238, 0.12)"
              height={32}
              unit=" L"
              showMinMax={false}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              {waterTrendExplanation}
            </p>
          </div>
        </div>

        {/* Card 3: Electrical Power & Battery Bank */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            sound.playClick();
            onSelectHelpResource('power');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sound.playClick();
              onSelectHelpResource('power');
            }
          }}
          className={`bg-[#0B132B]/80 border rounded-xl p-4 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHelpOverlayActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40 bg-[#0B132B]'
              : 'border-slate-800 hover:border-cyan-400/50 hover:bg-[#0E1736]'
          }`}
          title="Click to view Power & Battery simulation physics and settings guide"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-cyan-400/60 transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Electrical Power
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono ${netPower >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {netPower >= 0 ? `+${netPower} kW Net` : `${netPower} kW Drain`}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                ?
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {state.batteryStorageKwh.toFixed(1)} <span className="text-xs font-mono text-slate-400">/ {state.batteryCapacityKwh} kWh</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {batteryPercent}% Bank
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                batteryPercent > 40 ? 'bg-amber-400' : batteryPercent > 15 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${batteryPercent}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Gen: {state.powerKwGenerated} kW</span>
            <span>Load: {state.powerKwConsumed} kW</span>
          </div>

          {/* Historical Telemetry Mini-Chart */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>Telemetry (Past 24h)</span>
              <span className={netPower >= 0 ? "text-emerald-400" : "text-amber-400"}>
                {netPower >= 0 ? "▲ Charging" : "▼ Discharging"}
              </span>
            </div>
            <SparklineChart
              data={telemetryHistory?.map(p => p.batteryKwh) || [state.batteryStorageKwh]}
              strokeColor="#fbbf24"
              fillColor="rgba(251, 191, 36, 0.12)"
              height={32}
              unit=" kWh"
              showMinMax={false}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              {powerTrendExplanation}
            </p>
          </div>
        </div>

        {/* Card 4: Radiation & Regolith Shielding */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            sound.playClick();
            onSelectHelpResource('radiation');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sound.playClick();
              onSelectHelpResource('radiation');
            }
          }}
          className={`bg-[#0B132B]/80 border rounded-xl p-4 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHelpOverlayActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40 bg-[#0B132B]'
              : 'border-slate-800 hover:border-cyan-400/50 hover:bg-[#0E1736]'
          }`}
          title="Click to view Radiation Shielding simulation physics and settings guide"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:border-cyan-400/60 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Radiation Shield
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono ${
                state.radiationStatus === 'nominal' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {state.radiationStatus === 'nominal' ? '● Safe Zone' : '▲ Elevated Flux'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                ?
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {state.radiationShieldIntegrityPercent}% <span className="text-xs font-mono text-slate-400">Shield</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Dose: {state.radiationDoseRateMsvPerHour} mSv/h
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-violet-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${state.radiationShieldIntegrityPercent}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Cumulative: {state.cumulativeDoseMsv} mSv</span>
            <span>Limit: &lt; 25.0 mSv</span>
          </div>
        </div>

        {/* Card 5: Food & Greenhouse Bio-Yield */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            sound.playClick();
            onSelectHelpResource('food');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sound.playClick();
              onSelectHelpResource('food');
            }
          }}
          className={`bg-[#0B132B]/80 border rounded-xl p-4 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHelpOverlayActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40 bg-[#0B132B]'
              : 'border-slate-800 hover:border-cyan-400/50 hover:bg-[#0E1736]'
          }`}
          title="Click to view Food & Greenhouse simulation physics and settings guide"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-cyan-400/60 transition-colors">
                <Sprout className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Food & Greenhouse
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-emerald-400">
                +{state.greenhouseOutputKgPerDay} kg/d crops
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                ?
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {state.foodRationsDays.toFixed(1)} <span className="text-xs font-mono text-slate-400">days</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Freeze-Dried + Greens
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (state.foodRationsDays / 30) * 100)}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Crew Rations: Nominal</span>
            <span>Aeroponic Misting: Active</span>
          </div>

          {/* Historical Telemetry Mini-Chart */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>Telemetry (Past 24h)</span>
              <span className="text-emerald-400">● Stable</span>
            </div>
            <SparklineChart
              data={telemetryHistory?.map(p => p.foodDays) || [state.foodRationsDays]}
              strokeColor="#34d399"
              fillColor="rgba(52, 211, 153, 0.12)"
              height={32}
              unit=" days"
              showMinMax={false}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              {foodTrendExplanation}
            </p>
          </div>
        </div>

        {/* Card 6: Crew Wellbeing & Health */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            sound.playClick();
            onSelectHelpResource('crew');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              sound.playClick();
              onSelectHelpResource('crew');
            }
          }}
          className={`bg-[#0B132B]/80 border rounded-xl p-4 cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isHelpOverlayActive
              ? 'border-cyan-400 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40 bg-[#0B132B]'
              : 'border-slate-800 hover:border-cyan-400/50 hover:bg-[#0E1736]'
          }`}
          title="Click to view Crew Wellbeing & Health simulation physics and settings guide"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:border-cyan-400/60 transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                Crew Wellbeing
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-emerald-400">
                4 Astronauts Active
              </span>
              <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                ?
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-bold font-mono text-white">
              {state.crewHealthPercent.toFixed(0)}% <span className="text-xs font-mono text-slate-400">Health</span>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              {state.crewMoralePercent.toFixed(0)}% Morale
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${state.crewHealthPercent}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Base Integrity: {state.habitatIntegrityPercent}%</span>
            <span>Sleep & Workout: 2.5h/d</span>
          </div>
        </div>
      </div>
    </div>
  );
};
