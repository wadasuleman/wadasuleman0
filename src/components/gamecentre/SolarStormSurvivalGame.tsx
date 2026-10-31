import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  ShieldAlert,
  Sun,
  Zap,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Flame,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SolarStormSurvivalGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface WaveConfig {
  waveNumber: number;
  intensity: 'MODERATE' | 'SEVERE' | 'EXTREME';
  protonFlux: number; // Protons / cm²-sec
  incomingPolarity: '+' | '-';
  durationSec: number;
}

interface StormDifficultyConfig {
  name: string;
  totalWaves: number;
  maxAllowableMsv: number;
  cmeSpeedMultiplier: number;
}

const DIFFICULTY_CONFIG: Record<GameDifficulty, StormDifficultyConfig> = {
  explorer: {
    name: 'Heliosphere Lookout',
    totalWaves: 2,
    maxAllowableMsv: 100,
    cmeSpeedMultiplier: 1.0
  },
  junior_engineer: {
    name: 'Magnetospheric Defense Engineer',
    totalWaves: 3,
    maxAllowableMsv: 80,
    cmeSpeedMultiplier: 1.3
  },
  mission_commander: {
    name: 'Solar Flare Operations Commander',
    totalWaves: 4,
    maxAllowableMsv: 65,
    cmeSpeedMultiplier: 1.6
  }
};

const WAVES_DATA: WaveConfig[] = [
  { waveNumber: 1, intensity: 'MODERATE', protonFlux: 1200, incomingPolarity: '+', durationSec: 14 },
  { waveNumber: 2, intensity: 'SEVERE', protonFlux: 3400, incomingPolarity: '-', durationSec: 16 },
  { waveNumber: 3, intensity: 'EXTREME', protonFlux: 6800, incomingPolarity: '+', durationSec: 18 },
  { waveNumber: 4, intensity: 'EXTREME', protonFlux: 9500, incomingPolarity: '-', durationSec: 20 }
];

