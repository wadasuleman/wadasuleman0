import React from 'react';
import { GameDefinition, GameDifficulty } from '../../types/gameCentre';
import { BookOpen, Sparkles, Lightbulb, Play, X, Compass, Zap, Droplets, Sprout, Shield, HelpCircle, Layers } from 'lucide-react';
import { sound } from '../../utils/audio';

interface GameInstructionsModalProps {
  game: GameDefinition;
  difficulty: GameDifficulty;
  onStartGame: () => void;
  onClose: () => void;
}

const renderGameIcon = (iconName: string) => {
  switch (iconName) {
    case 'Compass': return <Compass className="w-6 h-6 text-cyan-400" />;
    case 'Zap': return <Zap className="w-6 h-6 text-amber-400" />;
    case 'Droplets': return <Droplets className="w-6 h-6 text-blue-400" />;
    case 'Sprout': return <Sprout className="w-6 h-6 text-emerald-400" />;
    case 'Shield': return <Shield className="w-6 h-6 text-rose-400" />;
    case 'HelpCircle': return <HelpCircle className="w-6 h-6 text-violet-400" />;
    case 'Layers': return <Layers className="w-6 h-6 text-indigo-400" />;
    default: return <Sparkles className="w-6 h-6 text-cyan-400" />;
  }
};

export const GameInstructionsModal: React.FC<GameInstructionsModalProps> = ({
  game,
  difficulty,
  onStartGame,
  onClose
}) => {
  const difficultyLabel = {
    explorer: 'Explorer (Ages 7–8 · Assisted)',
    junior_engineer: 'Junior Engineer (Ages 9–10 · Realistic)',
    mission_commander: 'Mission Commander (Ages 11–12 · Expert)'
  }[difficulty];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B132B] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              {renderGameIcon(game.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  {game.category}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] font-mono text-amber-300">
                  {difficultyLabel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">{game.title}</h2>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Close instructions"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Objective */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mission Objective</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {game.instructions.objective}
          </p>
        </div>

        {/* How to Play Steps */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>How to Play & Controls</span>
          </div>
          <ul className="space-y-2">
            {game.instructions.howToPlay.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg"
              >
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro-Tip & Space Fact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 flex items-center gap-1 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Commander Pro-Tip:
            </strong>
            {game.instructions.proTip}
          </div>

          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200/90 leading-relaxed">
            <strong className="text-cyan-300 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Real Space Fact:
            </strong>
            {game.instructions.scienceFact}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
          >
            Review Later
          </button>
          <button
            onClick={() => {
              sound.playSuccess();
              onStartGame();
            }}
            className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Mission</span>
          </button>
        </div>
      </div>
    </div>
  );
};
