import React, { useState, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Layers,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Users,
  Shield,
  Trash2,
  CheckCircle2,
  Download
} from 'lucide-react';

interface BuildLunarBaseGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

type ModuleType =
  | 'hab_core'
  | 'greenhouse'
  | 'solar_field'
  | 'battery_vault'
  | 'water_drill'
  | 'science_lab'
  | 'regolith_berm'
  | 'corridor';

interface BaseModuleCatalogItem {
  type: ModuleType;
  name: string;
  icon: string;
  powerKwDelta: number;
  crewCapacity: number;
  foodLitersNote: string;
  shieldBonus: number;
  costPoints: number;
  description: string;
}

const MODULE_CATALOG: BaseModuleCatalogItem[] = [
  {
    type: 'hab_core',
    name: 'Habitation Core',
    icon: '🏠',
    powerKwDelta: -2.0,
    crewCapacity: 2,
    foodLitersNote: 'Crew quarters & life support',
    shieldBonus: 5,
    costPoints: 100,
    description: 'Pressurized living quarters supporting 2 astronauts.'
  },
  {
    type: 'greenhouse',
    name: 'Hydroponic Dome',
    icon: '🌱',
    powerKwDelta: -2.0,
    crewCapacity: 0,
    foodLitersNote: '+1.5 kg food/day & O2',
    shieldBonus: 2,
    costPoints: 120,
    description: 'Grows fresh salads, wheat, and produces oxygen.'
  },
  {
    type: 'solar_field',
    name: 'Solar Array Tower',
    icon: '☀️',
    powerKwDelta: +6.0,
    crewCapacity: 0,
    foodLitersNote: 'Clean electric generation',
    shieldBonus: 0,
    costPoints: 80,
    description: 'Tall tracking photovoltaic tower for polar peaks.'
  },
  {
    type: 'battery_vault',
    name: 'Battery Energy Vault',
    icon: '🔋',
    powerKwDelta: 0,
    crewCapacity: 0,
    foodLitersNote: '+30 kWh backup storage',
    shieldBonus: 5,
    costPoints: 90,
    description: 'Stores energy for long lunar shadow periods.'
  },
  {
    type: 'water_drill',
    name: 'Ice Extraction Rig',
    icon: '💧',
    powerKwDelta: -3.0,
    crewCapacity: 0,
    foodLitersNote: '+40 L water ice/day',
    shieldBonus: 0,
    costPoints: 110,
    description: 'Taps subsurface permafrost ice volatiles.'
  },
  {
    type: 'science_lab',
    name: 'Geology & Science Lab',
    icon: '🔬',
    powerKwDelta: -2.5,
    crewCapacity: 0,
    foodLitersNote: '+15 research score',
    shieldBonus: 5,
    costPoints: 130,
    description: 'Analyzes lunar regolith samples and volcanic glass.'
  },
  {
    type: 'regolith_berm',
    name: 'Regolith Shield Wall',
    icon: '🧱',
    powerKwDelta: 0,
    crewCapacity: 0,
    foodLitersNote: '+20% Radiation Shielding',
    shieldBonus: 20,
    costPoints: 60,
    description: 'Heavy 3-meter lunar soil embankment to block radiation.'
  },
  {
    type: 'corridor',
    name: 'Pressurized Corridor',
    icon: '🚇',
    powerKwDelta: -0.5,
    crewCapacity: 0,
    foodLitersNote: 'Connects base zones',
    shieldBonus: 2,
    costPoints: 40,
    description: 'Airlock tunnel linking separate modules together.'
  }
];

const GRID_SIZE = 6; // 6x6 grid = 36 tiles

const BASE_DIFFICULTY_GOALS: Record<GameDifficulty, { minCrew: number; minGreenhouses: number; minDrills: number; minShield: number; label: string }> = {
  explorer: { minCrew: 2, minGreenhouses: 0, minDrills: 0, minShield: 20, label: 'Support 2 crew with positive power' },
  junior_engineer: { minCrew: 4, minGreenhouses: 1, minDrills: 1, minShield: 40, label: 'Support 4 crew, 1 greenhouse, 1 ice drill' },
  mission_commander: { minCrew: 6, minGreenhouses: 2, minDrills: 1, minShield: 65, label: 'Colony: 6 crew, 2 greenhouses, 1 drill, 1 lab, 65%+ shielding' }
};

