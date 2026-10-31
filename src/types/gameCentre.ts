export type GameDifficulty = 'explorer' | 'junior_engineer' | 'mission_commander';

export type GameId =
  | 'moon_rover'
  | 'power_grid'
  | 'water_rescue'
  | 'space_farmer'
  | 'solar_storm'
  | 'moon_base'
  // Backward compatibility aliases
  | 'power_station'
  | 'save_every_drop'
  | 'space_farm'
  | 'solar_storm_defender'
  | 'build_lunar_base'
  | 'space_quiz';

export type ArcadeCategory = 'Exploration' | 'Engineering' | 'Science and Survival';

export interface GameScoreRecord {
  gameId: GameId;
  highScore: number;
  stars: number; // 0 to 3
  bestDifficulty: GameDifficulty;
  lastPlayedAt?: string;
  completionsCount: number;
}

export interface GameCentreBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  gameId?: GameId;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameDefinition {
  id: GameId;
  title: string;
  tagline: string;
  category: ArcadeCategory;
  icon: string;
  accentColor: 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose' | 'blue' | 'indigo';
  estimatedMinutes: string;
  scienceFocus: string;
  instructions: {
    objective: string;
    howToPlay: string[];
    proTip: string;
    scienceFact: string;
  };
}
