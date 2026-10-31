import React from 'react';
import { ResourceState, EngineeringSettings, TelemetryHistoryPoint } from '../types/simulation';
import { Wind, Droplets, Zap, Shield, Sprout, Heart, X, ArrowRight, Sliders, CheckCircle2, HelpCircle, Activity } from 'lucide-react';
import { sound } from '../utils/audio';
import { SparklineChart } from './SparklineChart';

export type HelpResourceId = 'oxygen' | 'water' | 'power' | 'radiation' | 'food' | 'crew';

interface ResourceHelpModalProps {
  resourceId: HelpResourceId | null;
  onClose: () => void;
  state: ResourceState;
  settings: EngineeringSettings;
  onNavigateToEngineering: () => void;
  telemetryHistory?: TelemetryHistoryPoint[];
}

interface ResourceHelpInfo {
  title: string;
  category: string;
  icon: typeof Wind;
  iconColor: string;
  iconBg: string;
  simpleExplanation: string;
  currentStatusSummary: string;
  simulationFactors: {
    settingName: string;
    currentValue: string;
    impactDescription: string;
    isOptimal: boolean;
  }[];
  quickCadetTip: string;
}

export const ResourceHelpModal: React.FC<ResourceHelpModalProps> = ({
  resourceId,
  onClose,
  state,
  settings,
  onNavigateToEngineering,
  telemetryHistory
}) => {
  if (!resourceId) return null;

  const getHelpContent = (id: HelpResourceId): ResourceHelpInfo => {
    switch (id) {
      case 'oxygen':
        return {
          title: 'Oxygen & Atmosphere Supply',
          category: 'Life Support & ECLSS',
          icon: Wind,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/10 border-blue-500/30',
          simpleExplanation: 'Oxygen is the air your 4 junior astronauts breathe. The base produces fresh oxygen by splitting recycled water into oxygen and hydrogen (electrolysis), while greenhouse plants provide extra oxygen during photosynthesis.',
          currentStatusSummary: `Current tank: ${state.oxygenKg.toFixed(1)} kg. 4 crew consume ${state.oxygenConsumptionRateKgPerHour} kg/h while the base produces ${state.oxygenProductionRateKgPerHour} kg/h.`,
          simulationFactors: [
            {
              settingName: 'Hydroponic Lighting Mode',
              currentValue: settings.hydroponicLighting === 'full_spectrum' ? 'Full Spectrum' : settings.hydroponicLighting === 'eco_pulse' ? 'Eco Pulse' : 'Dormant',
              impactDescription: settings.hydroponicLighting === 'full_spectrum'
                ? 'Full Spectrum LED provides maximum photosynthesis, adding +0.025 kg/h of natural oxygen bonus.'
                : settings.hydroponicLighting === 'eco_pulse'
                ? 'Eco Pulse maintains plant health with a smaller +0.008 kg/h oxygen bonus.'
                : 'Dormant mode turns off greenhouse lights. Saves power, but produces zero bonus oxygen.',
              isOptimal: settings.hydroponicLighting === 'full_spectrum'
            },
            {
              settingName: 'Power Grid Priority',
              currentValue: settings.powerPriority === 'life_support' ? 'Life Support 1st' : settings.powerPriority === 'emergency_survival' ? 'Survival Mode' : 'Balanced Grid',
              impactDescription: settings.powerPriority === 'life_support'
                ? 'Life support systems receive top electricity priority, ensuring electrolysis reactors never shut down.'
                : 'Balanced power shares electricity equally. If battery runs low, oxygen reactors may experience throttling.',
              isOptimal: settings.powerPriority === 'life_support' || state.batteryStorageKwh > 20
            },
            {
              settingName: 'Crew Work Schedule',
              currentValue: settings.crewWorkSchedule === 'nominal' ? 'Nominal' : settings.crewWorkSchedule === 'strenuous_research' ? 'Strenuous Research' : 'Rest & Recovery',
              impactDescription: settings.crewWorkSchedule === 'strenuous_research'
                ? 'Hard physical research slightly increases metabolic respiration, consuming oxygen faster.'
                : 'Astronauts breathe at nominal rates during standard schedules and rest periods.',
              isOptimal: settings.crewWorkSchedule !== 'strenuous_research' || state.oxygenKg > 50
            }
          ],
          quickCadetTip: 'Keep closed-loop water recycling above 88% so your base always has enough water to generate fresh oxygen through electrolysis!'
        };

      case 'water':
        return {
          title: 'Closed-Loop Water & ECLSS Recovery',
          category: 'Hydration & Life Support',
          icon: Droplets,
          iconColor: 'text-cyan-400',
          iconBg: 'bg-cyan-500/10 border-cyan-500/30',
          simpleExplanation: 'Lifting water into space is very heavy and expensive. The base uses a closed-loop system called ECLSS to capture moisture from astronaut sweat, breath, and washing, purifying it back into clean water.',
          currentStatusSummary: `Storage: ${state.waterLiters.toFixed(1)} L of ${state.waterCapacityLiters} L. Water loop recovery efficiency is currently ${state.waterRecyclingEfficiencyPercent}%.`,
          simulationFactors: [
            {
              settingName: 'Water Recycling Mode',
              currentValue: settings.waterRecyclingMode === 'high_yield' ? 'High Yield (96%)' : settings.waterRecyclingMode === 'standard' ? 'Standard (88%)' : 'Eco Save (72%)',
              impactDescription: settings.waterRecyclingMode === 'high_yield'
                ? 'Recovers 96% of water (+2.4 L/h) by running intensive catalytic distillation, using 2.4 kW power.'
                : settings.waterRecyclingMode === 'standard'
                ? 'Recovers 88% of water with a modest 1.2 kW power draw. Suitable for standard solar operations.'
                : 'Recovers only 72% of water. Conserves electricity (0.5 kW) but causes gradual water reserve depletion.',
              isOptimal: settings.waterRecyclingMode === 'high_yield' || (settings.waterRecyclingMode === 'standard' && state.waterLiters > 100)
            },
            {
              settingName: 'Hydroponic Misting Cycles',
              currentValue: settings.hydroponicLighting !== 'dormant' ? 'Active Aeroponic Misting' : 'Paused Misting',
              impactDescription: 'Aeroponic greenhouse trays spray fine nutrient water mist onto plant roots. Most is recovered through air dehumidifiers.',
              isOptimal: true
            },
            {
              settingName: 'Electrical Power Reserves',
              currentValue: `${state.batteryStorageKwh.toFixed(1)} kWh Available`,
              impactDescription: state.batteryStorageKwh < 10
                ? 'Warning: Low battery will force water distillation heaters to shut down!'
                : 'Sufficient electricity is available to run closed-loop distillation without interruption.',
              isOptimal: state.batteryStorageKwh >= 10
            }
          ],
          quickCadetTip: 'If water reserves drop below 100 Liters, switch Water Recycling to "High Yield" in the Engineering Lab until tanks refill.'
        };

      case 'power':
        return {
          title: 'Electrical Power & Battery Storage',
          category: 'Power Grids & Solar Energy',
          icon: Zap,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/30',
          simpleExplanation: 'Electricity powers everything in the outpost: oxygen scrubbers, water distillers, heaters, lights, and communications. Solar arrays generate power from sunlight, storing surplus energy in a large battery bank for shadows and night.',
          currentStatusSummary: `Generating ${state.powerKwGenerated} kW, consuming ${state.powerKwConsumed} kW. Battery is at ${Math.round((state.batteryStorageKwh / state.batteryCapacityKwh) * 100)}% (${state.batteryStorageKwh.toFixed(1)}/${state.batteryCapacityKwh} kWh).`,
          simulationFactors: [
            {
              settingName: 'Solar Sun Tracking Mode',
              currentValue: settings.solarTrackingMode === 'auto' ? 'Auto Sun Tracking' : settings.solarTrackingMode === 'fixed' ? 'Fixed Angle' : 'Storm Feathered',
              impactDescription: settings.solarTrackingMode === 'auto'
                ? 'Motors angle panels toward the Sun for 100% maximum solar collection efficiency.'
                : settings.solarTrackingMode === 'fixed'
                ? 'Fixed position saves motor wear, but captures 35% less sunlight as the Sun shifts.'
                : 'Panels are feathered flat to prevent damage from storm debris, producing only 25% power.',
              isOptimal: settings.solarTrackingMode === 'auto'
            },
            {
              settingName: 'Acoustic Regolith Dust Wipers',
              currentValue: settings.dustWipersActive ? 'Active (Wipers ON)' : 'Offline (Wipers OFF)',
              impactDescription: settings.dustWipersActive
                ? 'High-frequency acoustic vibrations shake sharp Moon dust off panels, preventing an 18% power loss.'
                : 'Dust accumulates on solar panels, blocking sunlight and reducing electrical output by ~18%.',
              isOptimal: settings.dustWipersActive
            },
            {
              settingName: 'Power Grid Priority',
              currentValue: settings.powerPriority === 'balanced' ? 'Balanced' : settings.powerPriority === 'life_support' ? 'Life Support 1st' : 'Emergency Survival',
              impactDescription: settings.powerPriority === 'life_support'
                ? 'Reduces non-essential lighting and equipment by 15%, conserving battery power.'
                : settings.powerPriority === 'emergency_survival'
                ? 'Cuts secondary loads by 35% to make batteries last through extreme emergencies and long dark phases.'
                : 'Distributes electricity equally across science, lights, greenhouse, and life support.',
              isOptimal: state.powerKwGenerated >= state.powerKwConsumed || settings.powerPriority !== 'balanced'
            },
            {
              settingName: 'Lunar Phase & Day/Night Cycle',
              currentValue: state.lunarPhase === 'peak_light' ? 'Peak Sunlight (+120°C)' : state.lunarPhase === 'partial_shade' ? 'Partial Shadow' : 'Deep Lunar Night (-130°C)',
              impactDescription: state.lunarPhase === 'deep_night'
                ? 'During the freezing 14-day lunar night, solar generation drops to near zero. All power comes from batteries!'
                : 'Sunlight is available. Ensure battery bank is fully charged before entering night phases.',
              isOptimal: state.lunarPhase !== 'deep_night' || state.batteryStorageKwh > 30
            }
          ],
          quickCadetTip: 'Always activate Acoustic Dust Wipers and Auto Sun Tracking to maximize battery charge before sunset!'
        };

      case 'radiation':
        return {
          title: 'Radiation Shielding & Space Weather',
          category: 'Space Medicine & Shielding',
          icon: Shield,
          iconColor: 'text-violet-400',
          iconBg: 'bg-violet-500/10 border-violet-500/30',
          simpleExplanation: 'Unlike Earth, the Moon has no atmosphere or global magnetic field. Harmful cosmic rays from deep space and energetic protons from the Sun pass straight to the surface. Moon soil (regolith) and underground basalt caves act as physical radiation shields.',
          currentStatusSummary: `Shield efficiency: ${state.radiationShieldIntegrityPercent}%. Ambient dose rate: ${state.radiationDoseRateMsvPerHour} mSv/h. Cumulative exposure: ${state.cumulativeDoseMsv} mSv (Safety limit: < 25 mSv).`,
          simulationFactors: [
            {
              settingName: 'Radiation Shielding Mode',
              currentValue: settings.radiationShieldMode === 'regolith_berm' ? '2.5m Regolith Berm' : settings.radiationShieldMode === 'active_deflector' ? 'Active Magnetic Deflector' : 'Subterranean Lava Tube',
              impactDescription: settings.radiationShieldMode === 'subterranean_bunker'
                ? 'Underground lava tube basalt rock blocks 99% of all radiation with zero electrical power consumed!'
                : settings.radiationShieldMode === 'active_deflector'
                ? 'Electromagnetic coils generate an artificial magnetosphere deflecting 97% of charged protons, drawing 2.2 kW.'
                : 'A 2.5m packed Moon dirt berm over the habitat provides 92% passive protection under normal solar weather.',
              isOptimal: state.radiationStatus === 'nominal' ? true : settings.radiationShieldMode !== 'regolith_berm'
            },
            {
              settingName: 'Space Weather Status',
              currentValue: state.radiationStatus === 'nominal' ? 'Nominal (Quiet Sun)' : 'Elevated Solar Wind / Storm',
              impactDescription: state.radiationStatus === 'nominal'
                ? 'Solar wind conditions are quiet. Standard surface regolith shielding is completely safe.'
                : 'Warning: Solar flare energetic protons incoming! Deploy Active Deflector or shelter crew underground immediately!',
              isOptimal: state.radiationStatus === 'nominal'
            }
          ],
          quickCadetTip: 'If a Solar Particle Event or Class X Flare alert occurs, move your crew into the Subterranean Lava Tube Shelter!'
        };

      case 'food':
        return {
          title: 'Food Rations & Greenhouse Yield',
          category: 'Bioregenerative Systems',
          icon: Sprout,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/30',
          simpleExplanation: 'Astronauts need nutritious food to stay energetic and healthy. The base carries freeze-dried space rations and grows fresh vegetables (lettuce, radishes, dwarf tomatoes) in the hydroponic greenhouse.',
          currentStatusSummary: `Rations remaining: ${state.foodRationsDays.toFixed(1)} days. Greenhouse biomass yield: +${state.greenhouseOutputKgPerDay} kg/day.`,
          simulationFactors: [
            {
              settingName: 'Hydroponic Lighting',
              currentValue: settings.hydroponicLighting === 'full_spectrum' ? 'Full Spectrum' : settings.hydroponicLighting === 'eco_pulse' ? 'Eco Pulse' : 'Dormant',
              impactDescription: settings.hydroponicLighting === 'full_spectrum'
                ? 'Accelerates vegetable growth rate to 1.2 kg/day and generates bonus oxygen, drawing 2.0 kW.'
                : settings.hydroponicLighting === 'eco_pulse'
                ? 'Keeps plants alive with low-energy pulses (0.8 kW), producing 0.7 kg/day.'
                : 'Shuts off grow lights. Saves electricity, but crop yield drops to 0.1 kg/day.',
              isOptimal: settings.hydroponicLighting !== 'dormant'
            },
            {
              settingName: 'Crew Nutrition Demand',
              currentValue: '1 Ration Day per 24h',
              impactDescription: 'Astronauts consume regular daily meals. Fresh harvested greens extend ration supplies and provide essential vitamins.',
              isOptimal: state.foodRationsDays > 7
            }
          ],
          quickCadetTip: 'Full Spectrum lighting not only produces fresh salad for your crew, but also releases fresh oxygen into the air loop!'
        };

      case 'crew':
        return {
          title: 'Crew Wellbeing, Health & Morale',
          category: 'Human Spaceflight & Psychology',
          icon: Heart,
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/10 border-rose-500/30',
          simpleExplanation: 'Astronauts on the Moon face isolation, confined quarters, and high workloads. Ensuring clean air, pure water, fresh food, and sufficient sleep keeps crew health and morale high.',
          currentStatusSummary: `Crew Health: ${state.crewHealthPercent}% · Morale: ${state.crewMoralePercent}% · Habitat Integrity: ${state.habitatIntegrityPercent}%.`,
          simulationFactors: [
            {
              settingName: 'Crew Work Schedule',
              currentValue: settings.crewWorkSchedule === 'nominal' ? 'Nominal Shift' : settings.crewWorkSchedule === 'strenuous_research' ? 'Strenuous Research' : 'Rest & Recovery',
              impactDescription: settings.crewWorkSchedule === 'rest_recovery'
                ? 'Astronauts exercise, sleep, and video-call family on Earth, restoring health (+0.8%/h) and morale (+1.2%/h).'
                : settings.crewWorkSchedule === 'strenuous_research'
                ? 'Intensive drilling and EVA experiments boost science score, but causes fatigue and lowers morale (-0.4%/h).'
                : 'Balanced 8-hour shift routine maintaining steady health and focus.',
              isOptimal: settings.crewWorkSchedule !== 'strenuous_research' || state.crewMoralePercent > 75
            },
            {
              settingName: 'Life Support Stability',
              currentValue: state.oxygenKg > 20 && state.waterLiters > 50 ? 'All Vital Systems Stable' : 'Resource Stress Detected',
              impactDescription: state.oxygenKg < 20 || state.waterLiters < 30
                ? 'Warning: Atmospheric or water shortages cause severe stress and rapid health degradation!'
                : 'Plentiful oxygen and clean water keep astronaut vital signs strong.',
              isOptimal: state.oxygenKg > 20 && state.waterLiters > 50
            },
            {
              settingName: 'Thermal Comfort & Radiators',
              currentValue: settings.thermalRadiatorsMode === 'night_insulation' ? 'Insulation Blankets Deployed' : 'Auto Radiators',
              impactDescription: 'Protecting the base from freezing cold (-130°C) during the night maintains a cozy internal cabin temperature (+21°C).',
              isOptimal: true
            }
          ],
          quickCadetTip: 'If crew morale dips below 70%, switch Work Schedule to "Rest & Recovery" in the Engineering Lab for a few hours.'
        };
    }
  };

  const info = getHelpContent(resourceId);
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B132B] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${info.iconBg} ${info.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                  Telemetry Help Guide · {info.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">{info.title}</h3>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simple Explanation */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          {info.simpleExplanation}
        </p>

        {/* Current State Snapshot */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0"></div>
          <div className="text-xs text-slate-200 font-mono leading-relaxed">
            <strong className="text-cyan-300">Live Status: </strong>
            {info.currentStatusSummary}
          </div>
        </div>

        {/* 24-Hour Telemetry History Chart (for Oxygen, Water, Power, Food) */}
        {(resourceId === 'oxygen' || resourceId === 'water' || resourceId === 'power' || resourceId === 'food') && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recorded Telemetry History (Last 24h)</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Actual Simulation Data</span>
            </div>

            <div className="pt-2">
              <SparklineChart
                data={
                  resourceId === 'oxygen'
                    ? (telemetryHistory?.map(p => p.oxygenKg) || [state.oxygenKg])
                    : resourceId === 'water'
                    ? (telemetryHistory?.map(p => p.waterLiters) || [state.waterLiters])
                    : resourceId === 'power'
                    ? (telemetryHistory?.map(p => p.batteryKwh) || [state.batteryStorageKwh])
                    : (telemetryHistory?.map(p => p.foodDays) || [state.foodRationsDays])
                }
                strokeColor={
                  resourceId === 'oxygen'
                    ? '#60a5fa'
                    : resourceId === 'water'
                    ? '#22d3ee'
                    : resourceId === 'power'
                    ? '#fbbf24'
                    : '#34d399'
                }
                fillColor={
                  resourceId === 'oxygen'
                    ? 'rgba(96, 165, 250, 0.15)'
                    : resourceId === 'water'
                    ? 'rgba(34, 211, 238, 0.15)'
                    : resourceId === 'power'
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'rgba(52, 211, 153, 0.15)'
                }
                height={54}
                unit={
                  resourceId === 'oxygen' ? ' kg' : resourceId === 'water' ? ' L' : resourceId === 'power' ? ' kWh' : ' days'
                }
                showMinMax={true}
                minMaxDecimals={1}
              />
            </div>

            {/* Child-friendly trend interpretation */}
            <div className="text-xs text-slate-300 font-medium bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
              {resourceId === 'power' && (
                <span>
                  {(state.powerKwGenerated - state.powerKwConsumed) >= 0
                    ? `Your battery level is charging (+${(state.powerKwGenerated - state.powerKwConsumed).toFixed(2)} kW/h) from active solar panels.`
                    : `Your battery level is decreasing (${(state.powerKwGenerated - state.powerKwConsumed).toFixed(2)} kW/h) due to habitat power demand.`}
                </span>
              )}
              {resourceId === 'oxygen' && (
                <span>
                  {state.oxygenProductionRateKgPerHour >= state.oxygenConsumptionRateKgPerHour
                    ? 'Your oxygen level is steady and producing a positive surplus for the crew.'
                    : `Your oxygen reserve is decreasing (-${(state.oxygenConsumptionRateKgPerHour - state.oxygenProductionRateKgPerHour).toFixed(3)} kg/h).`}
                </span>
              )}
              {resourceId === 'water' && (
                <span>
                  {state.waterProductionRateLitersPerHour >= state.waterConsumptionRateLitersPerHour
                    ? 'Your closed-loop water recovery is stable and replenishing storage tanks.'
                    : `Your water level is slowly decreasing (-${(state.waterConsumptionRateLitersPerHour - state.waterProductionRateLitersPerHour).toFixed(2)} L/h).`}
                </span>
              )}
              {resourceId === 'food' && (
                <span>
                  Rations are consumed predictably by your 4 crew members while the hydroponic greenhouse cultivates fresh bonus greens.
                </span>
              )}
            </div>
          </div>
        )}

        {/* How Simulation Settings Affect This Resource */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>How Simulation Settings Shape This Resource:</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Current Configuration</span>
          </div>

          <div className="space-y-2.5">
            {info.simulationFactors.map((factor, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{factor.settingName}</span>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${
                    factor.isOptimal ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {factor.currentValue}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {factor.impactDescription}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cadet Flight Director Tip */}
        <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3.5 text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300">Commander Luna's Pro Tip: </strong>
            {info.quickCadetTip}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any resource card to inspect its physics & settings
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              Close
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
                onNavigateToEngineering();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
            >
              <span>Adjust in Engineering Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
