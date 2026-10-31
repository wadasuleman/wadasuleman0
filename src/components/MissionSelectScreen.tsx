import React from 'react';
import { MISSION_SCENARIOS } from '../data/missions';
import { MissionScenario } from '../types/simulation';
import { Rocket, Clock, Shield, Droplets, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface MissionSelectScreenProps {
  onSelectMission: (scenario: MissionScenario) => void;
  activeMissionId: string;
}

export const MissionSelectScreen: React.FC<MissionSelectScreenProps> = ({
  onSelectMission,
  activeMissionId
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Flight Operations Roster</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">Simulation Scenarios</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Select a Lunar Mission</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Each mission simulates real engineering obstacles faced by future Artemis astronauts. Choose a scenario below to command your base!
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
          5 Training Missions Available
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MISSION_SCENARIOS.map((scenario, index) => {
          const isActive = scenario.id === activeMissionId;

          return (
            <div
              key={scenario.id}
              className={`bg-[#0B132B]/85 border rounded-2xl p-5 space-y-4 backdrop-blur-sm transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-cyan-400 ring-1 ring-cyan-400 shadow-lg shadow-cyan-950/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        Mission 0{index + 1}
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs font-mono text-slate-400">
                        {scenario.difficulty}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">{scenario.title}</h3>
                    <div className="text-xs text-slate-400">{scenario.subtitle}</div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{scenario.durationSols} Sols</span>
                  </div>
                </div>

                {/* Briefing */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scenario.briefing}
                </p>

                {/* Primary Objective */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px]">
                    Primary Flight Objective:
                  </div>
                  <div className="text-slate-200">
                    {scenario.primaryObjective}
                  </div>
                </div>

                {/* Key Science Takeaway */}
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Space Science Concept: </strong>
                  {scenario.keyScienceTakeaway}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Educational Simulation
                </span>

                <button
                  onClick={() => {
                    sound.playClick();
                    onSelectMission(scenario);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300'
                      : 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <span>{isActive ? 'Current Mission (Play)' : 'Launch Scenario'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
