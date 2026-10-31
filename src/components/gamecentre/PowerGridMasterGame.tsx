import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Zap,
  Battery,
  BatteryCharging,
  Sun,
  Shield,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Flame,
  ArrowRight,
  Sliders,
  Play,
  Pause
} from 'lucide-react';

interface PowerGridMasterGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface PowerConsumer {
  id: string;
  name: string;
  powerKw: number;
  isVital: boolean;
  active: boolean;
  description: string;
  icon: string;
}

interface PuzzleLevel {
  levelNumber: number;
  title: string;
  scenario: string;
  targetDurationSec: number;
  solarPotentialKw: number;
  dustPenalty: number;
  batteryCapacityKwh: number;
  initialBatteryKwh: number;
  fuelCellReserveKw: number;
  tip: string;
}

const PUZZLE_LEVELS: Record<number, PuzzleLevel> = {
  1: {
    levelNumber: 1,
    title: 'Level 1: High-Sun Daytime Setup',
    scenario: 'Normal midday sun. Calibrate solar tracking and route electricity to start charging battery banks.',
    targetDurationSec: 30,
    solarPotentialKw: 16.0,
    dustPenalty: 0,
    batteryCapacityKwh: 40,
    initialBatteryKwh: 20,
    fuelCellReserveKw: 0,
    tip: 'Align solar tracking to 90° for maximum sun capture. When net power is green (+), batteries charge!'
  },
  2: {
    levelNumber: 2,
    title: 'Level 2: Regolith Dust Storm Event',
    scenario: 'A surface dust event is coating photovoltaic panels, slashing solar power by 55%. Activate thermal dust wipers and shed secondary loads.',
    targetDurationSec: 35,
    solarPotentialKw: 14.0,
    dustPenalty: 0.55,
    batteryCapacityKwh: 40,
    initialBatteryKwh: 25,
    fuelCellReserveKw: 3.0,
    tip: 'Deploy wiper shields to purge dust, or switch off perimeter lights and the science drill to keep Life Support stable!'
  },
  3: {
    levelNumber: 3,
    title: 'Level 3: Polar Sunset Emergency',
    scenario: 'Solar towers are slipping behind Malapert Mountain into shadow! Zero solar power available. Manage fuel cells and battery discharge to survive until dawn.',
    targetDurationSec: 40,
    solarPotentialKw: 0,
    dustPenalty: 0,
    batteryCapacityKwh: 45,
    initialBatteryKwh: 30,
    fuelCellReserveKw: 4.5,
    tip: 'Immediately shed all non-vital systems! Rely on your reserve hydrogen fuel cell and stored battery kWh.'
  }
};

