import { MissionScenario, EmergencyEvent } from '../types/simulation';

export const SOLAR_STORM_EMERGENCY: EmergencyEvent = {
  id: 'solar-storm-cme',
  title: 'Coronal Mass Ejection (Solar Particle Event)',
  category: 'radiation',
  icon: 'Zap',
  description: 'Solar observatory sensors detected a Class X solar flare aimed directly along Earth-Moon orbital path. Energetic protons will reach the lunar surface in 2 hours!',
  scienceBackground: 'Because the Moon lacks a global magnetic field and atmosphere, Solar Energetic Particles (SEPs) deliver acute radiation doses unless shielded by thick regolith or active deflectors.',
  options: [
    {
      id: 'shelter-lava-tube',
      label: 'Shelter Crew in Subterranean Lava Tube',
      description: 'Move all 4 astronauts into the deep underground basalt cave and power down external rover telemetry.',
      consequenceSummary: 'Radiation risk drops to zero. Science experiments pause, reducing research output by 20% for 6 hours.',
      applyChanges: (state, settings) => ({
        stateChanges: {
          radiationDoseRateMsvPerHour: 0.02,
          crewMoralePercent: Math.max(0, state.crewMoralePercent - 5),
          cumulativeDoseMsv: state.cumulativeDoseMsv + 0.1,
          powerKwConsumed: Math.max(1.5, state.powerKwConsumed - 1.2),
        },
        settingsChanges: {
          radiationShieldMode: 'subterranean_bunker',
          crewWorkSchedule: 'rest_recovery'
        },
        educationalDebrief: 'Excellent decision! Underground basalt lava tubes provide hundreds of tons of natural rock shielding, completely blocking lethal proton radiation with zero power consumed.'
      })
    },
    {
      id: 'active-deflector-shield',
      label: 'Activate Electromagnetic Shield & Surface Regolith Berm',
      description: 'Keep crew in the main surface dome, ramp magnetic coil deflectors to maximum, and reinforce outer regolith shutters.',
      consequenceSummary: 'Protects the habitat, but draws an extra 3.5 kW of electrical power from battery reserves.',
      applyChanges: (state, settings) => ({
        stateChanges: {
          radiationDoseRateMsvPerHour: 0.15,
          batteryStorageKwh: Math.max(0, state.batteryStorageKwh - 12),
          powerKwConsumed: state.powerKwConsumed + 3.5,
          cumulativeDoseMsv: state.cumulativeDoseMsv + 0.6,
        },
        settingsChanges: {
          radiationShieldMode: 'active_deflector',
          powerPriority: 'life_support'
        },
        educationalDebrief: 'Good technical choice! Active magnetic shielding deflects charged particles like Earth’s magnetosphere does, but relies heavily on your battery bank.'
      })
    },
    {
      id: 'emergency-regolith-berm-only',
      label: 'Passive 2.5m Regolith Berm Only (Conserve Power)',
      description: 'Rely on the existing surface regolith embankment without activating auxiliary electromagnetic deflectors.',
      consequenceSummary: 'Zero extra power consumed, but crew absorbs a mild radiation dose (1.2 mSv) causing minor fatigue.',
      applyChanges: (state, settings) => ({
        stateChanges: {
          radiationDoseRateMsvPerHour: 0.45,
          crewHealthPercent: Math.max(60, state.crewHealthPercent - 8),
          cumulativeDoseMsv: state.cumulativeDoseMsv + 2.4,
        },
        educationalDebrief: 'The 2.5m regolith berm absorbed most of the blast, but secondary neutron backscatter delivered a minor dose to the crew. Underground shelters are safer during extreme storms!'
      })
    }
  ]
};