export const SolarStormSurvivalGame: React.FC<SolarStormSurvivalGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find((g) => g.id === 'solar_storm') || GAME_DEFINITIONS[4];
  const config = DIFFICULTY_CONFIG[difficulty];

  // Game state
  const [currentWaveIndex, setCurrentWaveIndex] = useState<number>(0);
  const [waveSecondsLeft, setWaveSecondsLeft] = useState<number>(WAVES_DATA[0].durationSec);
  const [cumulativeRadiationMsv, setCumulativeRadiationMsv] = useState<number>(5);
  const [score, setScore] = useState<number>(0);

  // Player defenses
  const [coilChargePercent, setCoilChargePercent] = useState<number>(50);
  const [coilPolarity, setCoilPolarity] = useState<'+' | '-'>('+');
  const [blastShuttersClosed, setBlastShuttersClosed] = useState<boolean>(false);
  const [crewInLavaTube, setCrewInLavaTube] = useState<boolean>(false);

  // Status & notifications
  const [incomingProtonDistance, setIncomingProtonDistance] = useState<number>(100); // 100% (far) -> 0% (impacting)
  const [isImpacting, setIsImpacting] = useState<boolean>(false);

  // Modals & debrief
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(0);
  const [debriefNotes, setDebriefNotes] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const hasSavedRef = useRef<boolean>(false);
  const currentWave = WAVES_DATA[currentWaveIndex] || WAVES_DATA[0];

  // Restart
  const handleRestart = useCallback(() => {
    hasSavedRef.current = false;
    setCurrentWaveIndex(0);
    setWaveSecondsLeft(WAVES_DATA[0].durationSec);
    setCumulativeRadiationMsv(5);
    setScore(0);
    setCoilChargePercent(50);
    setCoilPolarity('+');
    setBlastShuttersClosed(false);
    setCrewInLavaTube(false);
    setIncomingProtonDistance(100);
    setIsImpacting(false);
    setIsGameOver(false);
    setVictory(false);
    setStars(0);
    setDebriefNotes([]);
  }, []);

  useEffect(() => {
    handleRestart();
  }, [difficulty, handleRestart]);

  // Main game tick
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      // Advance wave time
      setWaveSecondsLeft((prev) => {
        if (prev <= 1) {
          // Check if more waves remain
          if (currentWaveIndex + 1 < config.totalWaves) {
            setCurrentWaveIndex((w) => w + 1);
            setIncomingProtonDistance(100);
            setIsImpacting(false);
            if (soundEnabled) sound.badge();
            return WAVES_DATA[currentWaveIndex + 1].durationSec;
          } else {
            // Completed all waves!
            clearInterval(timer);
            triggerGameEnd(true, 'All CME solar storm waves safely deflected!');
            return 0;
          }
        }
        return prev - 1;
      });

      // Advance incoming shockwave distance
      setIncomingProtonDistance((prev) => {
        const speed = (100 / currentWave.durationSec) * config.cmeSpeedMultiplier;
        const nextDist = Math.max(0, prev - speed);
        if (nextDist <= 10) {
          setIsImpacting(true);
        }
        return nextDist;
      });

      // Calculate radiation dose received this tick
      // Base dosage depends on wave proton flux
      const baseDosePerSec = (currentWave.protonFlux / 2000) * 1.5;

      // Defense factors
      let deflectionReduction = 0;
      // If coil polarity matches incoming proton polarity, repulsion occurs!
      if (coilPolarity === currentWave.incomingPolarity) {
        deflectionReduction = (coilChargePercent / 100) * 0.65; // up to 65% deflected
      } else {
        // Opposites attract! Wrong polarity actually accelerates incoming ions!
        deflectionReduction = -0.15;
      }

      const shutterReduction = blastShuttersClosed ? 0.2 : 0; // regolith shutters block 20%
      const lavaTubeReduction = crewInLavaTube ? 0.75 : 0; // lava tube blocks 75%

      const totalDeflectionFraction = Math.min(0.96, Math.max(0, deflectionReduction + shutterReduction + lavaTubeReduction));
      const effectiveDose = Math.max(0.1, baseDosePerSec * (1 - totalDeflectionFraction));

      setCumulativeRadiationMsv((prev) => {
        const updated = Math.round((prev + effectiveDose) * 10) / 10;
        if (updated >= config.maxAllowableMsv) {
          triggerGameEnd(false, `Radiation dose surpassed safe operational threshold (${config.maxAllowableMsv} mSv)!`);
        }
        return updated;
      });

      // Score bonus for smart shield management
      setScore((prev) => prev + 50);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isGameOver,
    currentWaveIndex,
    currentWave,
    config.totalWaves,
    config.cmeSpeedMultiplier,
    config.maxAllowableMsv,
    coilPolarity,
    coilChargePercent,
    blastShuttersClosed,
    crewInLavaTube,
    soundEnabled
  ]);

  const triggerGameEnd = (won: boolean, reason: string) => {
    setIsGameOver(true);
    setVictory(won);

    let earnedStars = 0;
    const notes = [reason];

    if (won) {
      if (soundEnabled) sound.success();
      if (cumulativeRadiationMsv < config.maxAllowableMsv * 0.4) earnedStars = 3;
      else if (cumulativeRadiationMsv < config.maxAllowableMsv * 0.7) earnedStars = 2;
      else earnedStars = 1;

      notes.push(`Crew Total Exposure: ${cumulativeRadiationMsv} mSv (Well within lunar habitat safety limits).`);
      notes.push('NASA Heliophysics Fact: Deep lunar lava tubes and magnetic deflection shield crews without kilograms of heavy metal armor.');
    } else {
      if (soundEnabled) sound.error();
      earnedStars = 0;
      notes.push('Ensure magnetic coil polarity matches incoming ion charge (+ to +, - to -) for electrostatic repulsion!');
    }

    setStars(earnedStars);
    setDebriefNotes(notes);

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      onSaveScore(won ? score + 1200 : score, earnedStars);
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-5 p-4 sm:p-6 bg-slate-950/90 border border-rose-500/30 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-rose-300 uppercase">
                {gameDef.title}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-950/80 border border-rose-500/40 text-rose-400">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Wave {currentWaveIndex + 1}/{config.totalWaves} • Solar Flare Warning Level: {currentWave.intensity}
            </p>
          </div>
        </div>

        {/* Global Action & Status Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Wave Timer:</span>
            <span className="font-mono font-bold text-amber-400">{waveSecondsLeft}s</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Dose:</span>
            <span
              className={`font-mono font-bold ${
                cumulativeRadiationMsv > config.maxAllowableMsv * 0.7
                  ? 'text-rose-400 animate-pulse'
                  : 'text-cyan-400'
              }`}
            >
              {cumulativeRadiationMsv} / {config.maxAllowableMsv} mSv
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
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
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

      {/* Main Grid: Visualizer & Defenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Heliophysics Alert & Incoming CME Shockwave (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Solar Flare & CME Radar
                </h3>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded font-bold uppercase bg-rose-950 text-rose-300 border border-rose-700">
                Flux: {currentWave.protonFlux} protons/cm²-s
              </span>
            </div>

            {/* Radar Simulation Arena */}
            <div className="relative h-44 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-between px-6">
              {/* Sun Flare Origin */}
              <div className="flex flex-col items-center z-10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 shadow-xl shadow-amber-500/40 flex items-center justify-center text-white font-bold text-xs">
                  CME
                </div>
                <span className="text-[10px] text-amber-400 font-mono mt-1">Solar Flare</span>
              </div>

              {/* Incoming Ion Particle Shockwave */}
              <div
                className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-rose-500/80 to-amber-400/80 transition-all duration-300 flex items-center justify-center shadow-lg shadow-rose-500/50"
                style={{
                  left: `${Math.max(15, 80 - incomingProtonDistance * 0.65)}%`
                }}
              >
                <div className="text-[10px] font-bold text-white uppercase transform -rotate-90 whitespace-nowrap">
                  Ion Wave ({currentWave.incomingPolarity})
                </div>
              </div>

              {/* Deflection Shield Barrier */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                    coilPolarity === currentWave.incomingPolarity
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-500/50 text-cyan-300'
                      : 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-500/50 text-rose-300'
                  }`}
                >
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[10px] text-cyan-300 font-mono mt-1">
                  Habitat ({coilPolarity})
                </span>
              </div>
            </div>

            {/* Scientific explanation callout */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
              <strong className="text-cyan-400">Repulsion Physics:</strong> Like charges repel! Match your deflector coil polarity (<strong className="text-amber-300">{coilPolarity}</strong>) to incoming solar ions (<strong className="text-rose-400">{currentWave.incomingPolarity}</strong>) to push proton radiation away from the habitat.
            </div>
          </div>
        </div>

        {/* Right: Defense Grid Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-800">
              Habitat Radiation Defenses
            </h3>

            {/* Coil Polarity Switch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Magnetic Coil Polarity:</span>
                <span className="font-mono font-bold text-cyan-400">{coilPolarity === '+' ? 'Positive (+)' : 'Negative (-)'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isGameOver}
                  onClick={() => {
                    setCoilPolarity('+');
                    if (soundEnabled) sound.click();
                  }}
                  className={`py-2 rounded-lg font-bold text-sm transition-all border ${
                    coilPolarity === '+'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Positive (+) Coils
                </button>
                <button
                  type="button"
                  disabled={isGameOver}
                  onClick={() => {
                    setCoilPolarity('-');
                    if (soundEnabled) sound.click();
                  }}
                  className={`py-2 rounded-lg font-bold text-sm transition-all border ${
                    coilPolarity === '-'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Negative (-) Coils
                </button>
              </div>
            </div>

            {/* Coil Charge Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Coil Field Power:</span>
                <span className="font-mono font-bold text-amber-400">{coilChargePercent}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={coilChargePercent}
                disabled={isGameOver}
                onChange={(e) => setCoilChargePercent(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Blast Shutters Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Regolith Blast Shutters</h4>
                <p className="text-[11px] text-slate-400">Heavy sintered regolith viewport covers</p>
              </div>
              <button
                type="button"
                disabled={isGameOver}
                onClick={() => {
                  setBlastShuttersClosed(!blastShuttersClosed);
                  if (soundEnabled) sound.click();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  blastShuttersClosed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {blastShuttersClosed ? 'DEPLOYED' : 'OPEN'}
              </button>
            </div>

            {/* Lava Tube Evacuation Action */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Lava Tube Shelter</h4>
                <p className="text-[11px] text-slate-400">Deep basalt cave with 15m overhead shielding</p>
              </div>
              <button
                type="button"
                disabled={isGameOver}
                onClick={() => {
                  setCrewInLavaTube(!crewInLavaTube);
                  if (soundEnabled) sound.click();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  crewInLavaTube
                    ? 'bg-purple-950 text-purple-300 border border-purple-500 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {crewInLavaTube ? 'SHELTERED' : 'HABITAT'}
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
            { label: 'Cumulative Dose', value: `${cumulativeRadiationMsv} mSv` },
            { label: 'Dose Limit', value: `${config.maxAllowableMsv} mSv` },
            { label: 'Coil Charge', value: `${coilChargePercent}%` },
            { label: 'Waves Survived', value: `${currentWaveIndex + 1}/${config.totalWaves}` }
          ]}
          onReplay={handleRestart}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}
    </div>
  );
};
