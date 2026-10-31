export type ResourceLevel = 'nominal' | 'elevated' | 'critical' | 'depleted';

export interface ResourceState {
  // Atmospheric & Life Support
  oxygenKg: number; // in kg (e.g. 100 kg nominal tank)
  oxygenCapacityKg: number;
  oxygenProductionRateKgPerHour: number;
  oxygenConsumptionRateKgPerHour: number;

  // Water Management
  waterLiters: number; // in liters
  waterCapacityLiters: number;
  waterProductionRateLitersPerHour: number;
  waterConsumptionRateLitersPerHour: number;
  waterRecyclingEfficiencyPercent: number; // e.g. 75% to 95%

  // Nutrition
  foodRationsDays: number; // days of rations left
  greenhouseOutputKgPerDay: number;

  // Electrical Power
  powerKwGenerated: number;
  powerKwConsumed: number;
  batteryStorageKwh: number;
  batteryCapacityKwh: number;

  // Radiation & Shielding
  radiationShieldIntegrityPercent: number; // 0 - 100%
  radiationDoseRateMsvPerHour: number; // nominal: 0.02 mSv/h, elevated: 0.5 mSv/h, storm: 5.0 mSv/h
  cumulativeDoseMsv: number;
  radiationStatus: ResourceLevel;

  // Habitat & Crew
  habitatIntegrityPercent: number; // 0 - 100%
  crewMoralePercent: number; // 0 - 100%
  crewHealthPercent: number; // 0 - 100%
  crewCount: number;

  // Time & Environment
  missionSol: number; // Lunar day / sol counter
  missionHour: number; // 0 - 23
  totalElapsedHours: number;
  lunarPhase: 'peak_light' | 'partial_shade' | 'deep_night' | 'solar_storm';
  surfaceTemperatureCelsius: number; // e.g. +120°C during day, -130°C at night
}

export interface TelemetryHistoryPoint {
  elapsedHour: number;
  sol: number;
  hour: number;
  oxygenKg: number;
  waterLiters: number;
  batteryKwh: number;
  foodDays: number;
  netPowerKw: number;
}

export interface SavedMissionSession {
  scenarioId: string;
  resourceState: ResourceState;
  settings: EngineeringSettings;
  telemetryHistory: TelemetryHistoryPoint[];
  hasTriggeredScheduledEmergency: boolean;
  savedAt: string;
}

export interface EngineeringSettings {
  solarTrackingMode: 'auto' | 'fixed' | 'storm_feathered';
  dustWipersActive: boolean;
  powerPriority: 'balanced' | 'life_support' | 'science' | 'emergency_survival';
  waterRecyclingMode: 'standard' | 'high_yield' | 'eco';
  hydroponicLighting: 'full_spectrum' | 'eco_pulse' | 'dormant';
  thermalRadiatorsMode: 'auto_balanced' | 'night_insulation' | 'max_cooling';
  radiationShieldMode: 'regolith_berm' | 'active_deflector' | 'subterranean_bunker';
  crewWorkSchedule: 'nominal' | 'strenuous_research' | 'rest_recovery';
}

export interface EmergencyOption {
  id: string;
  label: string;
  description: string;
  consequenceSummary: string;
  applyChanges: (state: ResourceState, settings: EngineeringSettings) => {
    stateChanges: Partial<ResourceState>;
    settingsChanges?: Partial<EngineeringSettings>;
    educationalDebrief: string;
  };
}

export interface EmergencyEvent {
  id: string;
  title: string;
  category: 'radiation' | 'power' | 'water' | 'atmosphere' | 'communication';
  description: string;
  scienceBackground: string;
  options: EmergencyOption[];
  icon: string;
}

export interface MissionScenario {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Junior Cadet' | 'Mission Specialist' | 'Flight Commander';
  durationSols: number;
  initialResources: Partial<ResourceState>;
  initialSettings: EngineeringSettings;
  briefing: string;
  primaryObjective: string;
  secondaryObjectives: string[];
  keyScienceTakeaway: string;
  scheduledEmergency?: {
    triggerHour: number;
    emergency: EmergencyEvent;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'energy' | 'water' | 'leadership' | 'science' | 'safety';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface MissionLogEntry {
  id: string;
  sol: number;
  hour: number;
  type: 'info' | 'decision' | 'warning' | 'alert' | 'success';
  message: string;
  detail?: string;
}

export interface MissionResult {
  missionId: string;
  success: boolean;
  score: number;
  solsCompleted: number;
  finalResources: ResourceState;
  decisionsMadeCount: number;
  emergenciesResolvedCount: number;
  lessonsLearned: string[];
  scientificInsights: string[];
  ratingBadge: 'Bronze Rover' | 'Silver Explorer' | 'Gold Commander' | 'Master of the Artemis Horizon';
}
