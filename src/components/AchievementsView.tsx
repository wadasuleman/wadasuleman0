import React, { useState } from 'react';
import { Achievement } from '../types/simulation';
import { Award, Compass, BatteryCharging, Droplets, ShieldAlert, Sprout, CheckCircle2, Lock, Sparkles, FileCheck } from 'lucide-react';
import { sound } from '../utils/audio';
import { MissionCertificateModal } from './MissionCertificateModal';

interface AchievementsViewProps {
  achievements: Achievement[];
  lifetimeStats: {
    totalSolsCommanded: number;
    missionsCompleted: number;
    emergenciesResolved: number;
    highestRecyclingRate: number;
  };
  onNavigateToMissions: () => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  lifetimeStats,
  onNavigateToMissions
}) => {
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return Compass;
      case 'BatteryCharging':
        return BatteryCharging;
      case 'Droplets':
        return Droplets;
      case 'ShieldAlert':
        return ShieldAlert;
      case 'Sprout':
        return Sprout;
      default:
        return Award;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Junior Astronaut Credentials</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">Flight Record</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Mission Achievements & Badges</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Earned through thoughtful planning, responsible resource stewardship, and mastering real space science principles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              sound.playSuccess();
              setShowCertificate(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Official Certificate</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigateToMissions();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            Explore Missions
          </button>
        </div>
      </div>

      {/* Lifetime Flight Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Total Sols Commanded</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {lifetimeStats.totalSolsCommanded}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lunar days in orbit</div>
        </div>

        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Missions Completed</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {lifetimeStats.missionsCompleted}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scenarios survived</div>
        </div>

        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Emergencies Resolved</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {lifetimeStats.emergenciesResolved}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Calm problem solving</div>
        </div>

        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Best Water Loop</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {lifetimeStats.highestRecyclingRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Peak ECLSS efficiency</div>
        </div>
      </div>

      {/* Achievements Badges Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Artemis Badge Collection ({unlockedCount} / {achievements.length} Unlocked)
          </div>
          <div className="text-xs text-cyan-400 font-mono">
            Progress: {Math.round((unlockedCount / achievements.length) * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = getIcon(ach.icon);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all ${
                  ach.unlocked
                    ? 'bg-[#0B132B]/90 border-cyan-500/30 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.unlocked
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                      {ach.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {ach.description}
                    </p>
                    {ach.unlockedAt && (
                      <div className="mt-2 text-[10px] font-mono text-cyan-400">
                        Unlocked: {ach.unlockedAt}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MissionCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        missionTitle="Artemis Lunar Outpost Command"
        solsCommanded={lifetimeStats.totalSolsCommanded}
        finalScore={lifetimeStats.missionsCompleted * 500 + lifetimeStats.emergenciesResolved * 150 + Math.round(lifetimeStats.highestRecyclingRate * 5)}
        ratingBadge={
          lifetimeStats.missionsCompleted >= 3
            ? 'Master of the Artemis Horizon'
            : lifetimeStats.missionsCompleted >= 1
            ? 'Gold Flight Commander'
            : 'Silver Lunar Explorer'
        }
      />
    </div>
  );
};