export const WATER_LEAK_EMERGENCY: EmergencyEvent = {
  id: 'water-filter-anomaly',
  title: 'ECLSS Catalytic Filter Pressure Anomaly',
  category: 'water',
  icon: 'Droplets',
  description: 'A pressure drop in the water recovery loop indicates greywater is bypassing secondary catalytic oxidation. Water recovery efficiency has dropped from 95% to 60%!',
  scienceBackground: 'In a closed-loop habitat, water must undergo distillation, filtration, and catalytic oxidation to remove volatile organic compounds and prevent bacterial biofilms.',
  options: [
    {
      id: 'divert-power-flush',
      label: 'High-Temperature Thermal Purge & Filter Reroute',
      description: 'Divert 2.0 kW of electric power to run a thermal sterilization flush and activate the secondary carbon bed filter.',
      consequenceSummary: 'Restores water recycling to 95% immediately. Increases power drain for 4 hours.',
      applyChanges: (state) => ({
        stateChanges: {
          waterRecyclingEfficiencyPercent: 95,
          powerKwConsumed: state.powerKwConsumed + 2.0,
          crewMoralePercent: Math.min(100, state.crewMoralePercent + 5),
        },
        educationalDebrief: 'Great engineering fix! Thermal purges kill microbial build-up in space plumbing without requiring toxic chemicals that would contaminate the water loop.'
      })
    },
    {
      id: 'manual-cartridge-swap',
      label: 'Crew EVA: Replace Filter Cartridge Manually',
      description: 'Two astronauts suit up for a spacewalk into the unpressurized life support module to swap the filter cartridge.',
      consequenceSummary: 'Saves electrical power, but uses 1.5 kg of airlock oxygen and taxes crew stamina.',
      applyChanges: (state) => ({
        stateChanges: {
          waterRecyclingEfficiencyPercent: 92,
          oxygenKg: Math.max(10, state.oxygenKg - 1.5),
          crewMoralePercent: Math.max(50, state.crewMoralePercent - 4),
        },
        educationalDebrief: 'EVA cartridge replacement is effective! Remember that airlock cycling expels a small amount of pressurized gas into space each time the outer hatch opens.'
      })
    },
    {
      id: 'ration-drinking-water',
      label: 'Institute Water Rationing & Delay Repair',
      description: 'Cut daily greenhouse misting by 50% and limit crew water rations while diagnosing the issue slowly.',
      consequenceSummary: 'Conserves existing water tanks, but greenhouse crop growth pauses and crew morale drops.',
      applyChanges: (state) => ({
        stateChanges: {
          crewMoralePercent: Math.max(40, state.crewMoralePercent - 12),
          foodRationsDays: Math.max(1, state.foodRationsDays - 0.5),
          waterLiters: Math.max(5, state.waterLiters - 2.0),
        },
        educationalDebrief: 'Rationing buys time, but delaying repairs causes compounding resource deficits in a closed loop. Preventive engineering is always safer!'
      })
    }
  ]
};

export const POWER_FAILURE_EMERGENCY: EmergencyEvent = {
  id: 'solar-panel-tracking-failure',
  title: 'Array Tracker Motor Jam During Sunset',
  category: 'power',
  icon: 'BatteryCharging',
  description: 'Lunar regolith dust jammed the pivot motor of Primary Solar Array Alpha as the Sun dips toward the horizon. Solar power output dropped by 65%!',
  scienceBackground: 'Lunar dust particles are sharp, jagged, and electrostatically charged, causing mechanical friction and abrasion in rotating actuators and solar tracking joints.',
  options: [
    {
      id: 'electrostatic-vibration-purge',
      label: 'Trigger Ultrasonic Dust Shaker & Reroute Rover Battery',
      description: 'Send high-frequency acoustic pulses to dislodge dust from the gears and plug in the pressurized lunar rover as an auxiliary battery.',
      consequenceSummary: 'Restores tracker rotation to 85% efficiency. Adds 15 kWh of rover battery reserve.',
      applyChanges: (state) => ({
        stateChanges: {
          powerKwGenerated: state.powerKwGenerated + 4.5,
          batteryStorageKwh: Math.min(state.batteryCapacityKwh, state.batteryStorageKwh + 15),
          habitatIntegrityPercent: Math.min(100, state.habitatIntegrityPercent + 2)
        },
        educationalDebrief: 'Ingenious space engineering! Ultrasonic vibration dislodges static dust without physical brushes that could scratch anti-reflective solar coatings.'
      })
    },
    {
      id: 'emergency-power-shedding',
      label: 'Load Shedding: Turn Off Science Drills & Dim Lights',
      description: 'Switch outpost into Emergency Life-Support Priority mode, turning off exterior floodlights and lunar drills.',
      consequenceSummary: 'Drastically cuts power consumption by 3.2 kW, ensuring batteries last through the dark period.',
      applyChanges: (state) => ({
        stateChanges: {
          powerKwConsumed: Math.max(1.8, state.powerKwConsumed - 3.2),
          crewMoralePercent: Math.max(50, state.crewMoralePercent - 6),
        },
        settingsChanges: {
          powerPriority: 'life_support',
          hydroponicLighting: 'eco_pulse'
        },
        educationalDebrief: 'Classic flight director decision! When power drops unexpectedly, non-vital systems like exterior lights and rock drills are immediately shed to protect life support.'
      })
    }
  ]
};

