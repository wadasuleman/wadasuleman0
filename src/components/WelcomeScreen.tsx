import React from 'react';
import { Rocket, BookOpen, Award, Compass, ArrowRight, ShieldCheck, Zap, Droplets, Heart, Gamepad2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface WelcomeScreenProps {
  onStartMission: () => void;
  onResumeMission?: () => void;
  savedMissionSummary?: {
    scenarioTitle: string;
    sol: number;
    hour: number;
    savedAt: string;
  } | null;
  onOpenAcademy: () => void;
  onOpenAchievements: () => void;
  onOpenScenarios: () => void;
  onOpenGameCentre?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartMission,
  onResumeMission,
  savedMissionSummary,
  onOpenAcademy,
  onOpenAchievements,
  onOpenScenarios,
  onOpenGameCentre
}) => {
  return (
    <div className="space-y-10 pb-8">
      {/* Hero Showcase Area */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#0B132B] shadow-2xl shadow-cyan-950/40">
        <div className="relative min-h-[440px] sm:min-h-[500px] flex flex-col justify-end p-6 sm:p-10 lg:p-12">
          {/* Background Image of Lunar South Pole Base */}
          <img
            src="/src/assets/images/hero_lunar_habitat_1793375538900.jpg"
            alt="Futuristic Lunar Research Outpost at the South Pole"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/70 to-transparent pointer-events-none" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider">
                NASA Space Apps Challenge 2026 · Junior Astronaut Mission Trainer
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              LUNOPS
            </h1>

            <div className="text-xl sm:text-2xl font-bold text-cyan-300">
              Lunar Operations Simulator
            </div>

            <p className="text-base sm:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed">
              Every Decision Shapes the Mission.
            </p>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Become a junior lunar mission commander at Artemis Outpost Alpha. Balance life support, recycle water, direct solar energy, and safeguard your astronaut crew against cosmic radiation!
            </p>

            {/* In-Flight Saved Mission Notice if present */}
            {savedMissionSummary && (
              <div className="bg-[#0B132B]/90 border border-cyan-500/50 rounded-xl p-3.5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-cyan-950/50 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                    <Rocket className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                        Mission in Progress
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-300 font-medium">
                        Sol {savedMissionSummary.sol} ({String(savedMissionSummary.hour).padStart(2, '0')}:00)
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {savedMissionSummary.scenarioTitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      if (onResumeMission) onResumeMission();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md shadow-cyan-500/30 whitespace-nowrap"
                  >
                    <span>Resume Mission</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playSuccess();
                  onStartMission();
                }}
                className={`flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold rounded-xl transition-all transform hover:-translate-y-0.5 whitespace-nowrap ${
                  savedMissionSummary
                    ? 'text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 shadow-md'
                    : 'text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/25'
                }`}
              >
                <Rocket className="w-5 h-5" />
                <span>{savedMissionSummary ? 'START NEW MISSION' : 'START MISSION'}</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAcademy();
                }}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors backdrop-blur-md whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Learning Centre</span>
              </button>

              {onOpenGameCentre && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenGameCentre();
                  }}
                  className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 rounded-xl transition-all shadow-md shadow-amber-950/40 backdrop-blur-md whitespace-nowrap"
                >
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <span>LUNOPS Galaxy Arcade</span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenScenarios();
                }}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors backdrop-blur-md whitespace-nowrap"
              >
                <Compass className="w-4 h-4 text-slate-400" />
                <span>Mission Scenarios</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How to Play & Core Systems Guide */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Junior Commander Briefing</span>
            <h2 className="text-xl font-bold text-white mt-0.5">How to Operate Your Lunar Base</h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">4 Core Operational Pillars</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-2 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">1. Closed-Loop ECLSS</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Recycle breath moisture, sweat, and greywater up to 98% efficiency to preserve drinking water and supply oxygen electrolysis.
            </p>
          </div>

          <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-2 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">2. Solar Power Grid</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Track sunlight, wipe regolith dust from arrays, and charge battery reserves to survive cold shadow phases and lunar night.
            </p>
          </div>

          <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-2 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">3. Radiation Shielding</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pile 2.5m of Moon regolith over the dome, deploy magnetic deflectors, or shelter crew in underground lava tubes during solar storms.
            </p>
          </div>

          <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 space-y-2 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">4. Crew Wellbeing</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Grow fresh greenhouse veggies, balance research shifts with rest, and ensure all 4 astronauts stay healthy and inspired.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Botanical Wing & Flight Director Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Spotlight 1: Greenhouse */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col justify-between">
          <div className="relative h-44">
            <img
              src="/src/assets/images/lunar_greenhouse_hydroponics_1793375539410.jpg"
              alt="Closed-Loop Space Habitat Greenhouse"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent pointer-events-none" />
          </div>
          <div className="p-5 space-y-2">
            <h3 className="text-base font-bold text-white">Hydroponic Space Farming</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore how NASA scientists cultivate fresh red romaine lettuce and radishes in aeroponic vertical racks with zero soil, producing crisp vegetables and fresh oxygen.
            </p>
            <button
              onClick={() => {
                sound.playClick();
                onOpenAcademy();
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
            >
              <span>Read Academy Lesson 05</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spotlight 2: Commander Luna Advisor */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <img
              src="/src/assets/images/junior_astronaut_commander_1793375540756.jpg"
              alt="Flight Director Commander Luna"
              className="w-16 h-16 rounded-2xl object-cover border border-cyan-400 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">Flight Director</div>
              <h3 className="text-base font-bold text-white mt-0.5">Meet Commander Luna</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Your educational co-pilot! Ask questions about space physics, get real-time hints during emergencies, and learn how real astronauts prepare for deep space expeditions.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 italic">
            "Space exploration is not about taking wild risks—it is about thoughtful planning, teamwork, and respecting the laws of physics!"
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-mono">AI & Rule-Based Guided Learning</span>
            <button
              onClick={() => {
                sound.playClick();
                onOpenAchievements();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>View Achievements</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
