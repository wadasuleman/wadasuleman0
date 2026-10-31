import React from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { Star, Trophy, RotateCcw, ArrowRight, BookOpen, Compass, Award } from 'lucide-react';
import { sound } from '../../utils/audio';

interface GameResultDebriefProps {
  gameTitle: string;
  difficulty: GameDifficulty;
  score: number;
  highScore: number;
  starsEarned: number; // 0 to 3
  isNewHighScore: boolean;
  scienceTakeaway: string;
  statsSummary: Array<{ label: string; value: string | number }>;
  onReplay: () => void;
  onSelectDifficulty?: (newDifficulty: GameDifficulty) => void;
  onBackToHub: () => void;
}

export const GameResultDebrief: React.FC<GameResultDebriefProps> = ({
  gameTitle,
  difficulty,
  score,
  highScore,
  starsEarned,
  isNewHighScore,
  scienceTakeaway,
  statsSummary,
  onReplay,
  onSelectDifficulty,
  onBackToHub
}) => {
  const getRatingTitle = (stars: number) => {
    switch (stars) {
      case 3: return 'OUTSTANDING FLIGHT COMMANDER!';
      case 2: return 'EXCELLENT JUNIOR SPECIALIST!';
      case 1: return 'SUCCESSFUL MISSION CADET!';
      default: return 'MISSION COMPLETED - KEEP TRAINING!';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B132B] border border-cyan-500/50 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl shadow-cyan-950/60 text-center animate-in zoom-in-95 duration-200">
        {/* Rating Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 uppercase tracking-wider font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Mission Debrief · {gameTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            {getRatingTitle(starsEarned)}
          </h2>
          <div className="text-xs text-slate-400 font-mono">
            Difficulty Tier: <span className="text-amber-300 font-bold uppercase">{difficulty.replace('_', ' ')}</span>
          </div>
        </div>

        {/* 3 Stars Display */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= starsEarned;
            return (
              <div
                key={starIdx}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                  isEarned
                    ? 'bg-amber-500/20 border-amber-400 text-amber-400 scale-105 shadow-lg shadow-amber-500/30 animate-bounce'
                    : 'bg-slate-900 border-slate-800 text-slate-700'
                }`}
                style={{ animationDelay: `${starIdx * 150}ms` }}
              >
                <Star className={`w-8 h-8 ${isEarned ? 'fill-current' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Score & High Score */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Mission Score</div>
            <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">{score}</div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
              <span>Personal Best</span>
              {isNewHighScore && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-bold">
                  NEW!
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{highScore}</div>
          </div>
        </div>

        {/* Telemetry Stats Strip */}
        {statsSummary.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
            {statsSummary.map((st, i) => (
              <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-xs">
                <span className="text-slate-400 text-[11px] block">{st.label}</span>
                <span className="text-white font-mono font-bold mt-0.5 block">{st.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Science Takeaway */}
        <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3.5 text-left text-xs text-cyan-200/90 leading-relaxed">
          <strong className="text-cyan-300 flex items-center gap-1.5 mb-1 font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            Space Science Debrief:
          </strong>
          {scienceTakeaway}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onBackToHub();
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors whitespace-nowrap"
          >
            ← Arcade Hub
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                sound.playClick();
                onReplay();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>

            {onSelectDifficulty && difficulty !== 'mission_commander' && (
              <button
                onClick={() => {
                  sound.playSuccess();
                  const nextDiff: GameDifficulty =
                    difficulty === 'explorer' ? 'junior_engineer' : 'mission_commander';
                  onSelectDifficulty(nextDiff);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-md shadow-cyan-500/25 whitespace-nowrap"
              >
                <span>Level Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