export const MISSION_SCENARIOS: MissionScenario[] = [
  {
    id: 'mission-1-settlement',
    title: 'First Lunar Settlement',
    subtitle: 'Artemis Base Alpha: Establishing the Baseline Outpost',
    difficulty: 'Junior Cadet',
    durationSols: 7, // 7 lunar days (approx 168 simulation hours)
    initialResources: {
      oxygenKg: 85,
      oxygenCapacityKg: 100,
      oxygenProductionRateKgPerHour: 0.16,
      oxygenConsumptionRateKgPerHour: 0.14,
      waterLiters: 180,
      waterCapacityLiters: 250,
      waterProductionRateLitersPerHour: 1.8,
      waterConsumptionRateLitersPerHour: 1.5,
      waterRecyclingEfficiencyPercent: 88,
      foodRationsDays: 20,
      greenhouseOutputKgPerDay: 1.2,
      powerKwGenerated: 12.5,
      powerKwConsumed: 8.2,
      batteryStorageKwh: 45,
      batteryCapacityKwh: 60,
      radiationShieldIntegrityPercent: 92,
      radiationDoseRateMsvPerHour: 0.025,
      cumulativeDoseMsv: 0.05,
      radiationStatus: 'nominal',
      habitatIntegrityPercent: 98,
      crewMoralePercent: 95,
      crewHealthPercent: 98,
      crewCount: 4,
      missionSol: 1,
      missionHour: 8,
      totalElapsedHours: 0,
      lunarPhase: 'peak_light',
      surfaceTemperatureCelsius: 95
    },
    initialSettings: {
      solarTrackingMode: 'auto',
      dustWipersActive: true,
      powerPriority: 'balanced',
      waterRecyclingMode: 'standard',
      hydroponicLighting: 'full_spectrum',
      thermalRadiatorsMode: 'auto_balanced',
      radiationShieldMode: 'regolith_berm',
      crewWorkSchedule: 'nominal'
    },
    briefing: 'Welcome to Artemis Base Alpha at the Moon’s South Pole, Commander! Your 4-person crew has just docked. Your objective is to calibrate the life support system, keep net electrical power positive, and establish stable recycling loops.',
    primaryObjective: 'Maintain all vital resources (Oxygen, Water, Power) above 50% for 7 Sols while completing the baseline settlement check.',
    secondaryObjectives: [
      'Achieve at least 88% water recycling efficiency',
      'Keep crew morale above 80%',
      'Keep cumulative radiation exposure under 1.5 mSv'
    ],
    keyScienceTakeaway: 'In closed-loop space habitats, life support systems must constantly balance input energy against chemical recycling rates.',
    scheduledEmergency: {
      triggerHour: 48,
      emergency: WATER_LEAK_EMERGENCY
    }
  },
  {
    id: 'mission-2-solar-storm',
    title: 'Solar Storm Survival',
    subtitle: 'Space Weather Emergency: Extreme Proton Radiation',
    difficulty: 'Mission Specialist',
    durationSols: 5,
    initialResources: {
      oxygenKg: 90,
      oxygenCapacityKg: 100,
      oxygenProductionRateKgPerHour: 0.15,
      oxygenConsumptionRateKgPerHour: 0.14,
      waterLiters: 195,
      waterCapacityLiters: 250,
      waterProductionRateLitersPerHour: 1.7,
      waterConsumptionRateLitersPerHour: 1.4,
      waterRecyclingEfficiencyPercent: 90,
      foodRationsDays: 18,
      greenhouseOutputKgPerDay: 1.0,
      powerKwGenerated: 14.0,
      powerKwConsumed: 9.0,
      batteryStorageKwh: 50,
      batteryCapacityKwh: 60,
      radiationShieldIntegrityPercent: 88,
      radiationDoseRateMsvPerHour: 0.03,
      cumulativeDoseMsv: 0.1,
      radiationStatus: 'nominal',
      habitatIntegrityPercent: 94,
      crewMoralePercent: 90,
      crewHealthPercent: 95,
      crewCount: 4,
      missionSol: 1,
      missionHour: 6,
      totalElapsedHours: 0,
      lunarPhase: 'peak_light',
      surfaceTemperatureCelsius: 110
    },
    initialSettings: {
      solarTrackingMode: 'auto',
      dustWipersActive: true,
      powerPriority: 'balanced',
      waterRecyclingMode: 'standard',
      hydroponicLighting: 'full_spectrum',
      thermalRadiatorsMode: 'auto_balanced',
      radiationShieldMode: 'regolith_berm',
      crewWorkSchedule: 'nominal'
    },
    briefing: 'Deep Space Climate Observatory (DSCOVR) has detected an active sunspot region ejecting a massive Coronal Mass Ejection towards the Moon. You must protect your 4 astronauts from dangerous radiation while keeping critical life support running!',
    primaryObjective: 'Survive the 5-Sol solar event with crew cumulative radiation under 3.0 mSv and habitat integrity above 80%.',
    secondaryObjectives: [
      'Deploy either subterranean lava-tube shelter or active deflector shield',
      'Maintain battery storage above 30% throughout high-energy phases',
      'Keep life support oxygen levels nominal'
    ],
    keyScienceTakeaway: 'The Moon has no atmosphere or global magnetic field, making solar weather mitigation the primary safety hurdle for lunar explorers.',
    scheduledEmergency: {
      triggerHour: 24,
      emergency: SOLAR_STORM_EMERGENCY
    }
  },
  {
    id: 'mission-3-water-conservation',
    title: 'Shackleton Water Conservation',
    subtitle: 'Mining Lunar Ice & Perfecting the 98% Closed Loop',
    difficulty: 'Junior Cadet',
    durationSols: 6,
    initialResources: {
      oxygenKg: 78,
      oxygenCapacityKg: 100,
      oxygenProductionRateKgPerHour: 0.14,
      oxygenConsumptionRateKgPerHour: 0.14,
      waterLiters: 120, // Scarce starting water
      waterCapacityLiters: 250,
      waterProductionRateLitersPerHour: 1.2,
      waterConsumptionRateLitersPerHour: 1.6,
      waterRecyclingEfficiencyPercent: 75,
      foodRationsDays: 14,
      greenhouseOutputKgPerDay: 0.8,
      powerKwGenerated: 13.0,
      powerKwConsumed: 8.5,
      batteryStorageKwh: 52,
      batteryCapacityKwh: 60,
      radiationShieldIntegrityPercent: 95,
      radiationDoseRateMsvPerHour: 0.02,
      cumulativeDoseMsv: 0.05,
      radiationStatus: 'nominal',
      habitatIntegrityPercent: 96,
      crewMoralePercent: 88,
      crewHealthPercent: 96,
      crewCount: 4,
      missionSol: 1,
      missionHour: 10,
      totalElapsedHours: 0,
      lunarPhase: 'partial_shade',
      surfaceTemperatureCelsius: -20
    },
    initialSettings: {
      solarTrackingMode: 'auto',
      dustWipersActive: true,
      powerPriority: 'balanced',
      waterRecyclingMode: 'high_yield',
      hydroponicLighting: 'eco_pulse',
      thermalRadiatorsMode: 'auto_balanced',
      radiationShieldMode: 'regolith_berm',
      crewWorkSchedule: 'nominal'
    },
    briefing: 'Water ice rovers exploring Shackleton Crater’s frozen shadow have experienced an actuator freeze, delaying fresh water shipments. You must optimize your outpost’s ECLSS recycling to 95%+ and prevent depletion!',
    primaryObjective: 'End the mission with at least 150 Liters of water stored by maximizing recycling efficiency and managing greenhouse misting.',
    secondaryObjectives: [
      'Upgrade water recycling mode to High Yield without draining batteries',
      'Harvest at least 5 kg of fresh greens from the aeroponic greenhouse',
      'Keep crew hydration and health above 90%'
    ],
    keyScienceTakeaway: 'Water is both drinkable fluid and the source of breathable oxygen through water electrolysis (2H₂O → 2H₂ + O₂).',
    scheduledEmergency: {
      triggerHour: 36,
      emergency: WATER_LEAK_EMERGENCY
    }
  },
  {
    id: 'mission-4-power-failure',
    title: 'The Long Lunar Night & Power Failure',
    subtitle: 'Surviving 14 Earth Days of Freezing Darkness',
    difficulty: 'Flight Commander',
    durationSols: 8,
    initialResources: {
      oxygenKg: 85,
      oxygenCapacityKg: 100,
      oxygenProductionRateKgPerHour: 0.15,
      oxygenConsumptionRateKgPerHour: 0.14,
      waterLiters: 175,
      waterCapacityLiters: 250,
      waterProductionRateLitersPerHour: 1.5,
      waterConsumptionRateLitersPerHour: 1.4,
      waterRecyclingEfficiencyPercent: 85,
      foodRationsDays: 16,
      greenhouseOutputKgPerDay: 0.9,
      powerKwGenerated: 5.2, // Low sun angle
      powerKwConsumed: 8.8,
      batteryStorageKwh: 58,
      batteryCapacityKwh: 70,
      radiationShieldIntegrityPercent: 90,
      radiationDoseRateMsvPerHour: 0.025,
      cumulativeDoseMsv: 0.08,
      radiationStatus: 'nominal',
      habitatIntegrityPercent: 92,
      crewMoralePercent: 86,
      crewHealthPercent: 94,
      crewCount: 4,
      missionSol: 1,
      missionHour: 18,
      totalElapsedHours: 0,
      lunarPhase: 'deep_night',
      surfaceTemperatureCelsius: -130
    },
    initialSettings: {
      solarTrackingMode: 'fixed',
      dustWipersActive: false,
      powerPriority: 'life_support',
      waterRecyclingMode: 'eco',
      hydroponicLighting: 'eco_pulse',
      thermalRadiatorsMode: 'night_insulation',
      radiationShieldMode: 'regolith_berm',
      crewWorkSchedule: 'nominal'
    },
    briefing: 'Night has fallen over the crater floor. Temperatures have plummeted to -130°C and solar arrays are in total shadow. You must manage battery storage with extreme discipline, prioritizing thermal heaters and oxygen generators until dawn!',
    primaryObjective: 'Keep battery storage above zero and maintain habitat heating for the duration of the lunar night.',
    secondaryObjectives: [
      'Activate thermal radiator night insulation to prevent habitat freeze',
      'Keep oxygen supply above 40 kg without exceeding 4 kW consumption',
      'Ensure crew health remains above 85%'
    ],
    keyScienceTakeaway: 'Without sunlight, a lunar base must rely on regenerative fuel cells, chemical batteries, and thermal blankets to survive -130°C cold.',
    scheduledEmergency: {
      triggerHour: 28,
      emergency: POWER_FAILURE_EMERGENCY
    }
  },
  {
    id: 'mission-5-sustainable-base',
    title: 'The Closed-Loop Biosphere',
    subtitle: 'Self-Sustaining Lunar Outpost: Zero-Waste Challenge',
    difficulty: 'Flight Commander',
    durationSols: 10,
    initialResources: {
      oxygenKg: 95,
      oxygenCapacityKg: 100,
      oxygenProductionRateKgPerHour: 0.17,
      oxygenConsumptionRateKgPerHour: 0.14,
      waterLiters: 210,
      waterCapacityLiters: 250,
      waterProductionRateLitersPerHour: 1.8,
      waterConsumptionRateLitersPerHour: 1.4,
      waterRecyclingEfficiencyPercent: 92,
      foodRationsDays: 25,
      greenhouseOutputKgPerDay: 1.6,
      powerKwGenerated: 16.0,
      powerKwConsumed: 9.5,
      batteryStorageKwh: 65,
      batteryCapacityKwh: 75,
      radiationShieldIntegrityPercent: 96,
      radiationDoseRateMsvPerHour: 0.02,
      cumulativeDoseMsv: 0.04,
      radiationStatus: 'nominal',
      habitatIntegrityPercent: 99,
      crewMoralePercent: 96,
      crewHealthPercent: 98,
      crewCount: 4,
      missionSol: 1,
      missionHour: 8,
      totalElapsedHours: 0,
      lunarPhase: 'peak_light',
      surfaceTemperatureCelsius: 75
    },
    initialSettings: {
      solarTrackingMode: 'auto',
      dustWipersActive: true,
      powerPriority: 'balanced',
      waterRecyclingMode: 'high_yield',
      hydroponicLighting: 'full_spectrum',
      thermalRadiatorsMode: 'auto_balanced',
      radiationShieldMode: 'regolith_berm',
      crewWorkSchedule: 'strenuous_research'
    },
    briefing: 'The ultimate Junior Astronaut test! Demonstrate that Artemis Base Alpha can operate as an autonomous closed-loop biosphere, generating surplus oxygen and food while keeping recycling rates near 95% and science drills active.',
    primaryObjective: 'Achieve net-positive water production, 95%+ water recycling, and complete 10 full Sols with crew morale above 90%.',
    secondaryObjectives: [
      'Maintain battery storage above 80% at every sunset',
      'Harvest more than 15 kg of greenhouse vegetables',
      'Resolve all scientific research milestones'
    ],
    keyScienceTakeaway: 'True sustainability in space means turning every waste byproduct (CO2, greywater, organic scraps) into fresh inputs for the next cycle.',
    scheduledEmergency: {
      triggerHour: 72,
      emergency: SOLAR_STORM_EMERGENCY
    }
  }
];

