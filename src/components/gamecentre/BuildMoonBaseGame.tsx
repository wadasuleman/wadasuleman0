import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Building2,
  Sun,
  Zap,
  Users,
  Shield,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Droplets,
  Sprout,
  FlaskConical,
  Trash2,
  Award
} from 'lucide-react';

interface BuildMoonBaseGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

export type ModuleType =
  | 'hab_dome'
  | 'solar_array'
  | 'hydroponics'
  | 'ice_drill'
  | 'science_lab'
  | 'radiation_berm'
  | 'corridor';

interface BaseModuleDef {
  type: ModuleType;
  name: string;
  icon: string;
  costBlocks: number;
  powerKw: number; // positive = generation, negative = consumption
  crewBerths: number;
  waterDaily: number;
  foodDaily: number;
  shieldingPct: number;
  description: string;
}

const MODULE_CATALOG: BaseModuleDef[] = [
  {
    type: 'hab_dome',
    name: 'Habitation Dome',
    icon: '🏠',
    costBlocks: 25,
    powerKw: -12,
    crewBerths: 4,
    waterDaily: -15,
    foodDaily: -12,
    shieldingPct: 10,
    description: 'Pressurized living quarters with bunks and life support for 4 astronauts.'
  },
  {
    type: 'solar_array',
    name: 'Solar Panel Array',
    icon: '☀️',
    costBlocks: 15,
    powerKw: +28,
    crewBerths: 0,
    waterDaily: 0,
    foodDaily: 0,
    shieldingPct: 0,
    description: 'High-efficiency photovoltaic masts tracking the low lunar sun.'
  },
  {
    type: 'hydroponics',
    name: 'Hydroponic Greenhouse',
    icon: '🌱',
    costBlocks: 20,
    powerKw: -8,
    crewBerths: 0,
    waterDaily: -10,
    foodDaily: +20,
    shieldingPct: 5,
    description: 'Closed-loop LED farming beds providing fresh greens and oxygen.'
  },
  {
    type: 'ice_drill',
    name: 'Polar Ice Harvester',
    icon: '⛏️',
    costBlocks: 20,
    powerKw: -10,
    crewBerths: 0,
    waterDaily: +30,
    foodDaily: 0,
    shieldingPct: 0,
    description: 'Thermal sublimator extracting ancient water ice from permanently shadowed craters.'
  },
  {
    type: 'science_lab',
    name: 'Lunar Science Lab',
    icon: '🔬',
    costBlocks: 30,
    powerKw: -14,
    crewBerths: 0,
    waterDaily: -5,
    foodDaily: 0,
    shieldingPct: 15,
    description: 'Geology & astrophysics research workstation analyzing lunar core samples.'
  },
  {
    type: 'radiation_berm',
    name: 'Regolith Berm Shield',
    icon: '🛡️',
    costBlocks: 10,
    powerKw: 0,
    crewBerths: 0,
    waterDaily: 0,
    foodDaily: 0,
    shieldingPct: 25,
    description: '3-meter-thick bulldozed lunar regolith barricade against cosmic radiation.'
  },
  {
    type: 'corridor',
    name: 'Pressurized Corridor',
    icon: '🔗',
    costBlocks: 5,
    powerKw: -2,
    crewBerths: 0,
    waterDaily: 0,
    foodDaily: 0,
    shieldingPct: 5,
    description: 'Airtight walkway connecting adjacent habitat modules.'
  }
];

interface BaseDifficultyGoals {
  name: string;
  minCrew: number;
  minNetPower: number;
  minShieldingPct: number;
  requireLab: boolean;
  budgetBlocks: number;
}

const DIFFICULTY_CONFIG: Record<GameDifficulty, BaseDifficultyGoals> = {
  explorer: {
    name: 'Shackleton Outpost',
    minCrew: 4,
    minNetPower: 5,
    minShieldingPct: 20,
    requireLab: false,
    budgetBlocks: 120
  },
  junior_engineer: {
    name: 'Artemis Research Camp',
    minCrew: 6,
    minNetPower: 15,
    minShieldingPct: 40,
    requireLab: true,
    budgetBlocks: 160
  },
  mission_commander: {
    name: 'Permanent Lunar Settlement',
    minCrew: 8,
    minNetPower: 25,
    minShieldingPct: 60,
    requireLab: true,
    budgetBlocks: 200
  }
};

