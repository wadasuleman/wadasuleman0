import React from 'react';
import { EmergencyEvent, ResourceState, EngineeringSettings } from '../types/simulation';
import { AlertTriangle, ShieldCheck, Zap, ArrowRight, BookOpen } from 'lucide-react';
import { sound } from '../utils/audio';

interface EmergencyModalProps {
  emergency: EmergencyEvent;
  state: ResourceState;
  settings: EngineeringSettings;
  onResolveOption: (optionId: string) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  emergency,
  onResolveOption
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#0B132B] border border-amber-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl shadow-amber-950/40 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>Mission Advisory · Operational Event</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{emergency.title}</h3>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>URGENT DECISION</span>
          </div>
        </div>

        {/* Event Visual for Solar Storm if applicable */}
        {emergency.category === 'radiation' && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 h-44">
            <img
              src="/src/assets/images/solar_storm_lunar_base_1793375540503.jpg"
              alt="Simulated Solar Energetic Particle Event and Lava Tube Shielding"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-3 text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              Solar Energetic Particle Simulation · Subsurface Lava Tube Shelter Active
            </div>
          </div>
        )}

        {/* Situation Description */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {emergency.description}
        </p>

        {/* Science Context Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-300">Space Science Context: </strong>
            {emergency.scienceBackground}
          </div>
        </div>

        {/* Tactical Decision Options */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Commander Intervention Choices:
          </div>

          <div className="space-y-2.5">
            {emergency.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  sound.playClick();
                  onResolveOption(opt.id);
                }}
                className="w-full p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-cyan-400/60 text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {opt.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {opt.description}
                </p>
                <div className="text-[11px] text-amber-300/90 font-mono mt-1.5 flex items-center gap-1.5">
                  <span>Consequence:</span>
                  <span>{opt.consequenceSummary}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
