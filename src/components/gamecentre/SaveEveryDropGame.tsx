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
  Gauge,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface SaveEveryDropGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface FilterStage {
  id: string;
  name: string;
  icon: string;
  description: string;
  purityEfficiency: number; // 0 to 100
  clogLevel: number; // 0 to 100
  isActive: boolean;
}

const WATER_DIFFICULTY_CONFIG: Record<GameDifficulty, { targetLiters: number; clogRate: number; pressureTolerance: number; maxPressure: number }> = {
  explorer: { targetLiters: 40, clogRate: 0.8, pressureTolerance: 6, maxPressure: 25 },
  junior_engineer: { targetLiters: 50, clogRate: 1.5, pressureTolerance: 4, maxPressure: 30 },
  mission_commander: { targetLiters: 60, clogRate: 2.2, pressureTolerance: 3, maxPressure: 35 }
};

export const SaveEveryDropGame: React.FC<SaveEveryDropGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'save_every_drop')!;
  const difficultyConfig = WATER_DIFFICULTY_CONFIG[difficulty];

  // State
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [rawWaterReserveLiters, setRawWaterReserveLiters] = useState<number>(difficultyConfig.targetLiters);
  const [purifiedWaterLiters, setPurifiedWaterLiters] = useState<number>(0);
  const [leakedWaterLiters, setLeakedWaterLiters] = useState<number>(0);
  const [pumpPressurePsi, setPumpPressurePsi] = useState<number>(15); // Ideal is 15 PSI
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [systemLog, setSystemLog] = useState<string>('ECLSS Loop initialized. Keep pressure near 15 PSI!');
  const hasSavedRef = useRef<boolean>(false);

  // Filter Stages
  const [stages, setStages] = useState<FilterStage[]>([
    {
      id: 'solids_filter',
      name: '1. Regolith Solids Trap',
      icon: '🪨',
      description: 'Centrifugal vortex filter capturing dust & micro-particulates',
      purityEfficiency: 98,
      clogLevel: 0,
      isActive: true
    },
    {
      id: 'membrane_desal',
      name: '2. Reverse Osmosis Bed',
      icon: '🧪',
      description: 'Nano-pore polymer membrane removing salts and dissolved urea',
      purityEfficiency: 96,
      clogLevel: 0,
      isActive: true
    },
    {
      id: 'uv_catalytic',
      name: '3. Catalytic UV Oxidizer',
      icon: '⚡',
      description: 'High-energy ultraviolet reactor sterilizing bacterial biofilms',
      purityEfficiency: 99,
      clogLevel: 0,
      isActive: true
    },
    {
      id: 'mineralizer',
      name: '4. Potable Mineralizer',
      icon: '💎',
      description: 'Balances essential magnesium and calcium for safe astronaut hydration',
      purityEfficiency: 97,
      clogLevel: 0,
      isActive: true
    }
  ]);

  const resetGame = useCallback(() => {
    hasSavedRef.current = false;
    setRawWaterReserveLiters(difficultyConfig.targetLiters);
    setPurifiedWaterLiters(0);
    setLeakedWaterLiters(0);
    setPumpPressurePsi(15);
    setIsFlushing(false);
    setIsGameOver(false);
    setScore(0);
    setSystemLog('ECLSS Loop initialized. Keep pressure near 15 PSI!');
    setStages([
      { id: 'solids_filter', name: '1. Regolith Solids Trap', icon: '🪨', description: 'Centrifugal vortex filter capturing dust & micro-particulates', purityEfficiency: 98, clogLevel: 0, isActive: true },
      { id: 'membrane_desal', name: '2. Reverse Osmosis Bed', icon: '🧪', description: 'Nano-pore polymer membrane removing salts and dissolved urea', purityEfficiency: 96, clogLevel: 0, isActive: true },
      { id: 'uv_catalytic', name: '3. Catalytic UV Oxidizer', icon: '⚡', description: 'High-energy ultraviolet reactor sterilizing bacterial biofilms', purityEfficiency: 99, clogLevel: 0, isActive: true },
      { id: 'mineralizer', name: '4. Potable Mineralizer', icon: '💎', description: 'Balances essential magnesium and calcium for safe astronaut hydration', purityEfficiency: 97, clogLevel: 0, isActive: true }
    ]);
  }, [difficulty]);

  // Flush specific clogged filter stage
  const flushFilter = (id: string) => {
    sound.playPowerUp();
    setIsFlushing(true);
    setStages(prev =>
      prev.map(s => (s.id === id ? { ...s, clogLevel: 0 } : s))
    );
    setSystemLog(`Thermal backwash flushed ${id.replace('_', ' ')}! Clean flow restored.`);
    setTimeout(() => setIsFlushing(false), 500);
  };

  // Real-time loop tick
  useEffect(() => {
    if (showInstructions || isGameOver) return;

    const interval = setInterval(() => {
      // Flow rate depends on pump pressure: 0.8 L/s at 15 PSI
      const pressureDiff = Math.abs(pumpPressurePsi - 15);
      const isOverpressured = pumpPressurePsi > 15 + difficultyConfig.pressureTolerance;
      const isUnderpressured = pumpPressurePsi < 15 - difficultyConfig.pressureTolerance;

      setRawWaterReserveLiters(prevRaw => {
        if (prevRaw <= 0) {
          // Finished processing!
          setIsGameOver(true);
          return 0;
        }

        const flowStep = Math.min(prevRaw, Number((0.8 + (pumpPressurePsi - 15) * 0.04).toFixed(2)));
        const remainingRaw = Number((prevRaw - flowStep).toFixed(2));

        // Check leaks vs purified
        if (isOverpressured) {
          // Leak! High pressure blows past safety valve
          const leakAmount = Number((flowStep * 0.35).toFixed(2));
          const pureAmount = Number((flowStep - leakAmount).toFixed(2));
          setLeakedWaterLiters(l => Number((l + leakAmount).toFixed(2)));
          setPurifiedWaterLiters(p => Number((p + pureAmount).toFixed(2)));
          sound.playAlert();
          setSystemLog('OVERPRESSURE LEAK! Safety relief valve venting water. Lower PSI!');
        } else if (isUnderpressured) {
          // Sluggish flow
          const pureAmount = Number((flowStep * 0.5).toFixed(2));
          setPurifiedWaterLiters(p => Number((p + pureAmount).toFixed(2)));
          sound.playThud();
          setSystemLog('Low flow rate! Increase pump pressure to maintain recycling speed.');
        } else {
          // Ideal flow
          setPurifiedWaterLiters(p => Number((p + flowStep).toFixed(2)));
          sound.playBlip();
        }

        return remainingRaw;
      });

      // Accumulate filter clogs
      setStages(prevStages =>
        prevStages.map((st, i) => {
          const clogDelta = difficultyConfig.clogRate * (i === 0 ? 1.4 : 1.0);
          const nextClog = Math.min(100, st.clogLevel + clogDelta);
          if (nextClog >= 80 && st.clogLevel < 80) {
            sound.playAlert();
            setSystemLog(`Filter Warning: ${st.name} is 80% saturated! Flush filter bed.`);
          }
          return { ...st, clogLevel: Number(nextClog.toFixed(1)) };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [showInstructions, isGameOver, pumpPressurePsi, difficulty]);

  // Check Game Completion (fires once when isGameOver becomes true)
  useEffect(() => {
    if (isGameOver && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const totalProcessed = purifiedWaterLiters + leakedWaterLiters;
      const recoveryRate = totalProcessed > 0
        ? Number(((purifiedWaterLiters / totalProcessed) * 100).toFixed(1))
        : 0;

      const finalScore = Math.round(
        purifiedWaterLiters * 30 + recoveryRate * 15 - leakedWaterLiters * 20
      );
      setScore(finalScore);

      const stars = recoveryRate >= 95 ? 3 : recoveryRate >= 85 ? 2 : recoveryRate > 60 ? 1 : 0;
      sound.playSuccess();
      onSaveScore(finalScore, stars);
    }
  }, [isGameOver, purifiedWaterLiters, leakedWaterLiters, onSaveScore]);

  const totalProcessed = purifiedWaterLiters + leakedWaterLiters;
  const currentRecoveryPercent = totalProcessed > 0
    ? Number(((purifiedWaterLiters / totalProcessed) * 100).toFixed(1))
    : 100;

  const starsEarned = currentRecoveryPercent >= 95 ? 3 : currentRecoveryPercent >= 85 ? 2 : 1;

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
          scienceTakeaway="Closed-loop space life support requires multi-stage filtration to convert every drop of perspiration, urine, and breath humidity into sterile, mineral-balanced water."
          statsSummary={[
            { label: 'Water Recovered', value: `${purifiedWaterLiters} L` },
            { label: 'Recycling Efficiency', value: `${currentRecoveryPercent}%` },
            { label: 'Water Lost to Leaks', value: `${leakedWaterLiters} L` }
          ]}
          onReplay={resetGame}
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
              <Droplets className="w-4 h-4 text-blue-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Save Every Drop</h1>
              <span className="text-xs font-mono text-blue-300 uppercase px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 font-semibold">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Purify {difficultyConfig.targetLiters} liters with $\ge 95\%$ closed-loop recovery.
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          {/* Recovery % */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Recovery Rate</div>
              <div className={`font-mono font-bold ${currentRecoveryPercent >= 95 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {currentRecoveryPercent}%
              </div>
            </div>
          </div>

          {/* Purified Liter Tank */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Purified Potable</div>
              <div className="font-mono font-bold text-white">
                {purifiedWaterLiters} L / {difficultyConfig.targetLiters} L
              </div>
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
              resetGame();
            }}
            title="Restart purification run"
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

      {/* System Status Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
          <span><strong>ECLSS Loop Status:</strong> {systemLog}</span>
        </div>
        <div className="text-[11px] font-mono text-cyan-300">
          Raw Inflow Remaining: <strong className="text-white">{rawWaterReserveLiters} L</strong>
        </div>
      </div>

      {/* Pipeline Visualizer & 4 Stages */}
      <div className="bg-[#050811] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Pump Pressure Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Main Inflow Hydraulic Pump Pressure</span>
            </div>
            <div className="font-mono text-xs">
              Pressure: <span className={`font-bold ${Math.abs(pumpPressurePsi - 15) <= difficultyConfig.pressureTolerance ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>{pumpPressurePsi} PSI</span> (Target: 15 PSI)
            </div>
          </div>

          <input
            type="range"
            min="5"
            max={difficultyConfig.maxPressure}
            value={pumpPressurePsi}
            onChange={(e) => {
              sound.playBlip();
              setPumpPressurePsi(Number(e.target.value));
            }}
            className="w-full accent-blue-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>5 PSI (Low Flow)</span>
            <span className="text-emerald-400 font-bold">12–18 PSI (Optimal Recovery Zone)</span>
            <span>{difficultyConfig.maxPressure} PSI (Overpressure Risk)</span>
          </div>
        </div>

        {/* 4 Filter Chamber Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map(st => (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                st.clogLevel >= 80
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-md shadow-rose-950/40'
                  : st.clogLevel >= 50
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{st.icon}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {st.purityEfficiency}% Efficiency
                  </span>
                </div>
                <h2 className="text-xs font-bold text-white mt-1.5">{st.name}</h2>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                  {st.description}
                </p>
              </div>

              {/* Clog progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Residue Saturation:</span>
                  <span className={st.clogLevel >= 80 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {st.clogLevel}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      st.clogLevel >= 80 ? 'bg-rose-500' : st.clogLevel >= 50 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${st.clogLevel}%` }}
                  />
                </div>

                <button
                  onClick={() => flushFilter(st.id)}
                  disabled={st.clogLevel < 20 || isFlushing}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    st.clogLevel >= 60
                      ? 'bg-blue-500 hover:bg-blue-400 text-slate-950 shadow-md shadow-blue-500/30 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
                  <span>Purge Flush</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
