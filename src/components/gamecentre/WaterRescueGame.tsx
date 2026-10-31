import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Droplets,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  ShieldAlert,
  Gauge,
  Sparkles,
  Info,
  ArrowUpDown
} from 'lucide-react';

interface WaterRescueGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface FilterStage {
  id: string;
  name: string;
  category: string;
  role: string;
  icon: string;
  explanation: string;
}

const ALL_FILTER_STAGES: FilterStage[] = [
  {
    id: 'stage_solids',
    name: 'Regolith Debris Trap',
    category: 'Mechanical Pre-Filter',
    role: 'Captures coarse regolith grit, hair, and dust particles > 5 microns before they tear membranes.',
    icon: '🪨',
    explanation: 'Must always go first! Hard lunar dust particles will puncture delicate downstream filters if not stopped immediately.'
  },
  {
    id: 'stage_ro_membrane',
    name: 'Reverse Osmosis Unit',
    category: 'Membrane Separation',
    role: 'Pushes water through microscopic polymer pores under pressure to extract dissolved salts and heavy ions.',
    icon: '🔬',
    explanation: 'Removes 99% of dissolved minerals and urine urea. Requires pre-filtered water so sediment doesn’t clog it.'
  },
  {
    id: 'stage_uv_chamber',
    name: 'UV Germicidal Reactor',
    category: 'Microbial Inactivation',
    role: 'Blasts water with 254nm ultraviolet light to neutralize any bacteria or viruses without harmful chemicals.',
    icon: '⚡',
    explanation: 'Destroys microbial DNA. Works best when water is already clear so light penetrates completely.'
  },
  {
    id: 'stage_mineralizer',
    name: 'Mineralizer & Polisher',
    category: 'Potability Balancing',
    role: 'Adds essential minerals (calcium, magnesium) and balances pH to 7.4 for healthy astronaut hydration.',
    icon: '💎',
    explanation: 'Pure distilled water leaches minerals from human bones. Minerals must only be added at the very end after all contaminants are eliminated!'
  }
];

const CORRECT_ORDER = ['stage_solids', 'stage_ro_membrane', 'stage_uv_chamber', 'stage_mineralizer'];

interface ScenarioConfig {
  name: string;
  description: string;
  inletContaminant: string;
  roundsToWin: number;
  minSafePsi: number;
  maxSafePsi: number;
  timeLimitSec: number;
}

const DIFFICULTY_CONFIG: Record<GameDifficulty, ScenarioConfig> = {
  explorer: {
    name: 'Habitat Graywater Reclamation',
    description: 'Clean recycled wash-water and sweat humidity condensate for the Artemis Habitat crew.',
    inletContaminant: 'Moderate sweat salts & clothing lint',
    roundsToWin: 1,
    minSafePsi: 10,
    maxSafePsi: 20,
    timeLimitSec: 90
  },
  junior_engineer: {
    name: 'Lunar EVA Suit Flush Recirculator',
    description: 'Decontaminate suit coolant loops infiltrated with fine electrostatic regolith dust and biofilm.',
    inletContaminant: 'Fine regolith grit & microbial biofilm',
    roundsToWin: 2,
    minSafePsi: 12,
    maxSafePsi: 18,
    timeLimitSec: 75
  },
  mission_commander: {
    name: 'Deep Crater Ice-Core Melter',
    description: 'Extract and purify volatile-rich polar permafrost containing ancient sulfur, dust, and ammonia.',
    inletContaminant: 'Corrosive ice grit, ammonia traces & volatile salts',
    roundsToWin: 3,
    minSafePsi: 14,
    maxSafePsi: 17,
    timeLimitSec: 60
  }
};

