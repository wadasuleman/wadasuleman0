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
  ShieldAlert,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Wind
} from 'lucide-react';

interface PowerStationGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface Subsystem {
  id: string;
  name: string;
  powerKw: number;
  isVital: boolean;
  active: boolean;
}

const POWER_DIFFICULTY_CONFIG: Record<GameDifficulty, {
  initialBatteryKwh: number;
  batteryCapacityKwh: number;
  solarMaxKw: number;
  sunSpeedDegPerSec: number;
  dustChance: number;
}> = {
  explorer: {
    initialBatteryKwh: 50,
    batteryCapacityKwh: 60,
    solarMaxKw: 14.0,
    sunSpeedDegPerSec: 1.0,
    dustChance: 0.1
  },
  junior_engineer: {
    initialBatteryKwh: 35,
    batteryCapacityKwh: 50,
    solarMaxKw: 12.0,
    sunSpeedDegPerSec: 1.5,
    dustChance: 0.25
  },
  mission_commander: {
    initialBatteryKwh: 25,
    batteryCapacityKwh: 45,
    solarMaxKw: 10.5,
    sunSpeedDegPerSec: 2.0,
    dustChance: 0.4
  }
};

export const PowerStationGame: React.FC<PowerStationGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'power_station')!;
  const difficultyConfig = POWER_DIFFICULTY_CONFIG[difficulty];

  // Game state
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [sunAngle, setSunAngle] = useState<number>(45); // 0 to 180 degrees
  const [arrayAngle, setArrayAngle] = useState<number>(45);
  const [batteryStorageKwh, setBatteryStorageKwh] = useState<number>(difficultyConfig.initialBatteryKwh);
  const [isFuelCellActive, setIsFuelCellActive] = useState<boolean>(false);
  const [fuelCellReservePercent, setFuelCellReservePercent] = useState<number>(100);
  const [isDustCovered, setIsDustCovered] = useState<boolean>(false);
  const [lifeSupportFailureSeconds, setLifeSupportFailureSeconds] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const hasSavedRef = useRef<boolean>(false);

  // Subsystems
  const [subsystems, setSubsystems] = useState<Subsystem[]>([
    { id: 'life_support', name: 'Life Support Oxygen & Pressurization', powerKw: 3.5, isVital: true, active: true },
    { id: 'thermal_heating', name: 'Habitat Thermal Radiators', powerKw: 2.5, isVital: true, active: true },
    { id: 'hydroponics', name: 'Greenhouse LED Growth Lights', powerKw: 2.0, isVital: false, active: true },
    { id: 'science_drill', name: 'Subsurface Regolith Core Drill', powerKw: 2.5, isVital: false, active: true },
    { id: 'exterior_floodlights', name: 'Perimeter Floodlights', powerKw: 1.5, isVital: false, active: true }
  ]);

  // Restart game
  const resetGame = useCallback(() => {
    hasSavedRef.current = false;
    setTimeLeft(60);
    setSunAngle(30);
    setArrayAngle(30);
    setBatteryStorageKwh(difficultyConfig.initialBatteryKwh);
    setIsFuelCellActive(false);
    setFuelCellReservePercent(100);
    setIsDustCovered(false);
    setLifeSupportFailureSeconds(0);
    setIsGameOver(false);
    setIsVictory(false);
    setScore(0);
    setSubsystems([
      { id: 'life_support', name: 'Life Support Oxygen & Pressurization', powerKw: 3.5, isVital: true, active: true },
      { id: 'thermal_heating', name: 'Habitat Thermal Radiators', powerKw: 2.5, isVital: true, active: true },
      { id: 'hydroponics', name: 'Greenhouse LED Growth Lights', powerKw: 2.0, isVital: false, active: true },
      { id: 'science_drill', name: 'Subsurface Regolith Core Drill', powerKw: 2.5, isVital: false, active: true },
      { id: 'exterior_floodlights', name: 'Perimeter Floodlights', powerKw: 1.5, isVital: false, active: true }
    ]);
  }, [difficulty]);

  // Toggle subsystem
  const toggleSubsystem = (id: string) => {
    if (isGameOver) return;
    sound.playClick();
    setSubsystems(prev =>
      prev.map(s => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  // Wiper purge
  const purgeDust = () => {
    sound.playPowerUp();
    setIsDustCovered(false);
  };

  // Calculate power numbers
  // Solar alignment efficiency: 1.0 when arrayAngle matches sunAngle exactly, drops with difference
  const angleDiff = Math.abs(sunAngle - arrayAngle);
  const alignmentEfficiency = Math.max(0.1, Math.cos((angleDiff * Math.PI) / 180));
  const dustPenalty = isDustCovered ? 0.45 : 1.0;
  const solarGenerated = Number((difficultyConfig.solarMaxKw * alignmentEfficiency * dustPenalty).toFixed(2));
  const fuelCellGenerated = isFuelCellActive && fuelCellReservePercent > 0 ? 3.5 : 0;
  const totalPowerGenerated = Number((solarGenerated + fuelCellGenerated).toFixed(2));

  const totalPowerConsumed = Number(
    subsystems.filter(s => s.active).reduce((sum, s) => sum + s.powerKw, 0).toFixed(2)
  );

  const netPower = Number((totalPowerGenerated - totalPowerConsumed).toFixed(2));
  const isLifeSupportOn = subsystems.find(s => s.id === 'life_support')?.active ?? false;

  // Real-time tick effect (runs every 1 second)
  useEffect(() => {
    if (showInstructions || isGameOver) return;

    const interval = setInterval(() => {
      // 1. Update Sun Angle (moving sunset)
      setSunAngle(prev => {
        const next = prev + difficultyConfig.sunSpeedDegPerSec;
        return next > 175 ? 175 : next;
      });

      // 2. Random dust event
      if (Math.random() < difficultyConfig.dustChance * 0.1 && !isDustCovered) {
        setIsDustCovered(true);
        sound.playAlert();
      }

      // 3. Fuel cell consumption
      if (isFuelCellActive) {
        setFuelCellReservePercent(prev => {
          const next = Math.max(0, prev - 2.5);
          if (next === 0) setIsFuelCellActive(false);
          return next;
        });
      }

      // 4. Update Battery
      const batChange = netPower * 0.4;
      const nextBat = Math.min(difficultyConfig.batteryCapacityKwh, Math.max(0, batteryStorageKwh + batChange));
      setBatteryStorageKwh(Number(nextBat.toFixed(1)));

      if (nextBat <= 0 && netPower < 0) {
        if (!hasSavedRef.current) {
          hasSavedRef.current = true;
          setIsGameOver(true);
          setIsVictory(false);
          sound.playAlert();
          const failScore = Math.round((60 - timeLeft) * 15);
          setScore(failScore);
          onSaveScore(failScore, 0);
        }
        return;
      }

      // 5. Life Support alarm countdown
      if (!isLifeSupportOn) {
        setLifeSupportFailureSeconds(prev => {
          const next = prev + 1;
          sound.playAlert();
          if (next >= 5) {
            if (!hasSavedRef.current) {
              hasSavedRef.current = true;
              setIsGameOver(true);
              setIsVictory(false);
              sound.playAlert();
              const failScore = Math.round((60 - timeLeft) * 10);
              setScore(failScore);
              onSaveScore(failScore, 0);
            }
          }
          return next;
        });
      } else {
        setLifeSupportFailureSeconds(0);
      }

      // 6. Countdown Timer
      setTimeLeft(t => {
        if (t <= 1) {
          if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            setIsGameOver(true);
            setIsVictory(true);
            sound.playSuccess();
            const finalScore = Math.round(
              1000 + nextBat * 25 + fuelCellReservePercent * 5 + (isLifeSupportOn ? 200 : 0)
            );
            setScore(finalScore);
            const stars = finalScore >= 1600 ? 3 : finalScore >= 1200 ? 2 : 1;
            onSaveScore(finalScore, stars);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    showInstructions,
    isGameOver,
    difficulty,
    isDustCovered,
    isFuelCellActive,
    netPower,
    isLifeSupportOn,
    batteryStorageKwh,
    fuelCellReservePercent,
    timeLeft,
    onSaveScore
  ]);

  const starsEarned = score >= 1600 ? 3 : score >= 1200 ? 2 : score > 0 ? 1 : 0;

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
          scienceTakeaway="When solar power drops during lunar twilight, engineers prioritize life support above all else by shedding non-essential tools like rock drills and floodlights."
          statsSummary={[
            { label: 'Time Survived', value: `${60 - timeLeft}s / 60s` },
            { label: 'Battery Retained', value: `${batteryStorageKwh} kWh` },
            { label: 'Fuel Cell Remaining', value: `${fuelCellReservePercent}%` }
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
              <Zap className="w-4 h-4 text-amber-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Power Station Rescue</h1>
              <span className="text-xs font-mono text-amber-300 uppercase px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 font-semibold">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Survive 60 seconds of lunar dusk by aligning solar panels and managing loads.
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          {/* Mission Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Countdown</div>
              <div className="font-mono font-bold text-cyan-300">{timeLeft}s</div>
            </div>
          </div>

          {/* Battery Vault */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            {netPower >= 0 ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            ) : (
              <Battery className="w-4 h-4 text-rose-400 animate-pulse" />
            )}
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Battery Vault</div>
              <div className={`font-mono font-bold ${batteryStorageKwh < 10 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                {batteryStorageKwh} / {difficultyConfig.batteryCapacityKwh} kWh
              </div>
            </div>
          </div>

          {/* Quick Actions */}
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
            title="Restart simulation"
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

      {/* Real-time Grid Power Bar */}
      <div className="bg-[#050811] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Power Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400">Total Generation</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
              +{totalPowerGenerated} kW
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Solar: {solarGenerated} kW {isFuelCellActive && `· Fuel Cell: +3.5 kW`}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400">Habitat Consumption</div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-1">
              -{totalPowerConsumed} kW
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Active loads: {subsystems.filter(s => s.active).length} of 5
            </div>
          </div>

          <div className={`rounded-xl p-3 border ${
            netPower >= 0
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-rose-950/30 border-rose-500/40'
          }`}>
            <div className="text-[10px] font-mono uppercase text-slate-400">Net Power Flux</div>
            <div className={`text-xl font-mono font-bold mt-1 ${
              netPower >= 0 ? 'text-emerald-300' : 'text-rose-400 animate-pulse'
            }`}>
              {netPower >= 0 ? `+${netPower} kW (Charging)` : `${netPower} kW (Draining)`}
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {netPower >= 0 ? 'Batteries accumulating reserve' : 'Relying on battery backup!'}
            </div>
          </div>
        </div>

        {/* Life Support Warning Banner if off */}
        {lifeSupportFailureSeconds > 0 && (
          <div className="bg-rose-950/80 border border-rose-500 rounded-xl p-3 flex items-center justify-between text-xs text-rose-200 animate-pulse">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                <strong>CRITICAL LIFE SUPPORT ALARM!</strong> Oxygen loop unpowered for {lifeSupportFailureSeconds}s. Outpost emergency in {5 - lifeSupportFailureSeconds}s!
              </span>
            </div>
            <button
              onClick={() => toggleSubsystem('life_support')}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              Restore Life Support
            </button>
          </div>
        )}

        {/* Dust Alert Banner if active */}
        {isDustCovered && (
          <div className="bg-amber-950/70 border border-amber-500 rounded-xl p-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
              <span>
                <strong>Dust Storm Alert!</strong> Electrostatic regolith dust is covering Solar Array Alpha (-55% power).
              </span>
            </div>
            <button
              onClick={purgeDust}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs shadow-md"
            >
              Clean Dust Wipers
            </button>
          </div>
        )}

        {/* Solar Tracking Arc & Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Sun className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Solar Array Tracking Control</span>
            </div>
            <div className="font-mono text-xs text-cyan-300">
              Sun Angle: <span className="text-amber-400">{Math.round(sunAngle)}°</span> · Array: <span className="text-cyan-300">{arrayAngle}°</span> ({(alignmentEfficiency * 100).toFixed(0)}% Match)
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="180"
              value={arrayAngle}
              onChange={(e) => {
                sound.playBlip();
                setArrayAngle(Number(e.target.value));
              }}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>0° (East Horizon)</span>
              <span>90° (Solar Noon)</span>
              <span>180° (West Sunset)</span>
            </div>
          </div>
        </div>

        {/* Subsystem Switches & Fuel Cell */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Habitat Electrical Loads & Backup Generation
            </div>
            {/* Auxiliary Fuel Cell Toggle */}
            <button
              onClick={() => {
                sound.playClick();
                setIsFuelCellActive(!isFuelCellActive);
              }}
              disabled={fuelCellReservePercent <= 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isFuelCellActive
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Aux Fuel Cell (+3.5 kW) · {fuelCellReservePercent.toFixed(0)}% Fuel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {subsystems.map(sub => (
              <div
                key={sub.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  sub.active
                    ? sub.isVital
                      ? 'bg-cyan-950/30 border-cyan-500/50'
                      : 'bg-slate-900 border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{sub.name}</span>
                    {sub.isVital && (
                      <span className="text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded font-bold">
                        Vital
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Load: {sub.powerKw} kW
                  </div>
                </div>

                <button
                  onClick={() => toggleSubsystem(sub.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    sub.active
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {sub.active ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
