import React, { useState } from 'react';
import { EngineeringSettings, ResourceState } from '../types/simulation';
import { explainDecisionEffect } from '../utils/simulationEngine';
import { Zap, Droplets, Sun, Sprout, Shield, Thermometer, UserCheck, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface EngineeringLabProps {
  settings: EngineeringSettings;
  state: ResourceState;
  onUpdateSetting: <K extends keyof EngineeringSettings>(key: K, value: EngineeringSettings[K]) => void;
  onNavigateToControl: () => void;
}

export const EngineeringLab: React.FC<EngineeringLabProps> = ({
  settings,
  state,
  onUpdateSetting,
  onNavigateToControl
}) => {
  const [activeExplanation, setActiveExplanation] = useState<string>(
    'Select any engineering subsystem below to calibrate habitat operations. You will see an instant plain-language explanation of how your choice shapes the mission!'
  );

  const handleSettingChange = <K extends keyof EngineeringSettings>(
    key: K,
    value: EngineeringSettings[K]
  ) => {
    sound.playClick();
    onUpdateSetting(key, value);
    const explanation = explainDecisionEffect(key, value);
    setActiveExplanation(explanation);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Subsystem Calibration</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">Sol {state.missionSol} Configuration</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Mission Engineering Laboratory</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Every choice you make changes base energy consumption, closed-loop recycling rates, and astronaut health. Balance your resources thoughtfully!
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onNavigateToControl();
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
        >
          <span>Return to Mission Control</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Cause & Effect Explanation Banner */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Engineering Cause & Effect Analysis
          </h4>
          <p className="text-sm text-slate-200 mt-1 font-medium leading-relaxed">
            {activeExplanation}
          </p>
        </div>
      </div>

      {/* Engineering Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Module 1: Water Recovery System (ECLSS) */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ECLSS Water Recycling Mode</h3>
                <span className="text-[11px] text-slate-400">Current Recovery: {state.waterRecyclingEfficiencyPercent}%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Purifies humidity from astronaut respiration, sweat, and greywater through catalytic oxidation and vacuum distillation.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', label: 'Standard (88%)', power: '1.2 kW', desc: 'Balanced closed loop' },
              { id: 'high_yield', label: 'High Yield (96%)', power: '2.4 kW', desc: 'Max water conservation' },
              { id: 'eco', label: 'Eco Save (72%)', power: '0.5 kW', desc: 'Saves electricity' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSettingChange('waterRecyclingMode', opt.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.waterRecyclingMode === opt.id
                    ? 'bg-blue-500/20 border-blue-400 ring-1 ring-blue-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-blue-300 font-mono mt-0.5">{opt.power}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Module 2: Electrical Power Priorities */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Power Grid Priority Routing</h3>
                <span className="text-[11px] text-slate-400">
                  Storage: {state.batteryStorageKwh.toFixed(1)} / {state.batteryCapacityKwh} kWh
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Dictates which systems receive battery electricity first when generation drops or during shadow phases.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'balanced', label: 'Balanced Grid', desc: 'Equal distribution across base' },
              { id: 'life_support', label: 'Life Support 1st', desc: 'Dims lights; protects O₂ and water' },
              { id: 'emergency_survival', label: 'Survival Mode', desc: 'Cuts 35% load; protects batteries' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSettingChange('powerPriority', opt.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.powerPriority === opt.id
                    ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Module 3: Solar Array Alignment & Regolith Wipers */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Solar Tracking & Dust Protection</h3>
                <span className="text-[11px] text-slate-400">Output: {state.powerKwGenerated} kW</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Motors track low-angle South Pole sunlight. Acoustic vibrators shake abrasive Moon dust off glass covers.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Auto Sun Tracking', desc: '100% solar efficiency' },
                { id: 'fixed', label: 'Fixed Position', desc: '65% solar efficiency' },
                { id: 'storm_feathered', label: 'Storm Feathered', desc: 'Protects from impacts' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSettingChange('solarTrackingMode', opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.solarTrackingMode === opt.id
                      ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Acoustic Dust Wipers Toggle */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Acoustic Dust Scrubber Wipers</div>
                <div className="text-[11px] text-slate-400">Prevents abrasive regolith buildup (-18% power loss)</div>
              </div>
              <button
                onClick={() => handleSettingChange('dustWipersActive', !settings.dustWipersActive)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  settings.dustWipersActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {settings.dustWipersActive ? '● Active (0.2 kW)' : '○ Offline'}
              </button>
            </div>
          </div>
        </div>

        {/* Module 4: Hydroponic Greenhouse LED Lighting */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Greenhouse Photosynthesis Arrays</h3>
                <span className="text-[11px] text-slate-400">Rations: {state.foodRationsDays.toFixed(1)} Days</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Aeroponic vegetable cultivation under optimized red and blue LED spectrums supplies fresh greens and oxygen.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'full_spectrum', label: 'Full Spectrum', power: '2.0 kW', desc: 'Fast growth + bonus O₂' },
              { id: 'eco_pulse', label: 'Eco Pulse', power: '0.8 kW', desc: 'Maintenance lighting' },
              { id: 'dormant', label: 'Dormant Dark', power: '0.0 kW', desc: 'Zero power; crops halt' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSettingChange('hydroponicLighting', opt.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.hydroponicLighting === opt.id
                    ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-emerald-300 font-mono mt-0.5">{opt.power}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Module 5: Radiation Shielding Configuration */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Radiation Protection Protocols</h3>
                <span className="text-[11px] text-slate-400">Efficiency: {state.radiationShieldIntegrityPercent}%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Shields astronauts from galactic cosmic rays and solar storm protons using lunar regolith or underground lava tubes.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'regolith_berm', label: '2.5m Regolith Berm', desc: 'Passive surface soil (0 kW)' },
              { id: 'active_deflector', label: 'Magnetic Deflector', desc: 'Active plasma field (2.2 kW)' },
              { id: 'subterranean_bunker', label: 'Lava Tube Bunker', desc: 'Underground cave (99% shield)' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSettingChange('radiationShieldMode', opt.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.radiationShieldMode === opt.id
                    ? 'bg-violet-500/20 border-violet-400 ring-1 ring-violet-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Module 6: Thermal Radiators & Night Insulation */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Thermal Radiators & Heat Pipes</h3>
                <span className="text-[11px] text-slate-400">Surface Temp: {state.surfaceTemperatureCelsius}°C</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Regulates internal habitat temperature against brutal lunar temperature swings (+120°C sun to -130°C night).
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'auto_balanced', label: 'Auto Balanced', desc: 'Modulates heat pipes automatically' },
              { id: 'night_insulation', label: 'Night Insulation', desc: 'Traps heat during freezing darkness' },
              { id: 'max_cooling', label: 'Max Cooling', desc: 'Expands radiators during peak sun' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSettingChange('thermalRadiatorsMode', opt.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.thermalRadiatorsMode === opt.id
                    ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
