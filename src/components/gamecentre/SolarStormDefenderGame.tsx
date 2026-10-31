import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SolarStormDefenderGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface Astronaut {
  id: string;
  name: string;
  role: string;
  isSheltered: boolean;
}

const DEFENDER_DIFFICULTY_CONFIG: Record<GameDifficulty, { warningSeconds: number; requiredCoilCharge: number; polarityTarget: 'positive' | 'negative' }> = {
  explorer: { warningSeconds: 35, requiredCoilCharge: 80, polarityTarget: 'positive' },
  junior_engineer: { warningSeconds: 25, requiredCoilCharge: 90, polarityTarget: 'negative' },
  mission_commander: { warningSeconds: 18, requiredCoilCharge: 100, polarityTarget: 'positive' }
};

export const SolarStormDefenderGame: React.FC<SolarStormDefenderGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'solar_storm_defender')!;
  const difficultyConfig = DEFENDER_DIFFICULTY_CONFIG[difficulty];

  // State
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(difficultyConfig.warningSeconds);
  const [coilChargePercent, setCoilChargePercent] = useState<number>(0);
  const [selectedPolarity, setSelectedPolarity] = useState<'positive' | 'negative'>('positive');
  const [isShuttersClosed, setIsShuttersClosed] = useState<boolean>(false);
  const [astronauts, setAstronauts] = useState<Astronaut[]>([
    { id: 'ast_1', name: 'Commander Alex', role: 'Flight Director', isSheltered: false },
    { id: 'ast_2', name: 'Dr. Maya', role: 'ECLSS Astrobiologist', isSheltered: false },
    { id: 'ast_3', name: 'Engineer Leo', role: 'Power Systems Specialist', isSheltered: false },
    { id: 'ast_4', name: 'Geologist Sam', role: 'Polar Volatiles Lead', isSheltered: false }
  ]);
  const [isImpactPhase, setIsImpactPhase] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [radiationAbsorbedMsv, setRadiationAbsorbedMsv] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [defenseLog, setDefenseLog] = useState<string>('WARNING: Coronal Mass Ejection detected! Initiate base defense.');
  const hasSavedRef = useRef<boolean>(false);

  const resetGame = useCallback(() => {
    hasSavedRef.current = false;
    setCountdownSeconds(difficultyConfig.warningSeconds);
    setCoilChargePercent(0);
    setSelectedPolarity('positive');
    setIsShuttersClosed(false);
    setAstronauts([
      { id: 'ast_1', name: 'Commander Alex', role: 'Flight Director', isSheltered: false },
      { id: 'ast_2', name: 'Dr. Maya', role: 'ECLSS Astrobiologist', isSheltered: false },
      { id: 'ast_3', name: 'Engineer Leo', role: 'Power Systems Specialist', isSheltered: false },
      { id: 'ast_4', name: 'Geologist Sam', role: 'Polar Volatiles Lead', isSheltered: false }
    ]);
    setIsImpactPhase(false);
    setIsGameOver(false);
    setRadiationAbsorbedMsv(0);
    setScore(0);
    setDefenseLog('WARNING: Coronal Mass Ejection detected! Initiate base defense.');
  }, [difficulty]);

  // Charge deflector coils
  const handleChargeCoils = () => {
    sound.playPowerUp();
    setCoilChargePercent(p => Math.min(100, p + 25));
    setDefenseLog('Electromagnetic coils charging! Ramping field intensity.');
  };

  // Toggle shutters
  const handleToggleShutters = () => {
    sound.playClick();
    setIsShuttersClosed(prev => !prev);
    setDefenseLog(isShuttersClosed ? 'Regolith shutters opened.' : 'Regolith shutters lowered over habitat viewports!');
  };

  // Shelter individual astronaut
  const handleShelterAstronaut = (id: string) => {
    sound.playBlip();
    setAstronauts(prev =>
      prev.map(a => (a.id === id ? { ...a, isSheltered: true } : a))
    );
    const ast = astronauts.find(a => a.id === id);
    if (ast) {
      setDefenseLog(`${ast.name} safely descended into the subterranean lava tube bunker!`);
    }
  };

  // Shelter all astronauts quickly
  const handleShelterAll = () => {
    sound.playScore();
    setAstronauts(prev => prev.map(a => ({ ...a, isSheltered: true })));
    setDefenseLog('All crew members safely evacuated to underground lava tube bunker!');
  };

  // Countdown clock
  useEffect(() => {
    if (showInstructions || isGameOver || isImpactPhase) return;

    const timer = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          // Trigger Impact Phase!
          setIsImpactPhase(true);
          sound.playAlert();
          setDefenseLog('SHOCKWAVE IMPACT! Solar Energetic Particle wave washing over Outpost Alpha.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInstructions, isGameOver, isImpactPhase]);

  // Handle Impact Phase Resolution
  useEffect(() => {
    if (!isImpactPhase || hasSavedRef.current) return;

    const resolveTimeout = setTimeout(() => {
      if (hasSavedRef.current) return;
      hasSavedRef.current = true;

      // Calculate radiation absorbed
      const unshelteredCrew = astronauts.filter(a => !a.isSheltered).length;
      const isPolarityCorrect = selectedPolarity === difficultyConfig.polarityTarget;
      const coilEfficiency = (coilChargePercent / 100) * (isPolarityCorrect ? 1.0 : 0.4);

      let doseMsv = 0;
      if (unshelteredCrew > 0) {
        doseMsv += unshelteredCrew * 8.5;
      }
      if (!isShuttersClosed) {
        doseMsv += 3.2;
      }
      if (coilEfficiency < 0.8) {
        doseMsv += (1 - coilEfficiency) * 4.0;
      }

      doseMsv = Number(doseMsv.toFixed(1));
      setRadiationAbsorbedMsv(doseMsv);

      const shelteredCount = astronauts.filter(a => a.isSheltered).length;
      const basePoints = shelteredCount * 300 + (isShuttersClosed ? 300 : 0) + Math.round(coilEfficiency * 400);
      const dosePenalty = Math.round(doseMsv * 50);
      const finalScore = Math.max(100, basePoints - dosePenalty);

      setScore(finalScore);
      setIsGameOver(true);
      setIsImpactPhase(false);

      if (doseMsv === 0) {
        sound.playSuccess();
      } else {
        sound.playThud();
      }

      const stars = doseMsv === 0 ? 3 : doseMsv < 5.0 ? 2 : 1;
      onSaveScore(finalScore, stars);
    }, 3500);

    return () => clearTimeout(resolveTimeout);
  }, [
    isImpactPhase,
    astronauts,
    selectedPolarity,
    difficulty,
    coilChargePercent,
    isShuttersClosed,
    onSaveScore
  ]);

  const shelteredCount = astronauts.filter(a => a.isSheltered).length;
  const isPolarityCorrect = selectedPolarity === difficultyConfig.polarityTarget;
  const starsEarned = radiationAbsorbedMsv === 0 ? 3 : radiationAbsorbedMsv < 5.0 ? 2 : 1;

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
          scienceTakeaway="Because the Moon lacks an atmospheric shield, solar storms bombard the surface with lethal energetic protons. Subterranean basalt lava tubes provide 100% passive shelter for astronauts."
          statsSummary={[
            { label: 'Crew Sheltered', value: `${shelteredCount} / 4 Astronauts` },
            { label: 'Radiation Absorbed', value: `${radiationAbsorbedMsv} mSv` },
            { label: 'Deflector Shield Charge', value: `${coilChargePercent}%` }
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
              <Shield className="w-4 h-4 text-rose-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Solar Storm Defender</h1>
              <span className="text-xs font-mono text-rose-300 uppercase px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 font-semibold">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Incoming CME proton shockwave! Align shields and evacuate crew to underground shelter.
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          {/* Wave Countdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Wave Arrival</div>
              <div className="font-mono font-bold text-rose-300">
                {countdownSeconds > 0 ? `${countdownSeconds}s` : 'IMPACT!'}
              </div>
            </div>
          </div>

          {/* Sheltered Crew Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Users className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Crew Sheltered</div>
              <div className="font-mono font-bold text-cyan-300">
                {shelteredCount} / 4
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
            title="Reset simulation"
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

      {/* Defense Log Strip */}
      <div className={`border rounded-lg px-4 py-2 flex items-center justify-between text-xs transition-colors ${
        isImpactPhase
          ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <span><strong>Space Weather Radar:</strong> {defenseLog}</span>
        </div>
        <div className="text-[11px] font-mono text-cyan-300">
          Target Wave Polarity: <strong className="text-white uppercase">{difficultyConfig.polarityTarget}</strong>
        </div>
      </div>

      {/* Interactive Base Defense Command Center */}
      <div className="bg-[#050811] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Defense Stage 1: Electromagnetic Deflector Field */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Action 1: Electromagnetic Deflector Coil Array</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Charge magnetic coils and match polarity to repel positively-charged incoming solar protons.
              </p>
            </div>

            <button
              onClick={handleChargeCoils}
              disabled={coilChargePercent >= 100 || isImpactPhase}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-md shadow-cyan-500/20 whitespace-nowrap self-start sm:self-auto"
            >
              + Charge Coils (+25%)
            </button>
          </div>

          {/* Coil Progress & Polarity Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Coil Field Strength:</span>
                <span className="text-cyan-300 font-bold">{coilChargePercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${coilChargePercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Coil Polarity:</span>
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedPolarity('positive');
                }}
                className={`px-3 py-1 rounded-md font-mono text-xs font-bold border transition-all ${
                  selectedPolarity === 'positive'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                + POSITIVE
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedPolarity('negative');
                }}
                className={`px-3 py-1 rounded-md font-mono text-xs font-bold border transition-all ${
                  selectedPolarity === 'negative'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                - NEGATIVE
              </button>
            </div>
          </div>
        </div>

        {/* Defense Stage 2: Regolith Blast Shutters */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Action 2: Regolith Blast Shutters</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Lower robotic 2.5-meter lunar soil shutters over surface dome viewports.
            </p>
          </div>

          <button
            onClick={handleToggleShutters}
            disabled={isImpactPhase}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap self-start sm:self-auto ${
              isShuttersClosed
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {isShuttersClosed ? '✓ Shutters Sealed (Protected)' : 'Lower Blast Shutters'}
          </button>
        </div>

        {/* Defense Stage 3: Evacuate Crew to Lava Tube Bunker */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Action 3: Evacuate Crew to Subsurface Lava Tube Bunker</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Move all 4 astronauts deep into the natural underground basalt cave for 100% passive shielding.
              </p>
            </div>

            <button
              onClick={handleShelterAll}
              disabled={shelteredCount === 4 || isImpactPhase}
              className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs shadow-md shadow-emerald-500/20 whitespace-nowrap self-start sm:self-auto"
            >
              Evacuate All Crew
            </button>
          </div>

          {/* 4 Astronaut Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {astronauts.map(ast => (
              <div
                key={ast.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  ast.isSheltered
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">{ast.name}</div>
                  <div className="text-[10px] text-slate-400">{ast.role}</div>
                </div>

                {ast.isSheltered ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Bunker
                  </span>
                ) : (
                  <button
                    onClick={() => handleShelterAstronaut(ast.id)}
                    disabled={isImpactPhase}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[11px] font-semibold rounded-md border border-slate-700 transition-colors"
                  >
                    Shelter
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