export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first-commander',
    title: 'First Mission Commander',
    description: 'Began your journey as commander of a lunar research outpost.',
    icon: 'Compass',
    category: 'leadership' as const,
    unlocked: true,
    unlockedAt: 'Cadet Induction'
  },
  {
    id: 'power-expert',
    title: 'Power Management Expert',
    description: 'Maintained positive net battery storage through a complete lunar phase.',
    icon: 'BatteryCharging',
    category: 'energy' as const,
    unlocked: false
  },
  {
    id: 'water-champion',
    title: 'Water Conservation Champion',
    description: 'Achieved 95% or higher closed-loop water recovery in the ECLSS loop.',
    icon: 'Droplets',
    category: 'water' as const,
    unlocked: false
  },
  {
    id: 'solar-storm-hero',
    title: 'Solar Storm Survivor',
    description: 'Successfully shielded crew from a simulated Coronal Mass Ejection.',
    icon: 'ShieldAlert',
    category: 'safety' as const,
    unlocked: false
  },
  {
    id: 'greenhouse-master',
    title: 'Lunar Botanist',
    description: 'Harvested fresh hydroponic greens to supplement freeze-dried rations.',
    icon: 'Sprout',
    category: 'science' as const,
    unlocked: false
  },
  {
    id: 'closed-loop-artemis',
    title: 'Master of Artemis Horizon',
    description: 'Successfully completed all 5 Junior Astronaut simulation missions!',
    icon: 'Award',
    category: 'leadership' as const,
    unlocked: false
  }
];
