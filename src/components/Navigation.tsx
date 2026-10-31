import React from 'react';
import { Volume2, VolumeX, Rocket, Compass, BookOpen, Wrench, Award, FileText, RotateCcw, Gamepad2 } from 'lucide-react';
import { sound } from '../utils/audio';

export type ScreenId = 'welcome' | 'mission_control' | 'engineering' | 'academy' | 'game_centre' | 'scenarios' | 'achievements' | 'sources';

interface NavigationProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeMissionTitle?: string;
  onRestartMission: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  isMuted,
  onToggleMute,
  activeMissionTitle,
  onRestartMission
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3">
        {/* Zone 1: Single Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              onNavigate('welcome');
            }}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                LUNOPS
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 whitespace-nowrap">
                Lunar Operations Simulator
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs md:text-sm font-medium overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => {
              sound.playClick();
              onNavigate('mission_control');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'mission_control'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mission Control</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('engineering');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'engineering'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Engineering Lab</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('academy');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'academy'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Astronaut Academy</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('game_centre');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'game_centre'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-xs shadow-amber-500/20'
                : 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-950/30'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Galaxy Arcade</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('scenarios');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'scenarios'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Missions</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('achievements');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'achievements'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Achievements</span>
            <span className="lg:hidden">Badges</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('sources');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentScreen === 'sources'
                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sources</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {currentScreen === 'mission_control' && (
            <button
              onClick={() => {
                sound.playClick();
                onRestartMission();
              }}
              title="Restart current mission"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onNavigate(currentScreen === 'mission_control' ? 'engineering' : 'mission_control');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            {currentScreen === 'mission_control' ? 'Engineering Lab' : 'Mission Control'}
          </button>
        </div>
      </div>
    </header>
  );
};
