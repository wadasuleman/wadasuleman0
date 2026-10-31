import React, { useState } from 'react';
import { GameDifficulty, GameId, GameScoreRecord, GameCentreBadge, ArcadeCategory } from '../../types/gameCentre';
import { GAME_DEFINITIONS, INITIAL_GAME_BADGES } from '../../data/gameCentreData';
import galaxyArcadeBanner from '../../assets/images/galaxy_arcade_banner_1793466842735.jpg';
import { MoonRoverGame } from './MoonRoverGame';
import { PowerGridMasterGame } from './PowerGridMasterGame';
import { WaterRescueGame } from './WaterRescueGame';
import { SpaceFarmerGame } from './SpaceFarmerGame';
import { SolarStormSurvivalGame } from './SolarStormSurvivalGame';
import { BuildMoonBaseGame } from './BuildMoonBaseGame';
import { sound } from '../../utils/audio';
import {
  Gamepad2,
  Trophy,
  Star,
  Sparkles,
  Play,
  RotateCcw,
  Compass,
  Zap,
  Droplets,
  Sprout,
  Shield,
  HelpCircle,
  Layers,
  Award,
  X,
  Volume2,
  VolumeX,
  BookOpen,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface GameCentreHubProps {
  onBackToSim?: () => void;
}

export const GameCentreHub: React.FC<GameCentreHubProps> = ({ onBackToSim }) => {
  // Global difficulty selection
  const [difficulty, setDifficulty] = useState<GameDifficulty>('explorer');

  // Currently open game
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);

  // Category filter: 'All' or specific category
  const [selectedCategory, setSelectedCategory] = useState<'All' | ArcadeCategory>('All');

  // Show Badges Modal & Reset Dialog
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [lockedDifficultyNotice, setLockedDifficultyNotice] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Game Scores from localStorage
  const [scores, setScores] = useState<Record<GameId, GameScoreRecord>>(() => {
    const saved = localStorage.getItem('lunops_gamecentre_scores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {} as Record<GameId, GameScoreRecord>;
      }
    }
    return {} as Record<GameId, GameScoreRecord>;
  });

  // Badges state
  const [badges, setBadges] = useState<GameCentreBadge[]>(() => {
    const saved = localStorage.getItem('lunops_gamecentre_badges');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_GAME_BADGES;
      }
    }
    return INITIAL_GAME_BADGES;
  });

  // Calculate total stars
  const totalStarsEarned = Object.values(scores).reduce((sum, s) => sum + (s.stars || 0), 0);
  const totalStarsPossible = 18; // 6 games * 3 stars

  // Unlock requirements
  const isJuniorEngineerUnlocked = totalStarsEarned >= 3;
  const isMissionCommanderUnlocked = totalStarsEarned >= 8;

  // Stable badge check helper
  const checkBadgeUnlocks = React.useCallback((updatedScores: Record<GameId, GameScoreRecord>) => {
    setBadges((prevBadges) => {
      let anyUnlocked = false;
      const totalStars = Object.values(updatedScores).reduce((sum, s) => sum + (s.stars || 0), 0);

      const updated = prevBadges.map((b) => {
        if (b.unlocked) return b;

        // Game specific badges
        if (b.gameId && (updatedScores[b.gameId]?.stars || 0) >= 1) {
          anyUnlocked = true;
          return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }

        // Milestone badges
        if (b.id === 'badge_galaxy_cadet' && totalStars >= 6) {
          anyUnlocked = true;
          return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }

        if (b.id === 'badge_grand_galaxy_commander' && totalStars >= 18) {
          anyUnlocked = true;
          return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }

        return b;
      });

      if (anyUnlocked) {
        sound.badge();
        try {
          localStorage.setItem('lunops_gamecentre_badges', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      return updated;
    });
  }, []);

  // Save scores helper
  const handleSaveScore = React.useCallback(
    (gameId: GameId, score: number, stars: number) => {
      setScores((prev) => {
        const existing = prev[gameId];
        const newRecord: GameScoreRecord = {
          gameId,
          highScore: Math.max(existing?.highScore || 0, score),
          stars: Math.max(existing?.stars || 0, stars),
          bestDifficulty: difficulty,
          lastPlayedAt: new Date().toISOString(),
          completionsCount: (existing?.completionsCount || 0) + 1
        };

        const updated = { ...prev, [gameId]: newRecord };
        try {
          localStorage.setItem('lunops_gamecentre_scores', JSON.stringify(updated));
        } catch {
          // ignore
        }

        return updated;
      });

      setTimeout(() => {
        try {
          const saved = localStorage.getItem('lunops_gamecentre_scores');
          if (saved) {
            checkBadgeUnlocks(JSON.parse(saved));
          }
        } catch {
          // ignore
        }
      }, 0);
    },
    [difficulty, checkBadgeUnlocks]
  );

  // Stable callbacks for each game
  const saveMoonRoverScore = React.useCallback(
    (s: number, stars: number) => handleSaveScore('moon_rover', s, stars),
    [handleSaveScore]
  );
  const savePowerGridScore = React.useCallback(
    (s: number, stars: number) => handleSaveScore('power_grid', s, stars),
    [handleSaveScore]
  );
  const saveWaterRescueScore = React.useCallback(
    (s: number, stars: number) => handleSaveScore('water_rescue', s, stars),
    [handleSaveScore]
  );
  const saveSpaceFarmerScore = React.useCallback(
    (s: number, stars: number) => handleSaveScore('space_farmer', s, stars),
    [handleSaveScore]
  );
  const saveSolarStormScore = React.useCallback(
    (s: number, stars: number) => handleSaveScore('solar_storm', s, stars),
    [handleSaveScore]
  );
  const saveMoonBaseScore = React.useCallback(
    (s: number, stars: number) => handleSaveScore('moon_base', s, stars),
    [handleSaveScore]
  );

  // Reset progress
  const handleResetAllScores = () => {
    localStorage.removeItem('lunops_gamecentre_scores');
    localStorage.removeItem('lunops_gamecentre_badges');
    setScores({} as Record<GameId, GameScoreRecord>);
    setBadges(INITIAL_GAME_BADGES);
    setShowResetConfirm(false);
    sound.click();
  };

  const handleDifficultySelect = (d: GameDifficulty) => {
    if (d === 'junior_engineer' && !isJuniorEngineerUnlocked) {
      sound.warning();
      setLockedDifficultyNotice('Collect at least 3 Stars across Explorer missions to unlock Junior Engineer mode!');
      setTimeout(() => setLockedDifficultyNotice(null), 4000);
      return;
    }
    if (d === 'mission_commander' && !isMissionCommanderUnlocked) {
      sound.warning();
      setLockedDifficultyNotice('Collect at least 8 Stars across your missions to unlock Mission Commander mode!');
      setTimeout(() => setLockedDifficultyNotice(null), 4000);
      return;
    }

    sound.click();
    setDifficulty(d);
  };

  const renderGameIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-6 h-6 text-cyan-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'Droplets':
        return <Droplets className="w-6 h-6 text-blue-400" />;
      case 'Sprout':
        return <Sprout className="w-6 h-6 text-emerald-400" />;
      case 'Shield':
        return <Shield className="w-6 h-6 text-rose-400" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-indigo-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
    }
  };

  // Render active mini-game if one is selected
  if (activeGameId === 'moon_rover') {
    return (
      <MoonRoverGame
        difficulty={difficulty}
        highScore={scores.moon_rover?.highScore || 0}
        onSaveScore={saveMoonRoverScore}
        onBackToHub={() => setActiveGameId(null)}
        onSelectDifficulty={setDifficulty}
      />
    );
  }

  if (activeGameId === 'power_grid' || activeGameId === 'power_station') {
    return (
      <PowerGridMasterGame
        difficulty={difficulty}
        highScore={scores.power_grid?.highScore || scores.power_station?.highScore || 0}
        onSaveScore={savePowerGridScore}
        onBackToHub={() => setActiveGameId(null)}
        onSelectDifficulty={setDifficulty}
      />
    );
  }

  if (activeGameId === 'water_rescue' || activeGameId === 'save_every_drop') {
    return (
      <WaterRescueGame
        difficulty={difficulty}
        highScore={scores.water_rescue?.highScore || scores.save_every_drop?.highScore || 0}
        onSaveScore={saveWaterRescueScore}
        onBackToHub={() => setActiveGameId(null)}
        onSelectDifficulty={setDifficulty}
      />
    );
  }

  if (activeGameId === 'space_farmer' || activeGameId === 'space_farm') {
    return (
      <SpaceFarmerGame
        difficulty={difficulty}
        highScore={scores.space_farmer?.highScore || scores.space_farm?.highScore || 0}
        onSaveScore={saveSpaceFarmerScore}
        onBackToHub={() => setActiveGameId(null)}
        onSelectDifficulty={setDifficulty}
      />
    );
  }

  if (activeGameId === 'solar_storm' || activeGameId === 'solar_storm_defender') {
    return (
      <SolarStormSurvivalGame
        difficulty={difficulty}
        highScore={scores.solar_storm?.highScore || scores.solar_storm_defender?.highScore || 0}
        onSaveScore={saveSolarStormScore}
        onBackToHub={() => setActiveGameId(null)}
        onSelectDifficulty={setDifficulty}
      />
    );
  }

  if (activeGameId === 'moon_base' || activeGameId === 'build_lunar_base') {
    return (
      <BuildMoonBaseGame
        difficulty={difficulty}
        highScore={scores.moon_base?.highScore || scores.build_lunar_base?.highScore || 0}
        onSaveScore={saveMoonBaseScore}
        onBackToHub={() => setActiveGameId(null)}
        onSelectDifficulty={setDifficulty}
      />
    );
  }

  // Filter games based on selected category
  const filteredGames =
    selectedCategory === 'All'
      ? GAME_DEFINITIONS
      : GAME_DEFINITIONS.filter((g) => g.category === selectedCategory);

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Badges Drawer Modal */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B132B] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Galaxy Arcade Trophy & Badges Shelf</h2>
                  <p className="text-xs text-slate-400">
                    Earn stars in missions to unlock official lunar flight badges!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBadgesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    b.unlocked
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      b.unlocked
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-600'
                    }`}
                  >
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">{b.title}</h4>
                      {b.unlocked ? (
                        <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono uppercase text-slate-500 shrink-0 ml-1">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{b.description}</p>
                    {b.unlockedAt && (
                      <div className="text-[10px] font-mono text-amber-300/80 mt-1">
                        Awarded: {b.unlockedAt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowBadgesModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs"
              >
                Close Shelf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0B132B] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset Galaxy Arcade Progress?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will reset all high scores, stars, and badges across all 6 Galaxy Arcade games.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllScores}
                className="px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER SECTION */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-2xl shadow-cyan-950/50">
        {/* Banner Image Background */}
        <div className="relative min-h-[260px] sm:min-h-[290px] flex items-end p-6 sm:p-10">
          <img
            src={galaxyArcadeBanner}
            alt="LUNOPS Galaxy Arcade Banner"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-45 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D1F] via-[#0B132B]/80 to-transparent" />

          {/* Foreground Hero Content */}
          <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 backdrop-blur-sm">
                <Gamepad2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                  NASA Space Apps Challenge 2026 • Junior Astronaut Training
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase drop-shadow-md">
                LUNOPS GALAXY ARCADE
              </h1>
              <p className="text-sm sm:text-base font-semibold text-cyan-300 tracking-wide">
                Play. Explore. Learn. Become a Mission Commander.
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-xl">
                Master 6 interactive lunar science and engineering challenges designed for ages 7–12.
                Earn mission stars, unlock official astronaut badges, and keep your lunar outpost thriving!
              </p>
            </div>

            {/* Stars & Badges Widget */}
            <div className="flex items-center gap-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 shrink-0 shadow-xl backdrop-blur-md">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Star className="w-7 h-7 fill-current animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                  Galaxy Stars Earned
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {totalStarsEarned}{' '}
                  <span className="text-sm text-slate-500 font-normal">/ {totalStarsPossible} ★</span>
                </div>
                <button
                  onClick={() => {
                    sound.click();
                    setShowBadgesModal(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline font-mono mt-0.5 block flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  View Trophy Shelf ({badges.filter((b) => b.unlocked).length} / {badges.length}) →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Controls & Difficulty Toolbar */}
        <div className="bg-[#090F24] p-4 sm:px-8 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Difficulty Tier Tabs */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold mr-1">
                Difficulty:
              </span>

              {/* Explorer */}
              <button
                type="button"
                onClick={() => handleDifficultySelect('explorer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  difficulty === 'explorer'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25 ring-2 ring-cyan-300'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                Explorer (Ages 7–8)
              </button>

              {/* Junior Engineer */}
              <button
                type="button"
                onClick={() => handleDifficultySelect('junior_engineer')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  difficulty === 'junior_engineer'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-300'
                    : isJuniorEngineerUnlocked
                    ? 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                    : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-60'
                }`}
              >
                {isJuniorEngineerUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                Junior Engineer (Ages 9–10)
                {!isJuniorEngineerUnlocked && <span className="text-[10px] text-amber-500 font-mono">(3★)</span>}
              </button>

              {/* Mission Commander */}
              <button
                type="button"
                onClick={() => handleDifficultySelect('mission_commander')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  difficulty === 'mission_commander'
                    ? 'bg-rose-400 text-slate-950 shadow-md shadow-rose-500/25 ring-2 ring-rose-300'
                    : isMissionCommanderUnlocked
                    ? 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                    : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-60'
                }`}
              >
                {isMissionCommanderUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                Mission Commander (Ages 11–12)
                {!isMissionCommanderUnlocked && <span className="text-[10px] text-rose-500 font-mono">(8★)</span>}
              </button>
            </div>

            {lockedDifficultyNotice && (
              <div className="text-xs text-amber-400 font-semibold animate-pulse">
                ⚠️ {lockedDifficultyNotice}
              </div>
            )}
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(sound.toggleMute())}
              aria-label={isMuted ? 'Unmute arcade sound effects' : 'Mute arcade sound effects'}
              className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset high scores"
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              Reset Records
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['All', 'Exploration', 'Engineering', 'Science and Survival'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.click();
                setSelectedCategory(cat);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-900'
              }`}
            >
              {cat === 'All' ? '🎮 All 6 Games' : cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredGames.length} of {GAME_DEFINITIONS.length} arcade missions
        </span>
      </div>

      {/* 6 GAMES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => {
          const scoreRecord = scores[game.id];
          const starsEarned = scoreRecord?.stars || 0;
          const highScoreVal = scoreRecord?.highScore || 0;

          return (
            <div
              key={game.id}
              className="bg-[#0B132B]/95 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 flex flex-col justify-between gap-5 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/40 group relative overflow-hidden"
            >
              {/* Subtle accent highlight on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500 opacity-30 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                {/* Header: Icon, Category & 3-Star Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                      {renderGameIcon(game.icon)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                        {game.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {game.estimatedMinutes} session
                      </span>
                    </div>
                  </div>

                  {/* 3 Stars Preview */}
                  <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          starIdx <= starsEarned ? 'text-amber-400 fill-current' : 'text-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors uppercase tracking-wide">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{game.tagline}</p>
                </div>

                {/* Science Focus Pill */}
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Science:</strong> {game.scienceFocus}
                  </span>
                </div>
              </div>

              {/* Bottom Card Action: High Score & Play Mission */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-slate-400">
                  Record: <strong className="text-white">{highScoreVal} pts</strong>
                </div>

                <button
                  onClick={() => {
                    sound.click();
                    setActiveGameId(game.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/25 group-hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Mission</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
