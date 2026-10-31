import { ResourceState, EngineeringSettings, ResourceLevel } from '../types/simulation';

export interface TickResult {
  nextState: ResourceState;
  logMessages: { type: 'info' | 'warning' | 'alert' | 'success'; message: string; detail?: string }[];
  isMissionOver: boolean;
  victory: boolean;
  failureReason?: string;
}

/**
 * Calculates deterministic simulation tick for 1 hour of mission time.
 */
export function tickSimulation(
  currentState: ResourceState,
  settings: EngineeringSettings,
  targetDurationHours: number
): TickResult {
  const logMessages: { type: 'info' | 'warning' | 'alert' | 'success'; message: string; detail?: string }[] = [];

  const nextHour = (currentState.missionHour + 1) % 24;
  const nextSol = currentState.missionHour === 23 ? currentState.missionSol + 1 : currentState.missionSol;
  const nextTotalHours = currentState.totalElapsedHours + 1;

  // 1. Determine Solar Phase & Environmental Conditions
  // For South Pole peak of light: cycling through high sun, partial rim shade, deep shadow
  let lunarPhase = currentState.lunarPhase;
  let baseSolarPotentialKw = 14.5;
  let surfaceTemp = 60; // °C

  // 24 hours per Sol. In South Pole region:
  const phaseCycle = nextHour % 24;
  if (phaseCycle >= 6 && phaseCycle < 18) {
    lunarPhase = 'peak_light';
    baseSolarPotentialKw = 15.0;
    surfaceTemp = 85;
  } else if (phaseCycle >= 18 && phaseCycle < 22) {
    lunarPhase = 'partial_shade';
    baseSolarPotentialKw = 7.5;
    surfaceTemp = -20;
  } else {
    lunarPhase = 'deep_night';
    baseSolarPotentialKw = 1.0; // slight scattered light
    surfaceTemp = -130;
  }

  // 2. Power Generation & Consumption
  // Solar tracking and dust wipers impact
  let trackingMultiplier = 1.0;
  if (settings.solarTrackingMode === 'fixed') {
    trackingMultiplier = 0.65;
  } else if (settings.solarTrackingMode === 'storm_feathered') {
    trackingMultiplier = 0.25; // angled to avoid dust/micrometeorites
  }

  // Dust accumulation penalty if wipers are off
  const dustMultiplier = settings.dustWipersActive ? 1.0 : 0.82;
  const powerKwGenerated = Number((baseSolarPotentialKw * trackingMultiplier * dustMultiplier).toFixed(2));

  // Power Consumption breakdown
  // Baseline life support: ~3.5 kW
  let baseConsumption = 3.5;

  // Water recycling mode
  let waterRecycleKw = 1.2;
  let waterRecoveryRate = 88;
  if (settings.waterRecyclingMode === 'high_yield') {
    waterRecycleKw = 2.4;
    waterRecoveryRate = 96;
  } else if (settings.waterRecyclingMode === 'eco') {
    waterRecycleKw = 0.5;
    waterRecoveryRate = 72;
  }

  // Hydroponic lighting
  let greenhouseKw = 2.0;
  let cropGrowthRate = 1.2;
  if (settings.hydroponicLighting === 'eco_pulse') {
    greenhouseKw = 0.8;
    cropGrowthRate = 0.7;
  } else if (settings.hydroponicLighting === 'dormant') {
    greenhouseKw = 0.0;
    cropGrowthRate = 0.1;
  }

  // Radiation shield power
  let shieldPowerKw = 0.0;
  if (settings.radiationShieldMode === 'active_deflector') {
    shieldPowerKw = 2.2;
  }

  // Thermal radiators (night heating draws power)
  let thermalPowerKw = 0.8;
  if (lunarPhase === 'deep_night') {
    thermalPowerKw = settings.thermalRadiatorsMode === 'night_insulation' ? 1.5 : 3.0;
  }

  // Dust wipers draw tiny power
  const dustWiperKw = settings.dustWipersActive ? 0.2 : 0.0;

  // Schedule modifier
  let crewActivityKw = 0.6;
  if (settings.crewWorkSchedule === 'strenuous_research') {
    crewActivityKw = 1.5;
  } else if (settings.crewWorkSchedule === 'rest_recovery') {
    crewActivityKw = 0.2;
  }

  // Priority adjustments
  let totalConsumption = baseConsumption + waterRecycleKw + greenhouseKw + shieldPowerKw + thermalPowerKw + dustWiperKw + crewActivityKw;
  if (settings.powerPriority === 'life_support') {
    totalConsumption = totalConsumption * 0.85; // non-vital dimming
  } else if (settings.powerPriority === 'emergency_survival') {
    totalConsumption = Math.max(2.8, totalConsumption * 0.65);
  }

  const powerKwConsumed = Number(totalConsumption.toFixed(2));
  const netPowerKw = powerKwGenerated - powerKwConsumed;

  // Battery bank charging / discharging
  let nextBatteryKwh = currentState.batteryStorageKwh + netPowerKw; // 1 hr tick = 1 kW * 1h = 1 kWh
  nextBatteryKwh = Math.max(0, Math.min(currentState.batteryCapacityKwh, Number(nextBatteryKwh.toFixed(2))));

  // 3. Oxygen Calculations
  // 4 crew consume ~0.14 kg O2 per hour (0.035 kg/crew/hour)
  const o2Consumption = Number((currentState.crewCount * 0.035).toFixed(3));
  // Sabatier / Electrolysis production + greenhouse release
  const plantO2Bonus = settings.hydroponicLighting === 'full_spectrum' ? 0.025 : 0.008;
  const o2Production = Number((0.12 + plantO2Bonus).toFixed(3));
  const netO2 = o2Production - o2Consumption;
  let nextOxygenKg = Math.max(0, Math.min(currentState.oxygenCapacityKg, Number((currentState.oxygenKg + netO2).toFixed(2))));

  // 4. Water Calculations
  // 4 crew consume ~0.45 L/hr for drinking & hydration
  const waterConsumption = Number((currentState.crewCount * 0.115).toFixed(3));
  // Recovery from greywater condenser
  const waterProduced = Number((waterConsumption * (waterRecoveryRate / 100)).toFixed(3));
  const netWater = waterProduced - waterConsumption;
  let nextWaterLiters = Math.max(0, Math.min(currentState.waterCapacityLiters, Number((currentState.waterLiters + netWater).toFixed(2))));

  // 5. Food & Nutrition
  // 1 day ration per 24 hours
  let nextFoodRations = currentState.foodRationsDays - (1 / 24);
  // Greenhouse fresh supplement adds rations
  if (cropGrowthRate > 0.8 && nextHour === 12) {
    nextFoodRations += 0.25; // harvest supplement
    logMessages.push({
      type: 'success',
      message: 'Greenhouse Harvest Cycle',
      detail: 'Harvested fresh hydroponic greens, extending food reserves!'
    });
  }
  nextFoodRations = Math.max(0, Number(nextFoodRations.toFixed(2)));

  // 6. Radiation and Shielding
  let shieldEfficiency = 85;
  let ambientDoseRate = 0.02; // nominal mSv/h

  if (settings.radiationShieldMode === 'regolith_berm') {
    shieldEfficiency = 92;
    ambientDoseRate = 0.025;
  } else if (settings.radiationShieldMode === 'active_deflector') {
    shieldEfficiency = 97;
    ambientDoseRate = 0.012;
  } else if (settings.radiationShieldMode === 'subterranean_bunker') {
    shieldEfficiency = 99;
    ambientDoseRate = 0.005;
  }

  const nextCumulativeDose = Number((currentState.cumulativeDoseMsv + ambientDoseRate).toFixed(3));
  let radiationStatus: ResourceLevel = 'nominal';
  if (ambientDoseRate > 1.0) radiationStatus = 'critical';
  else if (ambientDoseRate > 0.2 || nextCumulativeDose > 2.5) radiationStatus = 'elevated';

  // 7. Habitat and Crew Wellbeing
  let nextHealth = currentState.crewHealthPercent;
  let nextMorale = currentState.crewMoralePercent;
  let nextIntegrity = currentState.habitatIntegrityPercent;

  // Battery deficit impacts
  if (nextBatteryKwh <= 5) {
    nextMorale = Math.max(20, nextMorale - 2);
    logMessages.push({
      type: 'warning',
      message: 'Critical Battery Storage',
      detail: 'Battery reserves dropped below 10%. Habitat heaters are throttling.'
    });
  }

  // Work schedule impacts
  if (settings.crewWorkSchedule === 'strenuous_research') {
    nextMorale = Math.max(30, nextMorale - 0.4);
  } else if (settings.crewWorkSchedule === 'rest_recovery') {
    nextMorale = Math.min(100, nextMorale + 1.2);
    nextHealth = Math.min(100, nextHealth + 0.8);
  }

  // Oxygen deficits impact health immediately
  if (nextOxygenKg < 20) {
    nextHealth = Math.max(0, nextHealth - 4);
    logMessages.push({
      type: 'alert',
      message: 'Low Oxygen Warning',
      detail: 'Base atmospheric pressure and oxygen partial pressure are dropping!'
    });
  }

  // Check victory / failure conditions
  let isMissionOver = false;
  let victory = false;
  let failureReason: string | undefined;

  if (nextOxygenKg <= 0) {
    isMissionOver = true;
    victory = false;
    failureReason = 'Oxygen tanks were completely depleted. The life support loop shut down.';
  } else if (nextWaterLiters <= 0) {
    isMissionOver = true;
    victory = false;
    failureReason = 'Potable water supply was exhausted. Crew hydration could not be sustained.';
  } else if (nextHealth <= 20) {
    isMissionOver = true;
    victory = false;
    failureReason = 'Crew health fell to dangerous levels due to environmental hazards or extreme exhaustion.';
  } else if (nextTotalHours >= targetDurationHours) {
    isMissionOver = true;
    victory = true;
  }

  const nextState: ResourceState = {
    ...currentState,
    oxygenKg: nextOxygenKg,
    oxygenProductionRateKgPerHour: o2Production,
    oxygenConsumptionRateKgPerHour: o2Consumption,
    waterLiters: nextWaterLiters,
    waterProductionRateLitersPerHour: waterProduced,
    waterConsumptionRateLitersPerHour: waterConsumption,
    waterRecyclingEfficiencyPercent: waterRecoveryRate,
    foodRationsDays: nextFoodRations,
    powerKwGenerated,
    powerKwConsumed,
    batteryStorageKwh: nextBatteryKwh,
    radiationShieldIntegrityPercent: shieldEfficiency,
    radiationDoseRateMsvPerHour: ambientDoseRate,
    cumulativeDoseMsv: nextCumulativeDose,
    radiationStatus,
    habitatIntegrityPercent: Number(nextIntegrity.toFixed(1)),
    crewMoralePercent: Number(nextMorale.toFixed(1)),
    crewHealthPercent: Number(nextHealth.toFixed(1)),
    missionSol: nextSol,
    missionHour: nextHour,
    totalElapsedHours: nextTotalHours,
    lunarPhase,
    surfaceTemperatureCelsius: surfaceTemp
  };

  return {
    nextState,
    logMessages,
    isMissionOver,
    victory,
    failureReason
  };
}