export const WaterRescueGame: React.FC<WaterRescueGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find((g) => g.id === 'water_rescue') || GAME_DEFINITIONS[2];
  const config = DIFFICULTY_CONFIG[difficulty];

  // Game state
  const [pipeline, setPipeline] = useState<FilterStage[]>([]);
  const [pumpPressurePsi, setPumpPressurePsi] = useState<number>(15);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSec);
  const [isFlowTesting, setIsFlowTesting] = useState<boolean>(false);
  const [testStageIndex, setTestStageIndex] = useState<number>(-1);
  const [flowLog, setFlowLog] = useState<string[]>([]);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);

  // Results & modals
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(0);
  const [debriefNotes, setDebriefNotes] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const hasSavedRef = useRef<boolean>(false);

  // Initialize pipeline with shuffled stages
  const initPipeline = useCallback(() => {
    // Shuffled copy
    const shuffled = [...ALL_FILTER_STAGES].sort(() => Math.random() - 0.5);
    setPipeline(shuffled);
    setPumpPressurePsi(15);
    setIsFlowTesting(false);
    setTestStageIndex(-1);
    setSelectedStageIndex(null);
    setFlowLog(['System ready. Arrange the 4 filtration stages, adjust pump PSI, then press Run Flow Test.']);
  }, []);

  const handleRestart = useCallback(() => {
    hasSavedRef.current = false;
    setCurrentRound(1);
    setScore(0);
    setTimeLeft(config.timeLimitSec);
    setIsGameOver(false);
    setVictory(false);
    setStars(0);
    setDebriefNotes([]);
    initPipeline();
  }, [config.timeLimitSec, initPipeline]);

  // Initial load
  useEffect(() => {
    handleRestart();
  }, [difficulty, handleRestart]);

  // Mission countdown timer
  useEffect(() => {
    if (isGameOver || isFlowTesting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerGameOver(false, 'Time expired before life-support water purification was verified!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isFlowTesting]);

  // Swap two stages in pipeline
  const handleSwap = (idx1: number, idx2: number) => {
    if (isFlowTesting || isGameOver) return;
    if (soundEnabled) sound.click();
    setPipeline((prev) => {
      const next = [...prev];
      const temp = next[idx1];
      next[idx1] = next[idx2];
      next[idx2] = temp;
      return next;
    });
    setSelectedStageIndex(null);
  };

  const handleStageClick = (index: number) => {
    if (isFlowTesting || isGameOver) return;
    if (selectedStageIndex === null) {
      setSelectedStageIndex(index);
      if (soundEnabled) sound.click();
    } else if (selectedStageIndex === index) {
      setSelectedStageIndex(null);
    } else {
      handleSwap(selectedStageIndex, index);
    }
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pipeline.length) return;
    handleSwap(index, target);
  };

  const triggerGameOver = (won: boolean, reason: string) => {
    setIsGameOver(true);
    setVictory(won);
    setIsFlowTesting(false);

    let earnedStars = 0;
    const notes: string[] = [reason];

    if (won) {
      if (soundEnabled) sound.success();
      // Calculate star rating
      const roundBonus = currentRound * 500;
      const timeBonus = timeLeft * 15;
      const pressureBonus = Math.abs(pumpPressurePsi - 15) <= 1 ? 300 : 150;
      const finalScore = score + roundBonus + timeBonus + pressureBonus;
      setScore(finalScore);

      if (timeLeft > config.timeLimitSec * 0.45) earnedStars = 3;
      else if (timeLeft > config.timeLimitSec * 0.15) earnedStars = 2;
      else earnedStars = 1;

      notes.push(`Delivered ${earnedStars * 150} Liters of ISO-Grade Potable Water to the crew.`);
      notes.push('NASA ECLSS Insight: The ISS Water Processor Assembly achieves ~98% reclamation!');
    } else {
      if (soundEnabled) sound.error();
      earnedStars = 0;
      notes.push('Astronauts cannot consume unpurified lunar water. Review filter ordering and pump pressure guidelines.');
    }

    setStars(earnedStars);
    setDebriefNotes(notes);

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      onSaveScore(won ? score + 1000 : score, earnedStars);
    }
  };

  // Run Flow Test logic
  const handleRunFlowTest = () => {
    if (isFlowTesting || isGameOver) return;
    if (soundEnabled) sound.click();

    setIsFlowTesting(true);
    setFlowLog(['[INITIATING] Pressurizing feed line with raw graywater...']);

    // Check pressure first
    if (pumpPressurePsi < config.minSafePsi) {
      setTimeout(() => {
        setFlowLog((prev) => [
          ...prev,
          `⚠️ PRESSURE FAILURE: ${pumpPressurePsi} PSI is too low! Water stagnated and could not traverse the membrane.`
        ]);
        if (soundEnabled) sound.warning();
        setIsFlowTesting(false);
      }, 1200);
      return;
    }

    if (pumpPressurePsi > config.maxSafePsi) {
      setTimeout(() => {
        setFlowLog((prev) => [
          ...prev,
          `💥 CRITICAL BLOWOUT: ${pumpPressurePsi} PSI exceeded maximum safety limit! The high pressure ruptured the filter seal.`
        ]);
        if (soundEnabled) sound.error();
        setIsFlowTesting(false);
      }, 1200);
      return;
    }

    // Step through each stage sequentially
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx >= pipeline.length) {
        clearInterval(interval);
        evaluatePipelineSuccess();
        return;
      }

      setTestStageIndex(currentIdx);
      const stage = pipeline[currentIdx];
      const correctStageId = CORRECT_ORDER[currentIdx];

      if (stage.id === correctStageId) {
        if (soundEnabled) sound.badge();
        setFlowLog((prev) => [
          ...prev,
          `✓ Stage ${currentIdx + 1} (${stage.name}): Passed! Clean effluent progressing.`
        ]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsFlowTesting(false);
        if (soundEnabled) sound.error();

        let errorMsg = `❌ Stage ${currentIdx + 1} Error: ${stage.name} is in the incorrect position.`;
        if (stage.id === 'stage_mineralizer') {
          errorMsg += ' You placed the Mineralizer too early! Downstream filtration will strip out the added minerals.';
        } else if (stage.id === 'stage_ro_membrane' && currentIdx === 0) {
          errorMsg += ' Raw regolith grit directly entered the Reverse Osmosis unit and punctured the micro-membrane!';
        } else if (stage.id === 'stage_uv_chamber' && currentIdx < 2) {
          errorMsg += ' UV light cannot sanitize murky, particulate-laden water. Turbidity blocks the photons!';
        } else {
          errorMsg += ` ${stage.explanation}`;
        }

        setFlowLog((prev) => [...prev, errorMsg]);
      }
    }, 900);
  };

  const evaluatePipelineSuccess = () => {
    setIsFlowTesting(false);
    setTestStageIndex(-1);

    const isAllCorrect = pipeline.every((stage, i) => stage.id === CORRECT_ORDER[i]);

    if (isAllCorrect) {
      if (soundEnabled) sound.success();
      setFlowLog((prev) => [
        ...prev,
        '🌟 SUCCESS: Potable drinking water verified by Lunar Base Health Station! 100% purity achieved.'
      ]);

      const roundScore = 1000 + timeLeft * 10;
      setScore((prev) => prev + roundScore);

      if (currentRound >= config.roundsToWin) {
        triggerGameOver(true, `All ${config.roundsToWin} water purification rounds successfully completed!`);
      } else {
        // Advance to next round
        setCurrentRound((prev) => prev + 1);
        setTimeout(() => {
          setFlowLog([`Round ${currentRound + 1} starting: Contaminant levels adjusted! Verify sequence and tune pump PSI.`]);
          // Reshuffle for next round
          const shuffled = [...ALL_FILTER_STAGES].sort(() => Math.random() - 0.5);
          setPipeline(shuffled);
        }, 1800);
      }
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-5 p-4 sm:p-6 bg-slate-950/90 border border-cyan-500/30 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Droplets className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-cyan-300 uppercase">
                {gameDef.title}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">{config.name} • {config.inletContaminant}</p>
          </div>
        </div>

        {/* Global Action & Stat Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Round:</span>
            <span className="font-bold text-cyan-400">{currentRound}/{config.roundsToWin}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Time:</span>
            <span className={`font-mono font-bold ${timeLeft <= 20 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Score:</span>
            <span className="font-mono font-bold text-emerald-400">{score}</span>
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
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
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

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pipeline Stages (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Purification Pipeline Sequence
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Tap any two modules or use arrows to swap order
            </span>
          </div>

          {/* Interactive Pipeline Stages */}
          <div className="space-y-3">
            {pipeline.map((stage, idx) => {
              const isSelected = selectedStageIndex === idx;
              const isCurrentlyTesting = testStageIndex === idx;
              const hasPassedTest = testStageIndex > idx;

              return (
                <div
                  key={stage.id}
                  onClick={() => handleStageClick(idx)}
                  className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    isCurrentlyTesting
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-900/40 ring-2 ring-cyan-400 animate-pulse'
                      : hasPassedTest
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : isSelected
                      ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-400'
                      : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Stage Step Number badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        hasPassedTest
                          ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/50'
                          : isCurrentlyTesting
                          ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-400'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="text-2xl">{stage.icon}</div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-100">
                          {stage.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-cyan-400 border border-slate-700">
                          {stage.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                        {stage.role}
                      </p>
                    </div>
                  </div>

                  {/* Move Up/Down Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0 || isFlowTesting}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStage(idx, 'up');
                      }}
                      className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-white"
                      title="Move Earlier"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === pipeline.length - 1 || isFlowTesting}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveStage(idx, 'down');
                      }}
                      className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-300 hover:text-white"
                      title="Move Later"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fluid Flow Simulation Visualizer Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">WATER PURIFICATION STREAM:</span>
              <span className="font-mono text-cyan-400">
                {isFlowTesting ? `Testing Stage ${(testStageIndex + 1) || 1}/4...` : 'Ready for Flow Test'}
              </span>
            </div>

            <div className="relative h-6 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center">
              <div
                className={`h-full transition-all duration-500 ${
                  isFlowTesting
                    ? 'bg-gradient-to-r from-cyan-600 via-sky-400 to-blue-500 animate-pulse'
                    : 'bg-cyan-950/40'
                }`}
                style={{
                  width: `${isFlowTesting ? ((testStageIndex + 1) / 4) * 100 : 0}%`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 pointer-events-none">
                <span>RAW INFLOW</span>
                <span>STAGE 1</span>
                <span>STAGE 2</span>
                <span>STAGE 3</span>
                <span>POTABLE OUTFLOW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pump Controls, Diagnostics & Test Trigger (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Pump Pressure Slider */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Gauge className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Pump Pressure Control
                </h4>
              </div>
              <span className="font-mono text-base font-bold text-amber-400">
                {pumpPressurePsi} PSI
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Optimal operating window: <strong className="text-cyan-300">{config.minSafePsi} – {config.maxSafePsi} PSI</strong>. Too low will stall flow; too high will rupture seals!
            </p>

            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={pumpPressurePsi}
              disabled={isFlowTesting || isGameOver}
              onChange={(e) => setPumpPressurePsi(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>5 PSI (Low)</span>
              <span className="text-cyan-400">Target Range</span>
              <span>25 PSI (Dangerous)</span>
            </div>
          </div>

          {/* Run Flow Test Action Button */}
          <button
            onClick={handleRunFlowTest}
            disabled={isFlowTesting || isGameOver}
            className={`w-full py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isFlowTesting
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50 cursor-wait'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/40 active:scale-95'
            }`}
          >
            {isFlowTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Pressurizing & Testing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Run Flow Test
              </>
            )}
          </button>

          {/* Diagnostic Log Console */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2 flex-grow min-h-[160px]">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 pb-1 border-b border-slate-900">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>DIAGNOSTIC TELEMETRY</span>
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-48 text-xs font-mono">
              {flowLog.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    log.includes('SUCCESS') || log.includes('Passed')
                      ? 'text-emerald-400'
                      : log.includes('Error') || log.includes('CRITICAL') || log.includes('FAILURE')
                      ? 'text-rose-400 font-semibold'
                      : log.includes('⚠️')
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
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

      {/* Game Completion / Debrief Modal */}
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
            { label: 'Status', value: victory ? '100% Purity Achieved' : 'Purification Failed' },
            { label: 'Rounds Completed', value: `${currentRound}/${config.roundsToWin}` },
            { label: 'Feed Pressure', value: `${pumpPressurePsi} PSI` },
            { label: 'Time Left', value: `${timeLeft}s` }
          ]}
          onReplay={handleRestart}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}
    </div>
  );
};
