import React, { useState } from 'react';
import { ResourceState, MissionScenario } from '../types/simulation';
import { Award, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, BookOpen, Star, AlertCircle, FileCheck } from 'lucide-react';
import { sound } from '../utils/audio';
import { MissionCertificateModal } from './MissionCertificateModal';

interface MissionDebriefModalProps {
  scenario: MissionScenario;
  finalState: ResourceState;
  victory: boolean;
  failureReason?: string;
  onRestart: () => void;
  onNextMission: () => void;
  onViewAchievements: () => void;
}

export const MissionDebriefModal: React.FC<MissionDebriefModalProps> = ({
  scenario,
  finalState,
  victory,
  failureReason,
  onRestart,
  onNextMission,
  onViewAchievements
}) => {
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  // Compute thoughtful mission score
  // Rewards: Water recycling, battery surplus, crew health, low cumulative radiation
  let score = 0;
  if (victory) {
    score += 500;
    score += Math.round(finalState.waterRecyclingEfficiencyPercent * 3);
    score += Math.round(finalState.batteryStorageKwh * 2);
    score += Math.round(finalState.crewMoralePercent * 2);
    score += Math.round(finalState.crewHealthPercent * 2);
    score -= Math.round(finalState.cumulativeDoseMsv * 20);
  } else {
    score = Math.max(120, finalState.totalElapsedHours * 25);
  }

  let ratingBadge: string = 'Bronze Rover';
  if (score > 1100) ratingBadge = 'Master of the Artemis Horizon';
  else if (score > 900) ratingBadge = 'Gold Flight Commander';
  else if (score > 600) ratingBadge = 'Silver Lunar Explorer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B132B] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
              victory ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {victory ? '🏆' : '🛰️'}
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Mission Debriefing & Flight Record
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {victory ? 'Mission Successfully Completed!' : 'Simulation Concluded · Flight Review'}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Cadet Score</div>
            <div className="text-xl font-mono font-bold text-cyan-300">{score} pts</div>
          </div>
        </div>

        {/* Failure reason callout if applicable */}
        {!victory && failureReason && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Operational Bottleneck: </strong>
              {failureReason}
            </div>
          </div>
        )}

        {/* Key Metrics Managed */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Sols Commanded</div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              Sol {finalState.missionSol}
            </div>
            <div className="text-[10px] text-slate-400">{finalState.totalElapsedHours} hours logged</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Water Recycled</div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {finalState.waterRecyclingEfficiencyPercent}%
            </div>
            <div className="text-[10px] text-slate-400">{finalState.waterLiters.toFixed(1)} L stored</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Crew Health</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {finalState.crewHealthPercent}%
            </div>
            <div className="text-[10px] text-slate-400">Morale: {finalState.crewMoralePercent}%</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 uppercase">Cadet Rank</div>
            <div className="text-sm font-bold font-mono text-amber-300 mt-1 truncate">
              {ratingBadge}
            </div>
            <div className="text-[10px] text-slate-400">Badge Earned</div>
          </div>
        </div>

        {/* Scientific Concepts Learned */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <BookOpen className="w-4 h-4" />
            <span>Core Scientific Concepts Mastered</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>
              <strong>Closed-Loop Life Support (ECLSS):</strong> You managed the continuous balance between water filtration, exhaled CO2 scrubbing, and oxygen replenishment.
            </li>
            <li>
              <strong>Lunar Energy Management:</strong> You maintained battery reserves across fluctuating sun angles and avoided sudden power depletion.
            </li>
            <li>
              <strong>Passive Regolith Radiation Shielding:</strong> You demonstrated how Moon soil absorbs harmful solar and galactic cosmic rays to protect astronaut biology.
            </li>
          </ul>
        </div>

        {/* Lessons Learned and Feedback for Improvement */}
        <div className="text-xs text-slate-300 bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3.5 leading-relaxed">
          <strong className="text-cyan-300">Commander Flight Note: </strong>
          {victory
            ? 'Outstanding work, Commander! Your calm decision-making kept all vital loops stable. You planned ahead for solar transitions rather than reacting only after alarms sounded.'
            : 'Every test flight teaches valuable engineering lessons! Try scheduling water recycling and battery charging during high-sunlight hours before entering dark periods.'}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playSuccess();
              setShowCertificate(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Mission Certificate</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onViewAchievements();
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            View Badges & Achievements
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Mission</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNextMission();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            <span>Choose Next Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Printable / Downloadable Mission Certificate Modal */}
      <MissionCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        missionTitle={scenario.title}
        solsCommanded={finalState.missionSol}
        finalScore={score}
        ratingBadge={ratingBadge}
      />
    </div>
  );
};