/**
 * Generates plain-language, child-friendly cause-and-effect explanations
 * when an engineering parameter changes.
 */
export function explainDecisionEffect(
  key: keyof EngineeringSettings,
  value: string | boolean
): string {
  switch (key) {
    case 'waterRecyclingMode':
      if (value === 'high_yield') {
        return 'High Yield Mode: Maximizes water recovery to 96% (+2.4 L/hr), but draws 2.4 kW of extra electricity from the battery.';
      } else if (value === 'eco') {
        return 'Eco Mode: Conserves electricity (only 0.5 kW), but water recycling drops to 72%, causing gradual water loss.';
      }
      return 'Standard Mode: Balanced closed-loop recycling at 88% efficiency with steady 1.2 kW power draw.';

    case 'hydroponicLighting':
      if (value === 'full_spectrum') {
        return 'Full Spectrum LED: Plants grow quickly and produce bonus oxygen (+0.025 kg/h), drawing 2.0 kW of electricity.';
      } else if (value === 'eco_pulse') {
        return 'Eco Pulse LED: Keeps plants alive using only 0.8 kW, with slower vegetable harvest cycles.';
      }
      return 'Dormant Mode: Turns off greenhouse lights completely. Saves 2.0 kW, but plants produce zero fresh vegetables or oxygen.';

    case 'solarTrackingMode':
      if (value === 'auto') {
        return 'Auto Sun Tracking: Motors continuously angle panels toward the Sun for maximum power generation (+100% capacity).';
      } else if (value === 'storm_feathered') {
        return 'Storm Feathered: Panels are flattened and protected from micrometeorites, reducing generation by 75%.';
      }
      return 'Fixed Position: Saves tracking motor wear, but captures 35% less sunlight as the Sun shifts across the sky.';

    case 'dustWipersActive':
      if (value) {
        return 'Acoustic Dust Wipers ON: Vibrates sharp regolith dust off solar panels, keeping sunlight absorption at 100%.';
      }
      return 'Dust Wipers OFF: Lunar dust accumulates on solar glass, causing power output to degrade by ~18%.';

    case 'radiationShieldMode':
      if (value === 'subterranean_bunker') {
        return 'Subterranean Lava Tube: Crew moves into underground basalt rock shelter. 99% radiation blocking with 0 kW power needed!';
      } else if (value === 'active_deflector') {
        return 'Active Electromagnetic Deflector: Magnetic field repels charged solar protons (97% shield), drawing 2.2 kW power.';
      }
      return 'Standard Regolith Berm: 2.5m packed lunar soil absorbs 92% of everyday cosmic rays passively.';

    case 'powerPriority':
      if (value === 'life_support') {
        return 'Life Support Priority: Dims non-essential lights and pauses rock drills to guarantee oxygen generators and water filters stay online.';
      } else if (value === 'emergency_survival') {
        return 'Emergency Survival: Drastically cuts all secondary systems by 35% to stretch battery reserves during long dark periods.';
      }
      return 'Balanced Power: Evenly distributes electricity between life support, hydroponics, science lab, and exterior lights.';

    case 'crewWorkSchedule':
      if (value === 'strenuous_research') {
        return 'Intensive Science: Accelerates research and mission score, but slightly increases crew fatigue and daily food consumption.';
      } else if (value === 'rest_recovery') {
        return 'Rest & Recovery: Astronauts rest and exercise, boosting crew morale and health while science operations pause.';
      }
      return 'Nominal Schedule: Standard 8-hour shift routine balancing research, maintenance, and sleep.';

    case 'thermalRadiatorsMode':
      if (value === 'night_insulation') {
        return 'Night Insulation Mode: Deploys reflective thermal blankets to trap base heat during freezing -130°C lunar night.';
      } else if (value === 'max_cooling') {
        return 'Maximum Cooling: Expands radiator surface to dump excess equipment heat during blazing +120°C midday sun.';
      }
      return 'Auto-Balanced Radiators: Heat pipes automatically modulate between heat rejection and thermal retention.';

    default:
      return 'Engineering setting adjusted. Telemetry updated.';
  }
}
