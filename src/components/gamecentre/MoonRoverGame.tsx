import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Battery,
  BatteryCharging,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  MapPin,
  Shield
} from 'lucide-react';

interface MoonRoverGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

type TileType = 'smooth' | 'boulder' | 'crater' | 'shadow' | 'sunlight' | 'checkpoint' | 'base';

interface GridTile {
  x: number;
  y: number;
  type: TileType;
  hasSample?: boolean;
  sampleName?: string;
  isVisitedCheckpoint?: boolean;
  checkpointName?: string;
}

const GRID_COLS = 10;
const GRID_ROWS = 7;

const BATTERY_CONFIG: Record<GameDifficulty, {
  start: number;
  moveDrain: number;
  boulderDrain: number;
  shadowDrain: number;
  sunRecharge: number;
  targetSamples: number;
  timeLimitSec: number;
  speedRating: string;
}> = {
  explorer: {
    start: 100,
    moveDrain: 1.0,
    boulderDrain: 2.0,
    shadowDrain: 2.0,
    sunRecharge: 4.5,
    targetSamples: 2,
    timeLimitSec: 90,
    speedRating: 'Cruise Speed'
  },
  junior_engineer: {
    start: 85,
    moveDrain: 1.6,
    boulderDrain: 3.0,
    shadowDrain: 3.2,
    sunRecharge: 3.0,
    targetSamples: 3,
    timeLimitSec: 75,
    speedRating: 'Survey Pace'
  },
  mission_commander: {
    start: 70,
    moveDrain: 2.2,
    boulderDrain: 4.5,
    shadowDrain: 4.5,
    sunRecharge: 2.2,
    targetSamples: 3,
    timeLimitSec: 60,
    speedRating: 'Tactical Recon'
  }
};

