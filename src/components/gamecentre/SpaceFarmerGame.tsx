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
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Clock,
  Flame,
  Bug,
  Leaf
} from 'lucide-react';

interface SpaceFarmerGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface CropBay {
  id: string;
  name: string;
  variety: string;
  icon: string;
  optimalRedPercent: number; // e.g. 75%
  optimalMistSec: number; // e.g. 15s
  optimalPhotoperiod: number; // 16h
  growthStage: number; // 0 to 100%
  health: number; // 0 to 100%
  status: 'healthy' | 'wilting' | 'waterlogged' | 'tipburn' | 'ready_for_harvest' | 'harvested';
  harvested: boolean;
  yieldGrams: number;
}

interface FarmerConfig {
  name: string;
  targetBays: number;
  timeLimitSec: number;
  decayRate: number;
}

const DIFFICULTY_CONFIG: Record<GameDifficulty, FarmerConfig> = {
  explorer: {
    name: 'Veggie Chamber Cadet',
    targetBays: 2,
    timeLimitSec: 80,
    decayRate: 0.8
  },
  junior_engineer: {
    name: 'Hydroponics Specialist',
    targetBays: 3,
    timeLimitSec: 70,
    decayRate: 1.2
  },
  mission_commander: {
    name: 'Lunar Bioregenerative Commander',
    targetBays: 3,
    timeLimitSec: 60,
    decayRate: 1.6
  }
};

const INITIAL_CROPS: CropBay[] = [
  {
    id: 'crop_lettuce',
    name: 'Red Romaine Lettuce',
    variety: 'Outredgeous (NASA Veggie Flown)',
    icon: '🥬',
    optimalRedPercent: 80,
    optimalMistSec: 15,
    optimalPhotoperiod: 16,
    growthStage: 15,
    health: 95,
    status: 'healthy',
    harvested: false,
    yieldGrams: 0
  },
  {
    id: 'crop_wheat',
    name: 'Dwarf Super-Wheat',
    variety: 'Apogee Space Wheat',
    icon: '🌾',
    optimalRedPercent: 70,
    optimalMistSec: 12,
    optimalPhotoperiod: 20,
    growthStage: 10,
    health: 90,
    status: 'healthy',
    harvested: false,
    yieldGrams: 0
  },
  {
    id: 'crop_radish',
    name: 'Lunar Root Radish',
    variety: 'Early Scarlet Globe (APH)',
    icon: '🥕',
    optimalRedPercent: 75,
    optimalMistSec: 18,
    optimalPhotoperiod: 14,
    growthStage: 20,
    health: 92,
    status: 'healthy',
    harvested: false,
    yieldGrams: 0
  }
];

