import React, { useState } from 'react';
import { ResourceState, EngineeringSettings } from '../types/simulation';
import { Sun, Shield, Droplets, Wind, Zap, Sprout, AlertCircle, Eye, Sliders } from 'lucide-react';
import { sound } from '../utils/audio';

interface LunarHabitatDiagramProps {
  state: ResourceState;
  settings: EngineeringSettings;
  onNavigateToEngineering: () => void;
}

type ModuleId = 'solar' | 'dome' | 'eclss' | 'greenhouse' | 'bunker' | 'airlock';

export const LunarHabitatDiagram: React.FC<LunarHabitatDiagramProps> = ({
  state,
  settings,
  onNavigateToEngineering
}) => {
  const [selectedModule, setSelectedModule] = useState<ModuleId>('dome');
  const [viewMode, setViewMode] = useState<'schematic' | 'satellite'>('schematic');

  const getModuleDetails = (mod: ModuleId) => {
    switch (mod) {
      case 'solar':
        return {
          name: 'Solar Array & Power Substation',
          icon: Zap,
          status: state.powerKwGenerated > 10 ? 'Generating Surplus' : state.powerKwGenerated > 4 ? 'Moderate Generation' : 'Battery Drainage',
          detail: `Generating ${state.powerKwGenerated} kW (Tracking: ${settings.solarTrackingMode}, Dust Wipers: ${settings.dustWipersActive ? 'Active' : 'Offline'}).`,
          powerUsage: `${state.powerKwConsumed} kW consumed across base systems.`,
          scienceNote: 'Solar towers at the Moon’s South Pole catch sunlight on elevated crater peaks, avoiding long 14-day equatorial shadows.'
        };
      case 'dome':
        return {
          name: 'Central Habitat Dome & Command Core',
          icon: Shield,
          status: `Integrity ${state.habitatIntegrityPercent}% · Crew Morale ${state.crewMoralePercent}%`,
          detail: `Pressurized living habitat for 4 junior astronauts. Covered with 2.5m packed lunar regolith berm.`,
          powerUsage: `Baseline habitat life support draw: 3.5 kW.`,
          scienceNote: 'Without wind or rain, meteorites hit the surface directly. Regolith berms absorb micro-impacts and space radiation.'
        };
      case 'eclss':
        return {
          name: 'ECLSS Closed-Loop Water & Oxygen Hub',
          icon: Droplets,
          status: `${state.waterRecyclingEfficiencyPercent}% Closed-Loop Recycling`,
          detail: `Oxygen: ${state.oxygenKg.toFixed(1)} kg remaining (${state.oxygenProductionRateKgPerHour} kg/h generated). Water: ${state.waterLiters.toFixed(1)} L (${state.waterRecyclingEfficiencyPercent}% recovery).`,
          powerUsage: `Water filtration draw: ${settings.waterRecyclingMode === 'high_yield' ? '2.4 kW (High Yield)' : '1.2 kW (Standard)'}.`,
          scienceNote: 'Electrolysis splits water into hydrogen and oxygen. The Sabatier reactor captures crew exhaled CO2 to produce fresh water.'
        };
      case 'greenhouse':
        return {
          name: 'Hydroponic & Aeroponic Botanical Wing',
          icon: Sprout,
          status: settings.hydroponicLighting === 'full_spectrum' ? 'High Photosynthesis' : settings.hydroponicLighting === 'eco_pulse' ? 'Maintenance Pulse' : 'Dormant',
          detail: `Supplying fresh leafy greens and supplementing oxygen (+${settings.hydroponicLighting === 'full_spectrum' ? '0.025' : '0.008'} kg O2/h).`,
          powerUsage: `LED grow array draw: ${settings.hydroponicLighting === 'full_spectrum' ? '2.0 kW' : '0.8 kW'}.`,
          scienceNote: 'Red and blue LED light wavelengths optimize chlorophyll absorption without wasting energy on wavelengths plants don’t use.'
        };
      case 'bunker':
        return {
          name: 'Subterranean Lava Tube Shelter',
          icon: Shield,
          status: settings.radiationShieldMode === 'subterranean_bunker' ? 'Crew Sheltered (99% Shielded)' : 'Ready on Standby',
          detail: `Natural volcanic basalt lava tube located 12 meters below surface regolith. Zero radiation penetration.`,
          powerUsage: `Zero power required for passive rock shielding.`,
          scienceNote: 'Ancient lava channels beneath lunar mare created hollow caves with natural roofs tens of meters thick.'
        };
      case 'airlock':
        return {
          name: 'Lunar Surface Airlock & Rover Port',
          icon: Wind,
          status: 'Pressurized & Sealed',
          detail: `Dust vacuum chamber strips abrasive lunar regolith from spacesuits before crew enter living quarters.`,
          powerUsage: `Airlock cycling draw: 0.4 kW on demand.`,
          scienceNote: 'Moon dust particles are sharp like ground glass because they never experienced wind or water erosion.'
        };
    }
  };

  const activeDetails = getModuleDetails(selectedModule);
  const IconComponent = activeDetails.icon;

  return (
    <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
      {/* Viewport Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Artemis Outpost Alpha · Interactive Habitat Schematic
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs font-mono text-cyan-400">
            {state.lunarPhase === 'peak_light' && '☀️ High Sunlight Phase'}
            {state.lunarPhase === 'partial_shade' && '🌗 Partial Shadow Phase'}
            {state.lunarPhase === 'deep_night' && '🌑 Lunar Night (-130°C)'}
            {state.lunarPhase === 'solar_storm' && '⚡ Solar Weather Alert'}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('schematic');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'schematic' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Systems View</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setViewMode('satellite');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'satellite' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Surface Cam</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display */}
      <div className={`relative min-h-[340px] sm:min-h-[380px] overflow-hidden flex flex-col justify-end transition-colors duration-700 ${
        state.lunarPhase === 'deep_night'
          ? 'bg-gradient-to-b from-[#020308] via-[#040714] to-[#070C1E]'
          : state.radiationStatus === 'critical'
          ? 'bg-gradient-to-b from-[#180A04] via-[#0E0C1E] to-[#0D152D]'
          : 'bg-gradient-to-b from-[#05070E] via-[#0A1022] to-[#0F1E36]'
      }`}>
        {viewMode === 'satellite' ? (
          /* High-Fidelity Rendered Surface Photography View */
          <div className="relative w-full h-[360px] sm:h-[400px]">
            <img
              src="/src/assets/images/hero_lunar_habitat_1793375538900.jpg"
              alt="Artemis Research Base on the Lunar South Pole"
              className={`w-full h-full object-cover transition-all duration-700 ${
                state.lunarPhase === 'deep_night' ? 'brightness-50 contrast-125' : 'brightness-100'
              }`}
              referrerPolicy="no-referrer"
            />
            {state.lunarPhase === 'deep_night' && (
              <div className="absolute inset-0 bg-[#02040D]/60 pointer-events-none" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-black/40 pointer-events-none" />
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg p-3 max-w-sm text-xs">
              <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                <span>Artemis Base Alpha · South Pole Ridge</span>
                {state.lunarPhase === 'deep_night' && (
                  <span className="text-[10px] text-blue-300 font-mono">🌑 Night Shift Active</span>
                )}
              </div>
              <div className="text-slate-300 leading-relaxed">
                {state.lunarPhase === 'deep_night'
                  ? 'Base windows illuminate with warm thermal heating while solar arrays operate in lunar night shadow at -130°C.'
                  : 'Elevated solar arrays capture low-angle horizontal sunlight while the central geodesic habitat is shielded by a 2.5-meter protective lunar regolith embankment.'}
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Architectural Vector Schematic */
          <div className="relative w-full h-[360px] sm:h-[400px] p-4 flex flex-col justify-between">
            {/* Cosmic backdrop with Earth and stars */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute top-4 right-10 w-16 h-16 rounded-full bg-blue-500/30 blur-md border border-cyan-400/50 flex items-center justify-center transition-opacity ${
                state.lunarPhase === 'deep_night' ? 'opacity-80' : 'opacity-40'
              }`}>
                <span className="text-[10px] text-cyan-200 font-mono">EARTH</span>
              </div>
              <div className="absolute top-12 left-16 w-1 h-1 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-8 left-48 w-1.5 h-1.5 bg-cyan-200 rounded-full opacity-60"></div>
              <div className="absolute top-20 right-40 w-1 h-1 bg-white rounded-full opacity-70"></div>
              {state.lunarPhase === 'deep_night' && (
                <>
                  <div className="absolute top-16 left-1/3 w-1 h-1 bg-white rounded-full opacity-90 animate-pulse"></div>
                  <div className="absolute top-6 left-2/3 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-80"></div>
                </>
              )}
            </div>

            {/* SOLAR STORM ANIMATED PARTICLE STREAMS & DEFLECTOR SHIELD */}
            {state.radiationStatus === 'critical' && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Flowing Solar Wind Particle Streams */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent"></div>
                <div className="absolute top-6 -left-10 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 blur-[1px] animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none"></div>
                <div className="absolute top-12 -left-20 right-0 h-1.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-70 blur-[1px] animate-[pulse_1.5s_ease-in-out_infinite] motion-reduce:animate-none"></div>
                
                {/* Active Electromagnetic Plasma Dome Outline over Base */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl h-56 rounded-t-full border-2 border-cyan-400/70 bg-cyan-500/10 shadow-[0_0_50px_rgba(6,182,212,0.35)] backdrop-blur-[1px] flex items-start justify-center pt-2">
                  <span className="text-[10px] font-mono text-cyan-200 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-400/50 uppercase tracking-wider">
                    ⚡ Active Magnetic Deflector Field (2.2 kW) · Deflecting Protons
                  </span>
                </div>
              </div>
            )}

            {/* NIGHT LIGHTING: Window glow and floodlight beams */}
            {state.lunarPhase === 'deep_night' && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {/* Subtle base floodlight ground glow */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-24 bg-gradient-to-t from-amber-500/15 via-cyan-500/10 to-transparent blur-xl"></div>
                {/* Beacon warning indicator */}
                <div className="absolute top-8 left-8 flex items-center gap-2 bg-slate-950/80 border border-blue-500/40 px-3 py-1 rounded-lg text-xs font-mono text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  <span>Lunar Night Mode: -130°C · Cabin Heating & Window Luminescence ON</span>
                </div>
              </div>
            )}

            {/* Solar storm warning banner if active */}
            {state.radiationStatus === 'critical' && (
              <div className="relative z-10 mx-auto bg-amber-500/25 border border-amber-500/60 text-amber-200 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-amber-950/50 animate-pulse motion-reduce:animate-none">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Solar Particle Alert Active: High proton flux passing lunar horizon!</span>
              </div>
            )}

            {/* Interactive Module Nodes on the schematic */}
            <div className="relative z-10 w-full max-w-4xl mx-auto my-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              {/* Node 1: Solar Arrays */}
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedModule('solar');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModule === 'solar'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Solar Array Alpha</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">
                    +{state.powerKwGenerated} kW
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Tracking: {settings.solarTrackingMode} · Wipers {settings.dustWipersActive ? 'ON' : 'OFF'}
                </div>
              </button>

              {/* Node 2: Central Habitat Dome */}
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedModule('dome');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModule === 'dome'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Command Dome</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {state.habitatIntegrityPercent}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Shield: 2.5m Regolith · 4 Crew
                </div>
              </button>

              {/* Node 3: ECLSS Hub */}
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedModule('eclss');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModule === 'eclss'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">ECLSS Life Support</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {state.waterRecyclingEfficiencyPercent}% loop
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  O₂: {state.oxygenKg.toFixed(0)} kg · H₂O: {state.waterLiters.toFixed(0)} L
                </div>
              </button>

              {/* Node 4: Hydroponic Greenhouse */}
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedModule('greenhouse');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModule === 'greenhouse'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Greenhouse Bio-Wing</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300">
                    {state.foodRationsDays.toFixed(1)}d rations
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  LED: {settings.hydroponicLighting} · Aeroponics
                </div>
              </button>

              {/* Node 5: Subterranean Lava Tube Bunker */}
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedModule('bunker');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModule === 'bunker'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-white">Lava Tube Shelter</span>
                  </div>
                  <span className="text-[10px] font-mono text-violet-300">
                    -12m Depth
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  {settings.radiationShieldMode === 'subterranean_bunker' ? 'Crew Sheltered' : 'Standby Shelter'}
                </div>
              </button>

              {/* Node 6: Airlock & Rover Port */}
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedModule('airlock');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModule === 'airlock'
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-white">Airlock & Rover Bay</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300">
                    Sealed
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Acoustic Dust Scrubber Active
                </div>
              </button>
            </div>

            {/* Terrain Horizon Strip */}
            <div className="relative z-0 mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Shackleton Crater Rim Outpost (Latitude 89.9°S)</span>
              <span>Surface Regolith Temp: {state.surfaceTemperatureCelsius}°C</span>
            </div>
          </div>
        )}
      </div>

      {/* Module Inspector Drawer */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">{activeDetails.name}</h4>
              <span className="text-xs font-mono text-cyan-400">· {activeDetails.status}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{activeDetails.detail}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <strong className="text-slate-300">Space Science Note:</strong> {activeDetails.scienceNote}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onNavigateToEngineering();
          }}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Configure in Engineering Lab
        </button>
      </div>
    </div>
  );
};