export const BuildLunarBaseGame: React.FC<BuildLunarBaseGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'build_lunar_base')!;
  const difficultyGoals = BASE_DIFFICULTY_GOALS[difficulty];

  // State
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<ModuleType | 'demolish'>('hab_core');
  const [baseGrid, setBaseGrid] = useState<Record<number, ModuleType>>({
    // Pre-place 1 Hab and 1 Solar field for welcoming start
    14: 'hab_core',
    15: 'corridor',
    16: 'solar_field'
  });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [architectLog, setArchitectLog] = useState<string>('Select a module from the blueprint palette and place it on the lunar grid!');
  const hasSavedRef = useRef<boolean>(false);

  const resetBase = useCallback(() => {
    hasSavedRef.current = false;
    setBaseGrid({
      14: 'hab_core',
      15: 'corridor',
      16: 'solar_field'
    });
    setSelectedTool('hab_core');
    setIsGameOver(false);
    setScore(0);
    setArchitectLog('Base blueprint reset. Ready for new architectural layout.');
  }, []);

  // Handle tile click
  const handleTileClick = (index: number) => {
    if (isGameOver) return;

    if (selectedTool === 'demolish') {
      if (baseGrid[index]) {
        sound.playThud();
        setBaseGrid(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
        setArchitectLog(`Demolished module at sector [${Math.floor(index / GRID_SIZE)}, ${index % GRID_SIZE}].`);
      }
      return;
    }

    // Place selected module
    sound.playPowerUp();
    setBaseGrid(prev => ({
      ...prev,
      [index]: selectedTool
    }));
    const item = MODULE_CATALOG.find(m => m.type === selectedTool);
    setArchitectLog(`Constructed ${item?.name} at sector [${Math.floor(index / GRID_SIZE)}, ${index % GRID_SIZE}].`);
  };

  // Compute Base Statistics
  const placedModules = Object.values(baseGrid);
  const totalCrewCapacity = placedModules.reduce((sum, type) => {
    const item = MODULE_CATALOG.find(m => m.type === type);
    return sum + (item?.crewCapacity || 0);
  }, 0);

  const netPowerKw = Number(
    placedModules
      .reduce((sum, type) => {
        const item = MODULE_CATALOG.find(m => m.type === type);
        return sum + (item?.powerKwDelta || 0);
      }, 0)
      .toFixed(1)
  );

  const greenhouseCount = placedModules.filter(t => t === 'greenhouse').length;
  const drillCount = placedModules.filter(t => t === 'water_drill').length;
  const labCount = placedModules.filter(t => t === 'science_lab').length;

  const totalShieldPercent = Math.min(
    100,
    placedModules.reduce((sum, type) => {
      const item = MODULE_CATALOG.find(m => m.type === type);
      return sum + (item?.shieldBonus || 0);
    }, 0)
  );

  // Check if current goals are met
  const isGoalMet =
    totalCrewCapacity >= difficultyGoals.minCrew &&
    netPowerKw >= 0 &&
    greenhouseCount >= difficultyGoals.minGreenhouses &&
    drillCount >= difficultyGoals.minDrills &&
    totalShieldPercent >= difficultyGoals.minShield &&
    (difficulty !== 'mission_commander' || labCount >= 1);

  // Certify and Submit Base
  const handleCertifyBase = () => {
    if (!isGoalMet) {
      sound.playAlert();
      setArchitectLog('Goal requirements incomplete! Review mission criteria.');
      return;
    }

    sound.playSuccess();
    const finalScore = Math.round(
      totalCrewCapacity * 250 +
      Math.max(0, netPowerKw) * 80 +
      greenhouseCount * 200 +
      drillCount * 200 +
      totalShieldPercent * 10 +
      labCount * 250
    );

    setScore(finalScore);
    setIsGameOver(true);

    const stars =
      difficulty === 'mission_commander' && finalScore >= 2000
        ? 3
        : finalScore >= 1400
        ? 3
        : finalScore >= 900
        ? 2
        : 1;

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      onSaveScore(finalScore, stars);
    }
  };

  const starsEarned = score >= 1400 ? 3 : score >= 900 ? 2 : score > 0 ? 1 : 0;

  return (
    <div className="space-y-4">
      {/* Instructions Modal */}
      {showInstructions && (
        <GameInstructionsModal
          game={gameDef}
          difficulty={difficulty}
          onStartGame={() => setShowInstructions(false)}
          onClose={() => setShowInstructions(false)}
        />
      )}

      {/* Result Debrief */}
      {isGameOver && (
        <GameResultDebrief
          gameTitle={gameDef.title}
          difficulty={difficulty}
          score={score}
          highScore={Math.max(highScore, score)}
          starsEarned={starsEarned}
          isNewHighScore={score > highScore}
          scienceTakeaway="Permanent lunar outposts require modular expansion: pairing high-yield solar towers with regolith radiation shields, greenhouse biospheres, and deep ice drills."
          statsSummary={[
            { label: 'Astronaut Capacity', value: `${totalCrewCapacity} Crew` },
            { label: 'Net Power Flux', value: `${netPowerKw > 0 ? '+' : ''}${netPowerKw} kW` },
            { label: 'Radiation Shielding', value: `${totalShieldPercent}%` }
          ]}
          onReplay={resetBase}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}

      {/* Top Arcade Bar */}
      <div className="bg-[#0B132B] border border-cyan-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-cyan-950/30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBackToHub();
            }}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            ← Arcade
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Build Your Lunar Base</h1>
              <span className="text-xs font-mono text-indigo-300 uppercase px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 font-semibold">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Objective: {difficultyGoals.label}
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          {/* Crew */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Users className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Crew Support</div>
              <div className="font-mono font-bold text-cyan-300">
                {totalCrewCapacity} / {difficultyGoals.minCrew}
              </div>
            </div>
          </div>

          {/* Net Power */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Zap className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Net Power</div>
              <div className={`font-mono font-bold ${netPowerKw >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPowerKw > 0 ? `+${netPowerKw}` : netPowerKw} kW
              </div>
            </div>
          </div>

          {/* Shield */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Shield className="w-4 h-4 text-rose-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Shielding</div>
              <div className="font-mono font-bold text-rose-300">{totalShieldPercent}%</div>
            </div>
          </div>

          {/* Controls */}
          <button
            onClick={() => setShowInstructions(true)}
            title="How to play"
            className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              resetBase();
            }}
            title="Reset base layout"
            className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMuted(sound.toggleMute())}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Architect Guidance Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
          <span><strong>Lead Space Architect:</strong> {architectLog}</span>
        </div>
        <div>
          {isGoalMet ? (
            <button
              onClick={handleCertifyBase}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs shadow-md shadow-emerald-500/30 animate-pulse whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Certify Blueprint & Finish!</span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-amber-300">
              Needs: {difficultyGoals.label}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid Viewport and Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 6x6 Blueprint Grid (8 cols on lg) */}
        <div className="lg:col-span-7 bg-[#050811] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
            <span>South Pole Rim Sector Grid (6 × 6)</span>
            <span className="text-cyan-400">Placed: {placedModules.length} Modules</span>
          </div>

          <div
            className="grid gap-2 mx-auto select-none aspect-square"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              maxWidth: '460px'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const placedType = baseGrid[idx];
              const item = placedType ? MODULE_CATALOG.find(m => m.type === placedType) : null;

              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 relative transition-all duration-150 ${
                    item
                      ? 'bg-slate-900/90 border-cyan-500/60 shadow-sm hover:scale-105'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  {item ? (
                    <div className="text-center">
                      <span className="text-xl sm:text-2xl">{item.icon}</span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-cyan-300 font-bold block leading-none mt-1 truncate max-w-[50px]">
                        {item.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-700 font-mono">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Module Catalog Palette (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#070B14] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-white uppercase tracking-wider">
              Module Construction Palette
            </span>
            <button
              onClick={() => {
                sound.playClick();
                setSelectedTool('demolish');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                selectedTool === 'demolish'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Demolish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
            {MODULE_CATALOG.map(mod => {
              const isSelected = selectedTool === mod.type;
              return (
                <button
                  key={mod.type}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTool(mod.type);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{mod.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{mod.name}</span>
                      <span className="text-[10px] font-mono text-cyan-300 font-bold shrink-0 ml-1">
                        {mod.powerKwDelta > 0 ? `+${mod.powerKwDelta} kW` : mod.powerKwDelta < 0 ? `${mod.powerKwDelta} kW` : 'Passive'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {mod.description}
                    </p>
                    <div className="text-[9px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                      {mod.crewCapacity > 0 && <span className="text-cyan-400">+{mod.crewCapacity} Crew</span>}
                      {mod.shieldBonus > 0 && <span className="text-rose-400">+{mod.shieldBonus}% Shield</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
