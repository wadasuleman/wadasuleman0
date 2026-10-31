import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  Sprout,
  Sun,
  Droplets,
  RotateCcw,
  HelpCircle,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface SpaceFarmGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface CropBay {
  id: string;
  name: string;
  idealRedPercent: number; // 0 to 100
  idealBluePercent: number; // 0 to 100
  idealCo2Ppm: number;
  currentMaturityPercent: number; // 0 to 100
  moisturePercent: number; // 0 to 100
  harvested: boolean;
  yieldKg: number;
}

const FARM_DIFFICULTY_CONFIG: Record<GameDifficulty, { timeLimitSeconds: number; moistureDrainRate: number; growthSpeed: number }> = {
  explorer: { timeLimitSeconds: 75, moistureDrainRate: 0.8, growthSpeed: 1.4 },
  junior_engineer: { timeLimitSeconds: 65, moistureDrainRate: 1.3, growthSpeed: 1.1 },
  mission_commander: { timeLimitSeconds: 55, moistureDrainRate: 1.8, growthSpeed: 0.9 }
};

export const SpaceFarmGame: React.FC<SpaceFarmGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'space_farm')!;
  const difficultyConfig = FARM_DIFFICULTY_CONFIG[difficulty];

  // State
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);
  const [redLightRatio, setRedLightRatio] = useState<number>(70); // % Red (Blue is 100 - Red)
  const [co2LevelPpm, setCo2LevelPpm] = useState<number>(800);
  const [timeLeft, setTimeLeft] = useState<number>(difficultyConfig.timeLimitSeconds);
  const [totalYieldKg, setTotalYieldKg] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [farmerLog, setFarmerLog] = useState<string>('Greenhouse active. Match LED spectrum to each plant bay!');
  const hasSavedRef = useRef<boolean>(false);

  // Crops
  const [crops, setCrops] = useState<CropBay[]>([
    {
      id: 'radishes',
      name: 'Lunar Radishes',
      idealRedPercent: 70,
      idealBluePercent: 30,
      idealCo2Ppm: 800,
      currentMaturityPercent: 10,
      moisturePercent: 80,
      harvested: false,
      yieldKg: 1.8
    },
    {
      id: 'wheat',
      name: 'Dwarf Super-Wheat',
      idealRedPercent: 85,
      idealBluePercent: 15,
      idealCo2Ppm: 1000,
      currentMaturityPercent: 5,
      moisturePercent: 75,
      harvested: false,
      yieldKg: 3.2
    },
    {
      id: 'lettuce',
      name: 'Crisp Space Lettuce',
      idealRedPercent: 50,
      idealBluePercent: 50,
      idealCo2Ppm: 700,
      currentMaturityPercent: 15,
      moisturePercent: 85,
      harvested: false,
      yieldKg: 2.1
    }
  ]);

  const resetGame = useCallback(() => {
    hasSavedRef.current = false;
    setTimeLeft(difficultyConfig.timeLimitSeconds);
    setSelectedCropIndex(0);
    setRedLightRatio(70);
    setCo2LevelPpm(800);
    setTotalYieldKg(0);
    setIsGameOver(false);
    setScore(0);
    setFarmerLog('Greenhouse active. Match LED spectrum to each plant bay!');
    setCrops([
      { id: 'radishes', name: 'Lunar Radishes', idealRedPercent: 70, idealBluePercent: 30, idealCo2Ppm: 800, currentMaturityPercent: 10, moisturePercent: 80, harvested: false, yieldKg: 1.8 },
      { id: 'wheat', name: 'Dwarf Super-Wheat', idealRedPercent: 85, idealBluePercent: 15, idealCo2Ppm: 1000, currentMaturityPercent: 5, moisturePercent: 75, harvested: false, yieldKg: 3.2 },
      { id: 'lettuce', name: 'Crisp Space Lettuce', idealRedPercent: 50, idealBluePercent: 50, idealCo2Ppm: 700, currentMaturityPercent: 15, moisturePercent: 85, harvested: false, yieldKg: 2.1 }
    ]);
  }, [difficulty]);

  // Mist crop roots
  const mistActiveCrop = () => {
    sound.playPowerUp();
    setCrops(prev =>
      prev.map((c, i) => (i === selectedCropIndex ? { ...c, moisturePercent: 100 } : c))
    );
    setFarmerLog(`Aeroponic misting nozzle activated for ${crops[selectedCropIndex].name}!`);
  };

  // Harvest crop
  const harvestActiveCrop = (idx: number) => {
    const crop = crops[idx];
    if (crop.currentMaturityPercent < 90 || crop.harvested) return;

    sound.playScore();
    setCrops(prev =>
      prev.map((c, i) => (i === idx ? { ...c, harvested: true } : c))
    );
    setTotalYieldKg(y => Number((y + crop.yieldKg).toFixed(1)));
    setFarmerLog(`Fresh harvest! Secured ${crop.yieldKg} kg of ${crop.name} for the crew!`);
  };

  // Real-time growth tick
  useEffect(() => {
    if (showInstructions || isGameOver) return;

    const interval = setInterval(() => {
      // 1. Tick Time
      setTimeLeft(t => {
        if (t <= 1) {
          setIsGameOver(true);
          return 0;
        }
        return t - 1;
      });

      // 2. Growth calculations for all crops
      setCrops(prevCrops => {
        const nextCrops = prevCrops.map((c, idx) => {
          if (c.harvested) return c;

          // Spectrum match for active crop (others grow at slow background rate)
          const isSelected = idx === selectedCropIndex;
          const currentRed = isSelected ? redLightRatio : 60;
          const currentBlue = 100 - currentRed;

          const redDiff = Math.abs(currentRed - c.idealRedPercent);
          const blueDiff = Math.abs(currentBlue - c.idealBluePercent);
          const spectrumAccuracy = Math.max(0.2, 1 - (redDiff + blueDiff) / 100);

          // Moisture health
          const moistureHealth = c.moisturePercent > 20 ? 1.0 : 0.2;

          // CO2 bonus
          const co2Diff = Math.abs(co2LevelPpm - c.idealCo2Ppm);
          const co2Factor = Math.max(0.6, 1 - co2Diff / 1000);

          const growthIncrement =
            spectrumAccuracy * moistureHealth * co2Factor * difficultyConfig.growthSpeed * 2.2;

          const nextMaturity = Math.min(100, c.currentMaturityPercent + growthIncrement);
          const nextMoisture = Math.max(0, c.moisturePercent - difficultyConfig.moistureDrainRate);

          return {
            ...c,
            currentMaturityPercent: Number(nextMaturity.toFixed(1)),
            moisturePercent: Number(nextMoisture.toFixed(1))
          };
        });

        // Check if all harvested
        const allHarvested = nextCrops.every(c => c.harvested);
        if (allHarvested) {
          setIsGameOver(true);
        }

        return nextCrops;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showInstructions, isGameOver, selectedCropIndex, redLightRatio, co2LevelPpm, difficulty]);

  // Handle Game Completion (fires once when isGameOver becomes true)
  useEffect(() => {
    if (isGameOver && !hasSavedRef.current) {
      hasSavedRef.current = true;
      const harvestedCount = crops.filter(c => c.harvested).length;
      const finalScore = Math.round(
        harvestedCount * 500 + totalYieldKg * 100 + timeLeft * 10
      );
      setScore(finalScore);
      const stars = harvestedCount === 3 ? 3 : harvestedCount === 2 ? 2 : harvestedCount === 1 ? 1 : 0;
      sound.playSuccess();
      onSaveScore(finalScore, stars);
    }
  }, [isGameOver, crops, totalYieldKg, timeLeft, onSaveScore]);

  const activeCrop = crops[selectedCropIndex];
  const harvestedCount = crops.filter(c => c.harvested).length;
  const starsEarned = harvestedCount === 3 ? 3 : harvestedCount === 2 ? 2 : harvestedCount >= 1 ? 1 : 0;

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
          scienceTakeaway="Plants don't require soil on the Moon. Combining tailored LED light spectrums (red for photosynthesis, blue for robust stems) with aeroponic nutrient misting delivers fast, nutritious harvests."
          statsSummary={[
            { label: 'Crops Harvested', value: `${harvestedCount} / 3` },
            { label: 'Total Fresh Yield', value: `${totalYieldKg} kg` },
            { label: 'Time Remaining', value: `${timeLeft}s` }
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
              <Sprout className="w-4 h-4 text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Space Farm Challenge</h1>
              <span className="text-xs font-mono text-emerald-300 uppercase px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 font-semibold">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Nurture and harvest 3 lunar crops using custom LED recipes & misting.
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Harvest Clock</div>
              <div className="font-mono font-bold text-cyan-300">{timeLeft}s</div>
            </div>
          </div>

          {/* Harvest Yield */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Harvested</div>
              <div className="font-mono font-bold text-emerald-300">
                {harvestedCount} / 3 Crops ({totalYieldKg} kg)
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
            title="Restart greenhouse run"
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

      {/* Farmer Log Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
          <span><strong>Greenhouse Agronomist:</strong> {farmerLog}</span>
        </div>
        <div className="text-[11px] font-mono text-cyan-300">
          Selected Bay: <strong className="text-white">{activeCrop.name}</strong>
        </div>
      </div>

      {/* 3 Crop Bays Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {crops.map((c, idx) => {
          const isSelected = idx === selectedCropIndex;
          const isReady = c.currentMaturityPercent >= 90 && !c.harvested;

          return (
            <div
              key={c.id}
              onClick={() => {
                sound.playClick();
                setSelectedCropIndex(idx);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#0B172E] border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-[#070B14] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {c.harvested ? '🧺' : c.currentMaturityPercent >= 90 ? '🥗' : c.currentMaturityPercent >= 50 ? '🌿' : '🌱'}
                  </span>
                  <div>
                    <h2 className="text-xs font-bold text-white">{c.name}</h2>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {c.idealRedPercent}% Red / {c.idealBluePercent}% Blue
                    </span>
                  </div>
                </div>
                {c.harvested && (
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Harvested
                  </span>
                )}
              </div>

              {/* Maturity Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Maturity:</span>
                  <span className={`font-bold ${isReady ? 'text-emerald-400 animate-pulse' : 'text-slate-200'}`}>
                    {c.currentMaturityPercent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      c.harvested ? 'bg-slate-600' : isReady ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${c.currentMaturityPercent}%` }}
                  />
                </div>
              </div>

              {/* Moisture Bar */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Root Moisture:</span>
                  <span className={c.moisturePercent < 25 ? 'text-rose-400 font-bold' : 'text-blue-300'}>
                    {c.moisturePercent}%
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      c.moisturePercent < 25 ? 'bg-rose-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${c.moisturePercent}%` }}
                  />
                </div>
              </div>

              {/* Harvest Action */}
              {isReady && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    harvestActiveCrop(idx);
                  }}
                  className="w-full mt-3 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 animate-bounce"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Harvest Crop (+{c.yieldKg} kg)</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Console for Active Crop */}
      <div className="bg-[#050811] border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Bay Control Console · {activeCrop.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ideal Spectrum: {activeCrop.idealRedPercent}% Red / {activeCrop.idealBluePercent}% Blue · Target CO2: {activeCrop.idealCo2Ppm} ppm
            </p>
          </div>

          <button
            onClick={mistActiveCrop}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 whitespace-nowrap self-start sm:self-auto"
          >
            <Droplets className="w-4 h-4" />
            <span>Aeroponic Nutrient Mist (100%)</span>
          </button>
        </div>

        {/* LED Spectrum Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">LED Photobiological Spectrum Mixer</span>
            <span className="font-mono text-xs">
              <span className="text-rose-400 font-bold">{redLightRatio}% Red</span> · <span className="text-blue-400 font-bold">{100 - redLightRatio}% Blue</span>
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="90"
            value={redLightRatio}
            onChange={(e) => {
              sound.playBlip();
              setRedLightRatio(Number(e.target.value));
            }}
            className="w-full accent-rose-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="text-blue-400">Higher Blue (Stems & Leaves)</span>
            <span className="text-rose-400">Higher Red (Photosynthesis & Fruiting)</span>
          </div>
        </div>

        {/* CO2 Controller */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Greenhouse CO2 Enrichment</span>
            <span className="font-mono text-xs text-cyan-300 font-bold">{co2LevelPpm} ppm</span>
          </div>

          <input
            type="range"
            min="400"
            max="1200"
            step="50"
            value={co2LevelPpm}
            onChange={(e) => {
              sound.playBlip();
              setCo2LevelPpm(Number(e.target.value));
            }}
            className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>400 ppm (Ambient Earth Baseline)</span>
            <span>800–1000 ppm (Optimal Plant Growth Speed)</span>
            <span>1200 ppm (High Enrichment)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