export const SpaceFarmerGame: React.FC<SpaceFarmerGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find((g) => g.id === 'space_farmer') || GAME_DEFINITIONS[3];
  const config = DIFFICULTY_CONFIG[difficulty];

  // Selected crop bay for tweaking
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);

  // Growth bay state
  const [crops, setCrops] = useState<CropBay[]>([]);
  const [redSpectrum, setRedSpectrum] = useState<number>(75); // 0 to 100% (blue is 100 - red)
  const [mistIntervalSec, setMistIntervalSec] = useState<number>(15);
  const [photoperiodHours, setPhotoperiodHours] = useState<number>(16);

  // Game tracking
  const [timeLeft, setTimeLeft] = useState<number>(config.timeLimitSec);
  const [score, setScore] = useState<number>(0);
  const [harvestCount, setHarvestCount] = useState<number>(0);
  const [totalYieldGrams, setTotalYieldGrams] = useState<number>(0);

  // Modals & debrief
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(0);
  const [debriefNotes, setDebriefNotes] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const hasSavedRef = useRef<boolean>(false);

  // Restart function
  const handleRestart = useCallback(() => {
    hasSavedRef.current = false;
    const initialBays = INITIAL_CROPS.slice(0, config.targetBays).map((c) => ({
      ...c,
      growthStage: Math.floor(Math.random() * 15) + 10,
      health: 95,
      harvested: false,
      yieldGrams: 0,
      status: 'healthy' as const
    }));

    setCrops(initialBays);
    setSelectedCropIndex(0);
    setRedSpectrum(75);
    setMistIntervalSec(15);
    setPhotoperiodHours(16);
    setTimeLeft(config.timeLimitSec);
    setScore(0);
    setHarvestCount(0);
    setTotalYieldGrams(0);
    setIsGameOver(false);
    setVictory(false);
    setStars(0);
    setDebriefNotes([]);
  }, [config.targetBays, config.timeLimitSec]);

  // Initial load
  useEffect(() => {
    handleRestart();
  }, [difficulty, handleRestart]);

  // Main simulation tick
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      // Advance time
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          evaluateEndGame();
          return 0;
        }
        return prev - 1;
      });

      // Advance plant growth & health based on active spectrum, misting, and photoperiod
      setCrops((prevCrops) => {
        return prevCrops.map((crop, idx) => {
          if (crop.harvested) return crop;

          // Check environmental harmony with crop requirements
          const redDiff = Math.abs(redSpectrum - crop.optimalRedPercent);
          const mistDiff = Math.abs(mistIntervalSec - crop.optimalMistSec);
          const photoDiff = Math.abs(photoperiodHours - crop.optimalPhotoperiod);

          let healthDelta = 0;
          let growthRate = 0;

          if (redDiff <= 10 && mistDiff <= 3 && photoDiff <= 2) {
            // Excellent sweet spot!
            healthDelta = +1.5;
            growthRate = 4.0;
          } else if (redDiff <= 20 && mistDiff <= 6) {
            // Fair conditions
            healthDelta = -0.2 * config.decayRate;
            growthRate = 2.0;
          } else {
            // Unhealthy spectrum or moisture
            healthDelta = -1.8 * config.decayRate;
            growthRate = 0.5;
          }

          const newHealth = Math.max(0, Math.min(100, crop.health + healthDelta));
          let newGrowth = Math.min(100, crop.growthStage + growthRate);

          let newStatus: CropBay['status'] = 'healthy';
          if (newGrowth >= 100) {
            newStatus = 'ready_for_harvest';
          } else if (mistIntervalSec < 8) {
            newStatus = 'waterlogged';
          } else if (mistIntervalSec > 22) {
            newStatus = 'wilting';
          } else if (redSpectrum > 90) {
            newStatus = 'tipburn';
          } else if (newHealth < 50) {
            newStatus = 'wilting';
          }

          return {
            ...crop,
            health: Math.round(newHealth),
            growthStage: Math.min(100, Math.round(newGrowth)),
            status: newStatus
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, redSpectrum, mistIntervalSec, photoperiodHours, config.decayRate]);

  // Harvest action
  const handleHarvest = (cropIndex: number) => {
    const crop = crops[cropIndex];
    if (!crop || crop.harvested || crop.growthStage < 95) return;

    if (soundEnabled) sound.success();

    const cropYield = Math.round((crop.health / 100) * 180 + 50);
    const harvestBonus = Math.round(cropYield * 5 + crop.health * 10);

    setCrops((prev) =>
      prev.map((c, i) => (i === cropIndex ? { ...c, harvested: true, yieldGrams: cropYield, status: 'harvested' } : c))
    );

    setScore((prev) => prev + harvestBonus);
    setHarvestCount((prev) => prev + 1);
    setTotalYieldGrams((prev) => prev + cropYield);

    // Check if all crops have been harvested
    const remainingUnclimbed = crops.filter((c, i) => i !== cropIndex && !c.harvested);
    if (remainingUnclimbed.length === 0) {
      setTimeout(() => {
        triggerVictory();
      }, 500);
    }
  };

  const triggerVictory = () => {
    setIsGameOver(true);
    setVictory(true);

    let earnedStars = 0;
    if (timeLeft > config.timeLimitSec * 0.4) earnedStars = 3;
    else if (timeLeft > config.timeLimitSec * 0.15) earnedStars = 2;
    else earnedStars = 1;

    setStars(earnedStars);

    const notes = [
      `Successfully harvested all ${config.targetBays} hydroponic test crops!`,
      `Total fresh biomass generated: ${totalYieldGrams + 200}g of vitamin-rich space food.`,
      'NASA Veggie & APH Science: Red light drives photosynthesis chlorophyll A & B, while blue regulates stomata opening and circadian rhythm.'
    ];
    setDebriefNotes(notes);

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      onSaveScore(score + 1500, earnedStars);
    }
  };

  const evaluateEndGame = () => {
    setIsGameOver(true);
    const successfulHarvests = crops.filter((c) => c.harvested).length;
    const isWin = successfulHarvests >= config.targetBays;

    setVictory(isWin);

    let earnedStars = 0;
    if (isWin) {
      earnedStars = 2;
      setDebriefNotes([
        `Target yield achieved before mission deadline!`,
        `Delivered fresh greens to boost junior crew nutrition and morale.`
      ]);
    } else {
      if (soundEnabled) sound.error();
      earnedStars = 0;
      setDebriefNotes([
        `Time expired! Only harvested ${successfulHarvests}/${config.targetBays} crops.`,
        'Ensure the Red/Blue spectrum matches each plant family requirements to accelerate chlorophyll synthesis.'
      ]);
    }

    setStars(earnedStars);

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      onSaveScore(score, earnedStars);
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-5 p-4 sm:p-6 bg-slate-950/90 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Sprout className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-wider text-emerald-300 uppercase">
                {gameDef.title}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">{config.name} • NASA Advanced Plant Habitat</p>
          </div>
        </div>

        {/* Global Controls & Metrics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Harvested:</span>
            <span className="font-bold text-emerald-400">{harvestCount}/{config.targetBays}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Time:</span>
            <span className={`font-mono font-bold ${timeLeft <= 15 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Yield:</span>
            <span className="font-mono font-bold text-cyan-400">{totalYieldGrams}g</span>
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
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
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

      {/* Main Grid: Crop Bays (Left 7 cols) & Environmental Controls (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Hydroponic Growth Bays */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Lunar Greenhouse Chambers
              </h3>
            </div>
            <span className="text-xs text-slate-400">Select chamber to calibrate microclimate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {crops.map((crop, idx) => {
              const isSelected = selectedCropIndex === idx;
              const isReady = crop.growthStage >= 95 && !crop.harvested;

              return (
                <div
                  key={crop.id}
                  onClick={() => setSelectedCropIndex(idx)}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{crop.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{crop.name}</h4>
                        <p className="text-[11px] text-slate-400">{crop.variety}</p>
                      </div>
                    </div>
                    {crop.harvested ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        HARVESTED
                      </span>
                    ) : isReady ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">
                        READY!
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                          crop.status === 'healthy'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800'
                        }`}
                      >
                        {crop.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Growth & Health Progress Bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Maturity:</span>
                        <span className="font-mono font-bold text-emerald-400">{crop.growthStage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-300"
                          style={{ width: `${crop.growthStage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Health Index:</span>
                        <span
                          className={`font-mono font-bold ${
                            crop.health > 70 ? 'text-cyan-400' : crop.health > 40 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {crop.health}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            crop.health > 70 ? 'bg-cyan-500' : crop.health > 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${crop.health}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Preferences Hint */}
                  <div className="p-2 rounded-lg bg-slate-950/60 text-[10px] text-slate-400 flex justify-between font-mono">
                    <span>Target Red: {crop.optimalRedPercent}%</span>
                    <span>Mist: {crop.optimalMistSec}s</span>
                    <span>Cycle: {crop.optimalPhotoperiod}h</span>
                  </div>

                  {/* Harvest Action Button */}
                  {isReady && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHarvest(idx);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-xs shadow-md animate-pulse active:scale-95 transition-all"
                    >
                      🌾 Harvest Fresh Crop!
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Microclimate Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Light Spectrum & Climate Mixer
              </h3>
            </div>

            {/* Red / Blue Spectrum Mixer */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-rose-400">RED LIGHT (Photosynthesis): {redSpectrum}%</span>
                <span className="font-semibold text-blue-400">BLUE LIGHT (Stomata): {100 - redSpectrum}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="5"
                value={redSpectrum}
                disabled={isGameOver}
                onChange={(e) => setRedSpectrum(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              {/* Spectrum Visualizer bar */}
              <div
                className="h-4 rounded-md border border-slate-800 flex overflow-hidden shadow-inner"
                style={{
                  background: `linear-gradient(to right, rgb(244 63 94) ${redSpectrum}%, rgb(59 130 246) ${redSpectrum}%)`
                }}
              />
              <p className="text-[11px] text-slate-400">
                Red wavelengths maximize carbon fixation; blue wavelengths maintain sturdy cellular stems and prevent leggy growth.
              </p>
            </div>

            {/* Nutrient Aeroponic Misting Interval */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" /> Aeroponic Mist Interval:
                </span>
                <span className="font-mono font-bold text-amber-400">{mistIntervalSec} sec</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={mistIntervalSec}
                disabled={isGameOver}
                onChange={(e) => setMistIntervalSec(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>5s (Too wet)</span>
                <span className="text-emerald-400">Optimal 12-18s</span>
                <span>30s (Root wilt)</span>
              </div>
            </div>

            {/* Photoperiod selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Photoperiod Cycle:
                </span>
                <span className="font-mono font-bold text-slate-300">{photoperiodHours} Hours/Sol</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[14, 16, 20].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    disabled={isGameOver}
                    onClick={() => setPhotoperiodHours(hours)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                      photoperiodHours === hours
                        ? 'bg-amber-950 text-amber-300 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {hours} Hours
                  </button>
                ))}
              </div>
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
            { label: 'Harvested Crops', value: `${harvestCount}/${config.targetBays}` },
            { label: 'Total Fresh Yield', value: `${totalYieldGrams}g` },
            { label: 'LED Red Ratio', value: `${redSpectrum}%` },
            { label: 'Time Remaining', value: `${timeLeft}s` }
          ]}
          onReplay={handleRestart}
          onSelectDifficulty={onSelectDifficulty}
          onBackToHub={onBackToHub}
        />
      )}
    </div>
  );
};