export const PowerGridMasterGame: React.FC<PowerGridMasterGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'power_grid') || GAME_DEFINITIONS[1];

  // Difficulty modifiers
  const difficultyModifier = {
    explorer: { timeBonusFactor: 1.2, blackoutToleranceSec: 6 },
    junior_engineer: { timeBonusFactor: 1.0, blackoutToleranceSec: 4 },
    mission_commander: { timeBonusFactor: 0.8, blackoutToleranceSec: 3 }
  }[difficulty];

  // Game & Level State
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const currentLevel = PUZZLE_LEVELS[currentLevelNumber];

  const [secondsRemaining, setSecondsRemaining] = useState<number>(currentLevel.targetDurationSec);
  const [solarAngle, setSolarAngle] = useState<number>(90); // 0 to 180 degrees
  const [isWipersActive, setIsWipersActive] = useState<boolean>(false);
  const [isFuelCellConnected, setIsFuelCellConnected] = useState<boolean>(false);
  const [isBatteryStorageOnline, setIsBatteryStorageOnline] = useState<boolean>(true);
  const [batteryStorageKwh, setBatteryStorageKwh] = useState<number>(currentLevel.initialBatteryKwh);

  const [consumers, setConsumers] = useState<PowerConsumer[]>([
    { id: 'life_support', name: 'Life Support & O2 Loop', powerKw: 3.5, isVital: true, active: true, description: 'Oxygen generation and cabin pressurization', icon: '🫁' },
    { id: 'comm_tower', name: 'Earth Deep Space Comm', powerKw: 2.0, isVital: true, active: true, description: 'Direct telemetry link to Mission Control', icon: '📡' },
    { id: 'hydroponics', name: 'Greenhouse LED Array', powerKw: 2.2, isVital: false, active: true, description: 'Food production and CO2 scrubbing', icon: '🌱' },
    { id: 'science_lab', name: 'Core Analysis Spectrometer', powerKw: 2.8, isVital: false, active: true, description: 'Lunar sample volatile research', icon: '🔬' },
    { id: 'floodlights', name: 'Surface Perimeter Floodlights', powerKw: 1.5, isVital: false, active: true, description: 'External ridge illumination', icon: '💡' }
  ]);

  const [lifeSupportBlackoutSec, setLifeSupportBlackoutSec] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [gridLog, setGridLog] = useState<string>('Power distribution bus nominal. Balance generation with load.');

  const hasSavedRef = useRef<boolean>(false);

  // Reset Level function
  const resetLevel = useCallback((lvlNum: number) => {
    hasSavedRef.current = false;
    const lvl = PUZZLE_LEVELS[lvlNum] || PUZZLE_LEVELS[1];
    setCurrentLevelNumber(lvlNum);
    setSecondsRemaining(lvl.targetDurationSec);
    setSolarAngle(lvl.solarPotentialKw > 0 ? 90 : 0);
    setIsWipersActive(false);
    setIsFuelCellConnected(false);
    setIsBatteryStorageOnline(true);
    setBatteryStorageKwh(lvl.initialBatteryKwh);
    setLifeSupportBlackoutSec(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setScore(0);
    setConsumers([
      { id: 'life_support', name: 'Life Support & O2 Loop', powerKw: 3.5, isVital: true, active: true, description: 'Oxygen generation and cabin pressurization', icon: '🫁' },
      { id: 'comm_tower', name: 'Earth Deep Space Comm', powerKw: 2.0, isVital: true, active: true, description: 'Direct telemetry link to Mission Control', icon: '📡' },
      { id: 'hydroponics', name: 'Greenhouse LED Array', powerKw: 2.2, isVital: false, active: true, description: 'Food production and CO2 scrubbing', icon: '🌱' },
      { id: 'science_lab', name: 'Core Analysis Spectrometer', powerKw: 2.8, isVital: false, active: true, description: 'Lunar sample volatile research', icon: '🔬' },
      { id: 'floodlights', name: 'Surface Perimeter Floodlights', powerKw: 1.5, isVital: false, active: true, description: 'External ridge illumination', icon: '💡' }
    ]);
    setGridLog(`Loaded ${lvl.title}. ${lvl.scenario}`);
  }, []);

  // Calculate live power calculations
  // Solar: efficiency drops as angle deviates from 90°
  const angleEfficiency = Math.max(0, Math.sin((solarAngle * Math.PI) / 180));
  const effectiveDustPenalty = isWipersActive ? 0 : currentLevel.dustPenalty;
  const solarGeneratedKw = Number((currentLevel.solarPotentialKw * angleEfficiency * (1 - effectiveDustPenalty)).toFixed(1));
  const fuelCellGeneratedKw = isFuelCellConnected ? currentLevel.fuelCellReserveKw : 0;
  const totalGenerationKw = Number((solarGeneratedKw + fuelCellGeneratedKw).toFixed(1));

  const totalDemandKw = Number(
    consumers.filter(c => c.active).reduce((sum, c) => sum + c.powerKw, 0).toFixed(1)
  );

  const netPowerKw = Number((totalGenerationKw - totalDemandKw).toFixed(1));
  const isLifeSupportPowered = consumers.find(c => c.id === 'life_support')?.active && (netPowerKw >= 0 || batteryStorageKwh > 0);

  // Toggle consumer switch
  const toggleConsumer = (id: string) => {
    sound.playClick();
    setConsumers(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextState = !c.active;
          setGridLog(`${nextState ? 'Energized' : 'Load shed'}: ${c.name} (${c.powerKw} kW).`);
          return { ...c, active: nextState };
        }
        return c;
      })
    );
  };

  // Toggle fuel cell
  const toggleFuelCell = () => {
    sound.playPowerUp();
    setIsFuelCellConnected(prev => !prev);
    setGridLog(isFuelCellConnected ? 'Reserve Fuel Cell disconnected.' : 'Hydrogen Fuel Cell engaged (+4.5 kW)!');
  };

  // Toggle dust wipers
  const toggleWipers = () => {
    sound.playPowerUp();
    setIsWipersActive(prev => !prev);
    setGridLog(isWipersActive ? 'Photovoltaic dust wipers disengaged.' : 'Vibrational dust wipers active! Clear panel glass.');
  };

  // Main Simulation Interval (1 tick per second)
  useEffect(() => {
    if (showInstructions || isGameOver || isPaused) return;

    const timer = setInterval(() => {
      // 1. Update Battery storage based on netPower
      setBatteryStorageKwh(prevBat => {
        const delta = Number((netPowerKw * 0.35).toFixed(2));
        const nextBat = Math.min(currentLevel.batteryCapacityKwh, Math.max(0, prevBat + delta));
        return Number(nextBat.toFixed(1));
      });

      // 2. Check Life support status
      const lifeSupportActive = consumers.find(c => c.id === 'life_support')?.active ?? false;
      const hasPower = netPowerKw >= 0 || batteryStorageKwh > 0;

      if (!lifeSupportActive || !hasPower) {
        setLifeSupportBlackoutSec(prev => {
          const next = prev + 1;
          sound.playAlert();
          setGridLog(`EMERGENCY: Life Support unpowered for ${next}s! Crew oxygen dropping!`);

          if (next >= difficultyModifier.blackoutToleranceSec) {
            // Failure condition
            if (!hasSavedRef.current) {
              hasSavedRef.current = true;
              setIsGameOver(true);
              setIsVictory(false);
              sound.playAlert();
              setScore(Math.max(50, (currentLevel.targetDurationSec - secondsRemaining) * 20));
              onSaveScore(Math.max(50, (currentLevel.targetDurationSec - secondsRemaining) * 20), 0);
            }
          }
          return next;
        });
      } else {
        setLifeSupportBlackoutSec(0);
      }

      // 3. Countdown timer to victory
      setSecondsRemaining(t => {
        if (t <= 1) {
          // Level Completed!
          if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            setIsGameOver(true);
            setIsVictory(true);
            sound.playSuccess();

            // Calculate score
            const levelPoints = currentLevelNumber * 500;
            const batteryBonus = Math.round(batteryStorageKwh * 25);
            const efficiencyBonus = netPowerKw >= 0 ? 300 : 100;
            const finalScore = Math.round(levelPoints + batteryBonus + efficiencyBonus);

            setScore(finalScore);
            const stars = finalScore >= 1600 ? 3 : finalScore >= 1000 ? 2 : 1;
            onSaveScore(finalScore, stars);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    showInstructions,
    isGameOver,
    isPaused,
    netPowerKw,
    batteryStorageKwh,
    consumers,
    currentLevel,
    currentLevelNumber,
    secondsRemaining,
    difficultyModifier,
    onSaveScore
  ]);

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
          starsEarned={isVictory ? (score >= 1500 ? 3 : score >= 1000 ? 2 : 1) : 0}
          isNewHighScore={score > highScore}
          scienceTakeaway="Power management on the Moon demands dynamic load-shedding: sacrificing luxury systems (lights, drills) to safeguard non-negotiable life support oxygen, while storing daytime solar surplus in regenerative fuel cells and batteries."
          statsSummary={[
            { label: 'Level Cleared', value: `${currentLevel.title.split(':')[0]}` },
            { label: 'Battery Stored', value: `${batteryStorageKwh} kWh` },
            { label: 'Net Power Status', value: `${netPowerKw > 0 ? '+' : ''}${netPowerKw} kW` },
            { label: 'Life Support', value: isLifeSupportPowered ? '100% Online' : 'Offline' }
          ]}
          onReplay={() => resetLevel(currentLevelNumber)}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}

      {/* Top Header & Level Bar */}
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
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Engineering</span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-amber-300 font-mono capitalize">{difficulty.replace('_', ' ')}</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">Power Grid Master</h2>
          </div>
        </div>

        {/* Level Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {[1, 2, 3].map(lvl => (
            <button
              key={lvl}
              onClick={() => {
                sound.playClick();
                resetLevel(lvl);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                currentLevelNumber === lvl
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Level {lvl}
            </button>
          ))}
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
              resetLevel(currentLevelNumber);
            }}
            title="Restart Level"
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
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Scenario Banner */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-amber-300 block">{currentLevel.title}</span>
          <p className="text-slate-300 leading-relaxed">{currentLevel.scenario}</p>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Generation */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Generation</span>
            </span>
            <span className="font-mono font-bold text-amber-300">{totalGenerationKw} kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Solar: {solarGeneratedKw} kW · Fuel Cell: {fuelCellGeneratedKw} kW
          </div>
        </div>

        {/* Total Consumption */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Base Load</span>
            </span>
            <span className="font-mono font-bold text-rose-300">{totalDemandKw} kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {consumers.filter(c => c.active).length} of {consumers.length} modules active
          </div>
        </div>

        {/* Net Power Balance */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Net Power Balance</span>
            <span className={`font-mono font-bold ${netPowerKw >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netPowerKw > 0 ? `+${netPowerKw}` : netPowerKw} kW
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {netPowerKw >= 0 ? 'Charging battery bank' : 'Draining battery reserve'}
          </div>
        </div>

        {/* Battery Reserve */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-cyan-400" />
              <span>Battery Storage</span>
            </span>
            <span className="font-mono font-bold text-white">{batteryStorageKwh} / {currentLevel.batteryCapacityKwh} kWh</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                batteryStorageKwh > 20 ? 'bg-cyan-400' : batteryStorageKwh > 10 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${Math.min(100, (batteryStorageKwh / currentLevel.batteryCapacityKwh) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Circuit Control Room */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Power Generators (Solar Array & Fuel Cell) */}
        <div className="lg:col-span-5 bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Power Generation</h3>
            </div>
            <span className="text-[11px] text-amber-300 font-mono font-bold">{totalGenerationKw} kW Available</span>
          </div>

          {/* Solar Tracking Calibration */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Solar Array Tracking Angle</span>
              <span className="font-mono text-cyan-300 font-bold">{solarAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={solarAngle}
              onChange={e => {
                setSolarAngle(Number(e.target.value));
                sound.playClick();
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0° (Sunrise)</span>
              <span className="text-cyan-400 font-bold">90° (Direct Sun)</span>
              <span>180° (Sunset)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Solar Alignment Efficiency: <span className="font-mono text-white font-bold">{Math.round(angleEfficiency * 100)}%</span>
            </div>
          </div>

          {/* Dust Wiper Toggle (Crucial in Level 2) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Thermal Dust Wipers</span>
              </div>
              <p className="text-[11px] text-slate-400">Vibrates fine regolith dust off solar glass covers</p>
            </div>
            <button
              onClick={toggleWipers}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isWipersActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {isWipersActive ? 'Wipers Active' : 'Engage Wipers'}
            </button>
          </div>

          {/* Hydrogen Fuel Cell (Crucial in Level 3) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Emergency Hydrogen Fuel Cell</span>
              </div>
              <p className="text-[11px] text-slate-400">Combines stored O2 and H2 to generate +4.5 kW clean power</p>
            </div>
            <button
              onClick={toggleFuelCell}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isFuelCellConnected
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {isFuelCellConnected ? 'Online (+4.5 kW)' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Right: Consumers & Circuit Breakers */}
        <div className="lg:col-span-7 bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Subsystem Load Shedding</h3>
            </div>
            <span className="text-[11px] text-rose-300 font-mono font-bold">Total Demand: {totalDemandKw} kW</span>
          </div>

          <div className="space-y-2.5">
            {consumers.map(c => {
              const isVital = c.isVital;
              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    c.active
                      ? isVital
                        ? 'bg-cyan-950/30 border-cyan-500/40'
                        : 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {isVital && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                            Non-Negotiable
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{c.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-300">{c.powerKw} kW</span>
                    <button
                      onClick={() => toggleConsumer(c.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        c.active
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {c.active ? 'ON' : 'SHED'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Survival Clock & Log */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">Survive for:</span>
              <span className="font-mono font-black text-amber-300 text-base">{secondsRemaining}s</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-sm">
              {gridLog}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