const GRID_SIZE = 5; // 5x5 grid

export const BuildMoonBaseGame: React.FC<BuildMoonBaseGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find((g) => g.id === 'moon_base') || GAME_DEFINITIONS[5];
  const config = DIFFICULTY_CONFIG[difficulty];

  // Grid state: null or ModuleType
  const [grid, setGrid] = useState<(ModuleType | null)[]>(() =>
    Array(GRID_SIZE * GRID_SIZE).fill(null)
  );

  const [selectedTool, setSelectedTool] = useState<ModuleType | 'demolish'>('hab_dome');

  // Resource totals
  const [spentBlocks, setSpentBlocks] = useState<number>(0);
  const [netPower, setNetPower] = useState<number>(0);
  const [crewCapacity, setCrewCapacity] = useState<number>(0);
  const [totalWaterBalance, setTotalWaterBalance] = useState<number>(0);
  const [totalFoodBalance, setTotalFoodBalance] = useState<number>(0);
  const [totalShielding, setTotalShielding] = useState<number>(0);
  const [hasLab, setHasLab] = useState<boolean>(false);

  // Modals & debrief
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [debriefNotes, setDebriefNotes] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const hasSavedRef = useRef<boolean>(false);

  // Recalculate metrics
  const recalculateGrid = useCallback((currentGrid: (ModuleType | null)[]) => {
    let blocks = 0;
    let power = 0;
    let crew = 0;
    let water = 0;
    let food = 0;
    let shield = 0;
    let foundLab = false;

    currentGrid.forEach((type) => {
      if (!type) return;
      const mod = MODULE_CATALOG.find((m) => m.type === type);
      if (mod) {
        blocks += mod.costBlocks;
        power += mod.powerKw;
        crew += mod.crewBerths;
        water += mod.waterDaily;
        food += mod.foodDaily;
        shield += mod.shieldingPct;
        if (type === 'science_lab') foundLab = true;
      }
    });

    setSpentBlocks(blocks);
    setNetPower(power);
    setCrewCapacity(crew);
    setTotalWaterBalance(water);
    setTotalFoodBalance(food);
    setTotalShielding(Math.min(100, shield));
    setHasLab(foundLab);
  }, []);

  // Reset / restart
  const handleRestart = useCallback(() => {
    hasSavedRef.current = false;
    // Preset starting center hab
    const initial = Array(GRID_SIZE * GRID_SIZE).fill(null);
    const centerIdx = Math.floor((GRID_SIZE * GRID_SIZE) / 2);
    initial[centerIdx] = 'hab_dome';

    setGrid(initial);
    setSelectedTool('solar_array');
    setIsGameOver(false);
    setVictory(false);
    setStars(0);
    setScore(0);
    setDebriefNotes([]);
    recalculateGrid(initial);
  }, [recalculateGrid]);

  useEffect(() => {
    handleRestart();
  }, [difficulty, handleRestart]);

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (isGameOver) return;
    const currentModule = grid[index];

    if (selectedTool === 'demolish') {
      if (currentModule) {
        if (soundEnabled) sound.warning();
        const next = [...grid];
        next[index] = null;
        setGrid(next);
        recalculateGrid(next);
      }
      return;
    }

    const modDef = MODULE_CATALOG.find((m) => m.type === selectedTool);
    if (!modDef) return;

    // Check budget
    const blockDifference = modDef.costBlocks - (currentModule ? MODULE_CATALOG.find((m) => m.type === currentModule)?.costBlocks || 0 : 0);
    if (spentBlocks + blockDifference > config.budgetBlocks) {
      if (soundEnabled) sound.error();
      return;
    }

    if (soundEnabled) sound.click();
    const next = [...grid];
    next[index] = selectedTool;
    setGrid(next);
    recalculateGrid(next);
  };

  // Certify base layout
  const handleCertifyBase = () => {
    if (isGameOver) return;
    if (soundEnabled) sound.click();

    const issues: string[] = [];
    if (crewCapacity < config.minCrew) {
      issues.push(`Crew capacity (${crewCapacity}) is below mission requirement of ${config.minCrew} berths.`);
    }
    if (netPower < config.minNetPower) {
      issues.push(`Net power (${netPower} kW) is below requirement of ${config.minNetPower} kW positive reserve.`);
    }
    if (totalShielding < config.minShieldingPct) {
      issues.push(`Radiation shielding (${totalShielding}%) is below safety threshold of ${config.minShieldingPct}%.`);
    }
    if (config.requireLab && !hasLab) {
      issues.push('Missing mandatory Lunar Science Research Laboratory module.');
    }
    if (totalWaterBalance < 0) {
      issues.push('Water consumption exceeds production. Add Ice Harvester drills!');
    }
    if (totalFoodBalance < 0) {
      issues.push('Food consumption exceeds production. Build Hydroponic greenhouses!');
    }

    const isSuccessful = issues.length === 0;
    setIsGameOver(true);
    setVictory(isSuccessful);

    let earnedStars = 0;
    let earnedScore = 0;
    const notes: string[] = [];

    if (isSuccessful) {
      if (soundEnabled) sound.success();
      earnedStars = 3;
      if (spentBlocks > config.budgetBlocks * 0.9) earnedStars = 2;

      earnedScore = 1500 + netPower * 10 + crewCapacity * 100 + totalShielding * 5;
      setScore(earnedScore);

      notes.push('BASE CERTIFIED! NASA Flight Directorate approved your sustainable settlement layout.');
      notes.push(`Sustaining ${crewCapacity} astronauts with +${netPower} kW grid buffer and ${totalShielding}% shielding.`);
      notes.push('Lunar Architecture Science: Sintered regolith 3D printing will enable permanent structures without launching concrete from Earth.');
    } else {
      if (soundEnabled) sound.error();
      earnedStars = 0;
      notes.push('Base certification failed inspection:');
      notes.push(...issues);
    }

    setStars(earnedStars);
    setDebriefNotes(notes);

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      onSaveScore(isSuccessful ? earnedScore : 300, earnedStars);
    }
  };

  const remainingBlocks = config.budgetBlocks - spentBlocks;

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-5 p-4 sm:p-6 bg-slate-950/90 border border-violet-500/30 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-500/50 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-950/50">
            <Building2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-violet-300 uppercase">
                {gameDef.title}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-violet-950/80 border border-violet-500/40 text-violet-400">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">{config.name} • Settlement Architecture</p>
          </div>
        </div>

        {/* Global Action & Status Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Regolith:</span>
            <span
              className={`font-mono font-bold ${
                remainingBlocks < 15 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
              }`}
            >
              {remainingBlocks} left
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Power:</span>
            <span
              className={`font-mono font-bold ${
                netPower >= config.minNetPower ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netPower >= 0 ? `+${netPower}` : netPower} kW
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Crew:</span>
            <span
              className={`font-mono font-bold ${
                crewCapacity >= config.minCrew ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {crewCapacity}/{config.minCrew}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle Sound"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => setShowInstructions(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-violet-400 hover:text-violet-300 transition-colors"
            title="How to Play"
            aria-label="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 transition-colors"
            title="Restart Challenge"
            aria-label="Restart Challenge"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onBackToHub}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Arcade Hub
          </button>
        </div>
      </div>

      {/* Main Grid: Blueprint Grid (Left 7 cols) & Module Palette / Objectives (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5x5 Lunar Base Construction Map */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Outpost Topographic Grid (5×5)
            </h3>
            <span className="text-xs text-slate-400">
              Click tiles to construct or demolish modules
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 aspect-square max-w-[480px] mx-auto w-full">
            {grid.map((cell, idx) => {
              const mod = cell ? MODULE_CATALOG.find((m) => m.type === cell) : null;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleCellClick(idx)}
                  className={`relative rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all aspect-square ${
                    mod
                      ? 'bg-slate-900 border-violet-500/60 shadow-md hover:border-violet-400'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700 border-dashed'
                  }`}
                >
                  {mod ? (
                    <>
                      <span className="text-2xl sm:text-3xl">{mod.icon}</span>
                      <span className="text-[10px] font-bold text-slate-300 line-clamp-1 mt-0.5 text-center">
                        {mod.name.split(' ')[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-700 text-xs font-mono">+</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Certification Trigger Button */}
          <button
            onClick={handleCertifyBase}
            className="w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/40 active:scale-95 transition-all"
          >
            <Award className="w-5 h-5" />
            Certify Base Layout with NASA Flight Directorate
          </button>
        </div>

        {/* Right: Module Catalog & Mission Objectives */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Mission Goals checklist */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5 text-xs">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-800">
              Settlement Certification Objectives
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Crew Berths:</span>
              <span className={crewCapacity >= config.minCrew ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {crewCapacity} / {config.minCrew} req
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Net Power Buffer:</span>
              <span className={netPower >= config.minNetPower ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {netPower} / +{config.minNetPower} kW
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Radiation Shielding:</span>
              <span className={totalShielding >= config.minShieldingPct ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {totalShielding}% / {config.minShieldingPct}% req
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Water Balance:</span>
              <span className={totalWaterBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {totalWaterBalance >= 0 ? `+${totalWaterBalance}` : totalWaterBalance} L/day
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Food Balance:</span>
              <span className={totalFoodBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {totalFoodBalance >= 0 ? `+${totalFoodBalance}` : totalFoodBalance} kg/day
              </span>
            </div>
            {config.requireLab && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Science Lab:</span>
                <span className={hasLab ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {hasLab ? 'Constructed' : 'Missing!'}
                </span>
              </div>
            )}
          </div>

          {/* Module Selector Palette */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider pb-1 border-b border-slate-800">
              Module Construction Palette
            </h4>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {MODULE_CATALOG.map((mod) => {
                const isSelected = selectedTool === mod.type;
                const canAfford = remainingBlocks >= mod.costBlocks;

                return (
                  <button
                    key={mod.type}
                    type="button"
                    disabled={!canAfford && !isSelected}
                    onClick={() => {
                      setSelectedTool(mod.type);
                      if (soundEnabled) sound.click();
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-violet-950/80 border-violet-400 ring-2 ring-violet-400/40 text-violet-200'
                        : canAfford
                        ? 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{mod.icon}</span>
                      <div>
                        <div className="font-bold text-xs">{mod.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{mod.description}</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-400 whitespace-nowrap ml-2">
                      {mod.costBlocks} 🧱
                    </span>
                  </button>
                );
              })}

              {/* Demolish Tool */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTool('demolish');
                  if (soundEnabled) sound.click();
                }}
                className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                  selectedTool === 'demolish'
                    ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/40 text-rose-200'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="font-bold text-xs">Demolish / Clear Tile</span>
                </div>
                <span className="text-[10px] text-slate-400">Click placed module to remove</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <GameInstructionsModal
          game={gameDef}
          difficulty={difficulty}
          onStartGame={() => setShowInstructions(false)}
          onClose={() => setShowInstructions(false)}
        />
      )}

      {/* Debrief Modal */}
      {isGameOver && (
        <GameResultDebrief
          gameTitle={gameDef.title}
          difficulty={difficulty}
          score={score}
          highScore={highScore}
          starsEarned={stars}
          isNewHighScore={score > highScore}
          scienceTakeaway={gameDef.instructions.scienceFact}
          statsSummary={[
            { label: 'Settlement Status', value: victory ? 'Certified NASA Safe' : 'Certification Failed' },
            { label: 'Crew Capacity', value: `${crewCapacity} Astronauts` },
            { label: 'Net Power Buffer', value: `${netPower >= 0 ? `+${netPower}` : netPower} kW` },
            { label: 'Radiation Shielding', value: `${totalShielding}%` }
          ]}
          onReplay={handleRestart}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}
    </div>
  );
};