export const MoonRoverGame: React.FC<MoonRoverGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'moon_rover')!;
  const batteryConfig = BATTERY_CONFIG[difficulty];

  // Game state
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [roverPos, setRoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 3 });
  const [roverAngle, setRoverAngle] = useState<number>(90); // 0 up, 90 right, 180 down, 270 left
  const [battery, setBattery] = useState<number>(batteryConfig.start);
  const [samplesCollected, setSamplesCollected] = useState<number>(0);
  const [checkpointsVisited, setCheckpointsVisited] = useState<number>(0);
  const [grid, setGrid] = useState<GridTile[]>([]);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([{ x: 0, y: 3 }]);
  const [stepsCount, setStepsCount] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(batteryConfig.timeLimitSec);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [currentTerrainNotice, setCurrentTerrainNotice] = useState<string>(
    'Rover touchdown at Shackleton Rim! Follow sunlight ridges to survey ice traps.'
  );

  const hasSavedRef = useRef<boolean>(false);

  // Generate Lunar Map with designated checkpoints and sample traps
  const generateMap = useCallback(() => {
    hasSavedRef.current = false;
    const tiles: GridTile[] = [];

    const sampleSpawns = [
      { x: 3, y: 1, name: 'Water-Ice Core Alpha' },
      { x: 5, y: 5, name: 'Volatile Regolith Core Beta' },
      { x: 7, y: 2, name: 'Ilmenite Core Gamma' }
    ];

    const checkpointSpawns = [
      { x: 4, y: 3, name: 'Ridge Beacon 1' },
      { x: 8, y: 5, name: 'Crater Ridge Beacon 2' }
    ];

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        // Base Station Dock at (9, 3)
        if (x === 9 && y === 3) {
          tiles.push({ x, y, type: 'base', checkpointName: 'Outpost Alpha Dock' });
          continue;
        }

        // Start position
        if (x === 0 && y === 3) {
          tiles.push({ x, y, type: 'smooth' });
          continue;
        }

        // Checkpoints
        const cp = checkpointSpawns.find(c => c.x === x && c.y === y);
        if (cp) {
          tiles.push({ x, y, type: 'checkpoint', checkpointName: cp.name, isVisitedCheckpoint: false });
          continue;
        }

        // Sample cold traps
        const sample = sampleSpawns.find(s => s.x === x && s.y === y);
        if (sample) {
          tiles.push({ x, y, type: 'shadow', hasSample: true, sampleName: sample.name });
          continue;
        }

        // Sunlight ridges (Southern high ground receiving constant sun)
        if ((x === 2 && y === 0) || (x === 4 && y === 0) || (x === 6 && y === 6) || (x === 8 && y === 6) || (x === 6 && y === 1)) {
          tiles.push({ x, y, type: 'sunlight' });
          continue;
        }

        // Permanent shadow cold traps
        if ((x === 3 && y === 2) || (x === 5 && y === 4) || (x === 7 && y === 3) || (x === 2 && y === 5)) {
          tiles.push({ x, y, type: 'shadow' });
          continue;
        }

        // Boulders and craters
        const hash = (x * 7 + y * 13) % 10;
        if ((hash === 2 || hash === 8) && x > 1 && x < 8) {
          tiles.push({ x, y, type: 'boulder' });
        } else if ((hash === 5 || hash === 9) && x > 1 && x < 8) {
          tiles.push({ x, y, type: 'crater' });
        } else {
          tiles.push({ x, y, type: 'smooth' });
        }
      }
    }

    setGrid(tiles);
    setRoverPos({ x: 0, y: 3 });
    setTrail([{ x: 0, y: 3 }]);
    setRoverAngle(90);
    setBattery(batteryConfig.start);
    setSamplesCollected(0);
    setCheckpointsVisited(0);
    setStepsCount(0);
    setSecondsRemaining(batteryConfig.timeLimitSec);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setScore(0);
    setCurrentTerrainNotice('Rover touchdown at Shackleton Rim! Follow sunlight ridges to survey ice traps.');
  }, [difficulty]);

  useEffect(() => {
    generateMap();
  }, [generateMap]);

  // Mission Timer
  useEffect(() => {
    if (showInstructions || isGameOver || isPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Time expired
          if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            setIsGameOver(true);
            setIsVictory(false);
            sound.playAlert();
            setCurrentTerrainNotice('MISSION TIME EXPIRED! Communications window closed.');
            const finalScore = Math.max(50, samplesCollected * 250 + checkpointsVisited * 150);
            setScore(finalScore);
            onSaveScore(finalScore, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInstructions, isGameOver, isPaused, samplesCollected, checkpointsVisited, onSaveScore]);

  // Handle rover movement
  const moveRover = useCallback((dx: number, dy: number, angle: number) => {
    if (isGameOver || showInstructions || isPaused) return;

    const newX = Math.max(0, Math.min(GRID_COLS - 1, roverPos.x + dx));
    const newY = Math.max(0, Math.min(GRID_ROWS - 1, roverPos.y + dy));

    // If didn't actually move (boundary hit)
    if (newX === roverPos.x && newY === roverPos.y) {
      sound.playThud();
      return;
    }

    setRoverPos({ x: newX, y: newY });
    setRoverAngle(angle);
    setTrail(prev => [...prev.slice(-20), { x: newX, y: newY }]);
    const nextSteps = stepsCount + 1;
    setStepsCount(nextSteps);

    // Find tile
    const targetTile = grid.find(t => t.x === newX && t.y === newY);
    let batDelta = -batteryConfig.moveDrain;

    if (targetTile) {
      if (targetTile.type === 'boulder') {
        batDelta -= batteryConfig.boulderDrain;
        sound.playThud();
        setCurrentTerrainNotice('Climbing rough boulder field! Heavy suspension motor drain.');
      } else if (targetTile.type === 'crater') {
        batDelta -= 1.8;
        sound.playThud();
        setCurrentTerrainNotice('Navigating steep crater rim slope. Maintain traction!');
      } else if (targetTile.type === 'shadow') {
        batDelta = -batteryConfig.shadowDrain;
        sound.playBlip();
        setCurrentTerrainNotice('Inside Permanent Cold Trap (-240°C). Heating batteries active!');
      } else if (targetTile.type === 'sunlight') {
        batDelta = batteryConfig.sunRecharge;
        sound.playPowerUp();
        setCurrentTerrainNotice('Sunlit Ridge! Auxiliary solar panels recharging batteries.');
      } else if (targetTile.type === 'checkpoint') {
        sound.playScore();
        if (!targetTile.isVisitedCheckpoint) {
          targetTile.isVisitedCheckpoint = true;
          setCheckpointsVisited(c => c + 1);
          setCurrentTerrainNotice(`Exploration Milestone: ${targetTile.checkpointName} verified!`);
        }
      } else {
        sound.playBlip();
        setCurrentTerrainNotice('Smooth polar regolith. Cruise speed nominal.');
      }

      // Check scientific sample pick up
      let currentSamples = samplesCollected;
      if (targetTile.hasSample) {
        targetTile.hasSample = false;
        currentSamples = samplesCollected + 1;
        setSamplesCollected(currentSamples);
        sound.playScore();
        setCurrentTerrainNotice(`Scientific Discovery: ${targetTile.sampleName || 'Ice Core'} safely loaded!`);
      }

      const nextBattery = Math.min(100, Math.max(0, Number((battery + batDelta).toFixed(1))));
      setBattery(nextBattery);

      // Check base docking victory
      if (targetTile.type === 'base') {
        if (currentSamples >= batteryConfig.targetSamples) {
          if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            setIsVictory(true);
            setIsGameOver(true);
            sound.playSuccess();

            // Calculate score with bonuses
            const samplePoints = currentSamples * 400;
            const checkpointBonus = checkpointsVisited * 200;
            const batteryBonus = Math.max(0, Math.round(nextBattery * 15));
            const timeBonus = secondsRemaining * 10;
            const finalScore = samplePoints + checkpointBonus + batteryBonus + timeBonus;

            setScore(finalScore);
            const stars = finalScore >= 1600 ? 3 : finalScore >= 1100 ? 2 : 1;
            onSaveScore(finalScore, stars);
          }
          return;
        } else {
          sound.playAlert();
          setCurrentTerrainNotice(
            `Outpost Alpha Dock: Needs ${batteryConfig.targetSamples - currentSamples} more ice samples to seal airlock!`
          );
        }
      }

      // Check battery exhaustion
      if (nextBattery <= 0 && targetTile.type !== 'base') {
        if (!hasSavedRef.current) {
          hasSavedRef.current = true;
          setIsGameOver(true);
          setIsVictory(false);
          sound.playAlert();
          setCurrentTerrainNotice('BATTERY DEPLETED! Rover immobilized in polar regolith.');
          const finalScore = Math.round(currentSamples * 200 + checkpointsVisited * 100);
          setScore(finalScore);
          onSaveScore(finalScore, 0);
        }
      }
    }
  }, [
    isGameOver,
    showInstructions,
    isPaused,
    roverPos,
    stepsCount,
    grid,
    batteryConfig,
    battery,
    samplesCollected,
    checkpointsVisited,
    secondsRemaining,
    onSaveScore
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showInstructions || isGameOver || isPaused) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        moveRover(0, -1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveRover(1, 0, 90);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        moveRover(0, 1, 180);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveRover(-1, 0, 270);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showInstructions, isGameOver, isPaused, moveRover]);

  const targetTile = grid.find(t => t.x === roverPos.x && t.y === roverPos.y);
  const remainingSamplesNeeded = Math.max(0, batteryConfig.targetSamples - samplesCollected);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Instructions Modal */}
      {showInstructions && (
        <GameInstructionsModal
          game={gameDef}
          difficulty={difficulty}
          onStartGame={() => setShowInstructions(false)}
          onClose={onBackToHub}
        />
      )}

      {/* Result Debrief Modal */}
      {isGameOver && (
        <GameResultDebrief
          gameTitle={gameDef.title}
          difficulty={difficulty}
          score={score}
          highScore={highScore}
          starsEarned={isVictory ? (score >= 1600 ? 3 : score >= 1100 ? 2 : 1) : 0}
          isNewHighScore={score > highScore}
          scienceTakeaway="Traversing the lunar polar landscape requires balancing terrain resistance, permanent shadow temperatures (-240°C), and illuminated peaks of eternal light to maintain autonomous rover battery power."
          statsSummary={[
            { label: 'Samples Secured', value: `${samplesCollected} / ${batteryConfig.targetSamples}` },
            { label: 'Checkpoints', value: `${checkpointsVisited} Visited` },
            { label: 'Battery Remaining', value: `${battery}%` },
            { label: 'Time Remaining', value: `${secondsRemaining}s` },
            { label: 'Steps Driven', value: stepsCount }
          ]}
          onReplay={generateMap}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}

      {/* Top Game Navigation Bar */}
      <div className="bg-[#0B132B]/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBackToHub();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            ← Arcade Hub
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Exploration</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-amber-300 font-mono capitalize">{difficulty.replace('_', ' ')}</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">Moon Rover Explorer</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setIsPaused(p => !p);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              generateMap();
            }}
            title="Restart Rover Mission"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInstructions(true)}
            title="Instructions"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMuted(sound.toggleMute())}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Dashboard Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Battery Telemetry */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rover Battery</span>
            </span>
            <span className="font-mono font-bold text-white">{battery}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                battery > 50 ? 'bg-cyan-400' : battery > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${battery}%` }}
            />
          </div>
        </div>

        {/* Ice Samples */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ice Samples</span>
            </span>
            <span className="font-mono font-bold text-cyan-300">{samplesCollected} / {batteryConfig.targetSamples}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {remainingSamplesNeeded === 0 ? '✓ Ready to Dock at Base' : `Need ${remainingSamplesNeeded} more sample${remainingSamplesNeeded > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Checkpoint Progress */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Waypoints</span>
            </span>
            <span className="font-mono font-bold text-white">{checkpointsVisited} Visited</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target: Outpost Alpha (Right)
          </div>
        </div>

        {/* Mission Timer */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Time Window</span>
            </span>
            <span className={`font-mono font-bold ${secondsRemaining <= 15 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {secondsRemaining}s
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {batteryConfig.speedRating}
          </div>
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="bg-[#060A12] border border-cyan-500/30 rounded-2xl p-3 sm:p-4 shadow-2xl relative overflow-hidden">
        {/* Subtle grid backdrop decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none" />

        {isPaused && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
            <Pause className="w-12 h-12 text-amber-400 animate-pulse" />
            <div className="text-lg font-bold text-white">SIMULATION PAUSED</div>
            <button
              onClick={() => setIsPaused(false)}
              className="px-4 py-2 bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20"
            >
              Resume Exploration
            </button>
          </div>
        )}

        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {grid.map(tile => {
            const isRoverHere = roverPos.x === tile.x && roverPos.y === tile.y;
            const isTrail = trail.some(t => t.x === tile.x && t.y === tile.y) && !isRoverHere;

            // Tile styling
            let tileStyle = 'bg-slate-900/60 border-slate-800/80 text-slate-500';
            if (tile.type === 'boulder') {
              tileStyle = 'bg-amber-950/25 border-amber-800/40 text-amber-400';
            } else if (tile.type === 'crater') {
              tileStyle = 'bg-slate-950 border-slate-700/60 text-slate-400';
            } else if (tile.type === 'shadow') {
              tileStyle = 'bg-blue-950/40 border-cyan-800/40 text-cyan-300';
            } else if (tile.type === 'sunlight') {
              tileStyle = 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-inner';
            } else if (tile.type === 'checkpoint') {
              tileStyle = tile.isVisitedCheckpoint
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/50 text-amber-400 animate-pulse';
            } else if (tile.type === 'base') {
              tileStyle = 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20';
            }

            return (
              <div
                key={`${tile.x}-${tile.y}`}
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center p-1 select-none transition-all duration-150 ${tileStyle}`}
              >
                {/* Trail Marker */}
                {isTrail && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                )}

                {/* Base Marker */}
                {tile.type === 'base' && (
                  <div className="text-center">
                    <div className="text-sm sm:text-base">🚀</div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-cyan-300 uppercase tracking-tighter block">
                      DOCK
                    </span>
                  </div>
                )}

                {/* Checkpoint Marker */}
                {tile.type === 'checkpoint' && (
                  <div className="text-center">
                    <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${tile.isVisitedCheckpoint ? 'text-emerald-400' : 'text-amber-400 animate-bounce'}`} />
                    <span className="text-[7px] sm:text-[8px] font-mono block">
                      {tile.isVisitedCheckpoint ? 'PASS' : 'FLAG'}
                    </span>
                  </div>
                )}

                {/* Sample inside Cold Trap */}
                {tile.type === 'shadow' && tile.hasSample && (
                  <div className="text-center animate-pulse">
                    <div className="text-sm sm:text-base">💎</div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-cyan-200 uppercase tracking-tighter">
                      ICE
                    </span>
                  </div>
                )}

                {/* Empty Shadow Cold Trap */}
                {tile.type === 'shadow' && !tile.hasSample && (
                  <div className="text-[10px] text-cyan-600 font-mono">❄️</div>
                )}

                {/* Sunlight Ridge */}
                {tile.type === 'sunlight' && (
                  <div className="text-[10px] sm:text-xs">☀️</div>
                )}

                {/* Boulder */}
                {tile.type === 'boulder' && (
                  <div className="text-[10px] sm:text-xs">🪨</div>
                )}

                {/* Crater */}
                {tile.type === 'crater' && (
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">⚪</div>
                )}

                {/* Rover Character with heading rotation */}
                {isRoverHere && (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `rotate(${roverAngle}deg)` }}
                  >
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-cyan-400 text-slate-950 font-black rounded-lg border-2 border-white shadow-lg shadow-cyan-400/50 flex items-center justify-center text-xs">
                      <span className="transform -rotate-90">▲</span>
                      {/* Headlight beam */}
                      <div className="absolute top-0 w-3 h-2 -translate-y-2 bg-gradient-to-t from-cyan-300 to-transparent opacity-80 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Terrain Mission Advisory Banner */}
        <div className="mt-3 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-200 font-medium">{currentTerrainNotice}</span>
        </div>
      </div>

      {/* Responsive Touch D-Pad Controls for Mobile & Tablets */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          <span className="font-semibold text-white block">Desktop Keyboard Controls:</span>
          <span>Use Arrow Keys or WASD to navigate. Spacebar to Pause.</span>
        </div>

        {/* Touch Directional Cross */}
        <div className="flex flex-col items-center gap-1.5 select-none">
          <button
            onClick={() => moveRover(0, -1, 0)}
            className="w-12 h-11 bg-slate-800 hover:bg-cyan-500 active:bg-cyan-400 text-white active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center transition-colors shadow-md active:scale-95"
            aria-label="Drive Up"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveRover(-1, 0, 270)}
              className="w-12 h-11 bg-slate-800 hover:bg-cyan-500 active:bg-cyan-400 text-white active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center transition-colors shadow-md active:scale-95"
              aria-label="Drive Left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => moveRover(0, 1, 180)}
              className="w-12 h-11 bg-slate-800 hover:bg-cyan-500 active:bg-cyan-400 text-white active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center transition-colors shadow-md active:scale-95"
              aria-label="Drive Down"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => moveRover(1, 0, 90)}
              className="w-12 h-11 bg-slate-800 hover:bg-cyan-500 active:bg-cyan-400 text-white active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center transition-colors shadow-md active:scale-95"
              aria-label="Drive Right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap sm:flex-col gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>☀️</span>
            <span>Sun Ridge (+Solar Charge)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>❄️</span>
            <span>Cold Trap (-Heat / Ice Core)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🪨</span>
            <span>Boulder Field (-Motor Drag)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🚀</span>
            <span>Outpost Alpha Docking Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
