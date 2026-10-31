import React, { useState } from 'react';
import { ACADEMY_LESSONS, AcademyLesson } from '../data/academyLessons';
import { BookOpen, CheckCircle2, XCircle, ArrowRight, Sparkles, Send, ShieldAlert, Award, Play, Droplets, Sun, Sprout, Zap, Info, Sliders, RotateCcw } from 'lucide-react';
import { sound } from '../utils/audio';

export const JuniorAstronautAcademy: React.FC = () => {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(ACADEMY_LESSONS[0].id);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResult, setShowQuizResult] = useState<Record<string, boolean>>({});

  // Interactive Activity States
  // 1. Gravity drop state
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [dropLocation, setDropLocation] = useState<'moon' | 'earth'>('moon');

  // 2. Radiation slider state
  const [regolithMeters, setRegolithMeters] = useState<number>(2.5);

  // 3. Comm ping state
  const [pingProgress, setPingProgress] = useState<number>(0);
  const [pingActive, setPingActive] = useState<boolean>(false);

  // 4. Module 03: Water Recycling Lab state
  const [filterIntensity, setFilterIntensity] = useState<number>(3); // 1 to 4
  const [thermalPurgeActive, setThermalPurgeActive] = useState<boolean>(true);

  // 5. Module 04: Lunar Lighting Lab state
  const [lunarLocation, setLunarLocation] = useState<'shackleton_peak' | 'equator' | 'shadowed_crater'>('shackleton_peak');
  const [cycleHour, setCycleHour] = useState<number>(72); // 0 to 354 hours

  // 6. Module 05: Space Farming Lab state
  const [redLight, setRedLight] = useState<number>(75); // 0 to 100%
  const [blueLight, setBlueLight] = useState<number>(25); // 0 to 100%
  const [photoperiod, setPhotoperiod] = useState<number>(18); // 12 to 24 hours

  const activeLesson = ACADEMY_LESSONS.find(l => l.id === selectedLessonId) || ACADEMY_LESSONS[0];

  const handleSelectAnswer = (lessonId: string, optionIndex: number) => {
    sound.playClick();
    setQuizAnswers(prev => ({ ...prev, [lessonId]: optionIndex }));
    setShowQuizResult(prev => ({ ...prev, [lessonId]: true }));
    const lesson = ACADEMY_LESSONS.find(l => l.id === lessonId);
    if (lesson && optionIndex === lesson.quiz.correctIndex) {
      sound.playSuccess();
    }
  };

  // Run Galileo drop animation
  const runDropExperiment = () => {
    sound.playClick();
    setIsDropping(true);
    setTimeout(() => {
      setIsDropping(false);
      sound.playPing();
    }, dropLocation === 'moon' ? 2400 : 1000); // Moon takes longer due to 1.62 m/s²
  };

  // Run Comm Ping animation
  const runCommPing = () => {
    if (pingActive) return;
    sound.playClick();
    setPingActive(true);
    setPingProgress(0);

    const startTime = Date.now();
    const duration = 2600; // 2.6s round trip

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPingProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setPingActive(false);
        sound.playSuccess();
      }
    }, 50);
  };

  // Attenuated radiation calculation based on regolith meters
  // Unshielded: 500 mSv/yr, with regolith: drops exponentially
  const unshieldedDose = 100;
  const attenuatedDose = Math.max(1, Math.round(unshieldedDose * Math.exp(-1.4 * regolithMeters)));

  return (
    <div className="space-y-6">
      {/* Academy Header */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Junior Astronaut Flight School</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">Interactive Space Science Centre</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Junior Astronaut Academy</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Master the core scientific principles of lunar exploration—from 1/6th gravity and regolith radiation shielding to closed-loop water chemistry!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300">6 Interactive Modules</span>
        </div>
      </div>

      {/* Main Academy Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lesson Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Academy Curriculum
          </div>
          {ACADEMY_LESSONS.map((lesson) => {
            const isSelected = lesson.id === selectedLessonId;
            const isAnswered = showQuizResult[lesson.id];
            const isCorrect = quizAnswers[lesson.id] === lesson.quiz.correctIndex;

            return (
              <button
                key={lesson.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedLessonId(lesson.id);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-[#0B132B]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#0B132B]/90 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{lesson.number}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-bold text-white">{lesson.title}</span>
                  </div>
                  {isAnswered && (
                    isCorrect ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                    )
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{lesson.summary}</div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Interactive Lesson & Sandbox (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Lesson Main Card */}
          <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-6 space-y-5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Module {activeLesson.number} · {activeLesson.topic}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeLesson.title}</h3>
              </div>
            </div>

            {/* Explanation Prose with generous spacing */}
            <div className="space-y-3">
              {activeLesson.explanation.map((para, i) => (
                <p key={i} className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Astronaut Fun Fact Card */}
            <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Space Explorer Fact
                </div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeLesson.scientificFact}
                </div>
              </div>
            </div>

            {/* Hands-On Interactive Laboratory Widget */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Interactive Activity: {activeLesson.interactiveActivity.title}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">Interactive Simulation</span>
              </div>
              <p className="text-xs text-slate-300">
                {activeLesson.interactiveActivity.instructions}
              </p>

              {/* Render dynamic widget based on active lesson type */}
              {activeLesson.interactiveActivity.type === 'gravity_drop' && (
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setDropLocation('moon');
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          dropLocation === 'moon' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Moon (1.62 m/s² · Vacuum)
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setDropLocation('earth');
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          dropLocation === 'earth' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Earth (9.8 m/s² · With Air)
                      </button>
                    </div>

                    <button
                      onClick={runDropExperiment}
                      disabled={isDropping}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Drop Items!</span>
                    </button>
                  </div>

                  {/* Drop Visual Stage */}
                  <div className="relative h-44 bg-gradient-to-b from-[#0A1022] to-[#070B14] rounded-lg border border-slate-800 overflow-hidden flex justify-around px-8">
                    {/* Hammer */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">Heavy Hammer</span>
                      <div
                        className={`text-2xl transition-all ${
                          isDropping
                            ? dropLocation === 'moon'
                              ? 'translate-y-28 duration-[2400ms] ease-in'
                              : 'translate-y-28 duration-[1000ms] ease-in'
                            : 'translate-y-0'
                        }`}
                      >
                        🔨
                      </div>
                    </div>

                    {/* Feather */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">Light Feather</span>
                      <div
                        className={`text-2xl transition-all ${
                          isDropping
                            ? dropLocation === 'moon'
                              ? 'translate-y-28 duration-[2400ms] ease-in' // In lunar vacuum, both land together!
                              : 'translate-y-28 duration-[2800ms] ease-linear' // In Earth air, feather floats slowly!
                            : 'translate-y-0'
                        }`}
                      >
                        🪶
                      </div>
                    </div>

                    {/* Ground line */}
                    <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-800 border-t border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                      {dropLocation === 'moon' ? 'LUNAR SURFACE REGOLITH (NO AIR)' : 'EARTH SURFACE (ATMOSPHERE AIR DRAG)'}
                    </div>
                  </div>
                </div>
              )}

              {activeLesson.interactiveActivity.type === 'radiation_shield' && (
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Regolith Berm Thickness:</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">{regolithMeters.toFixed(1)} meters</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="5.0"
                    step="0.5"
                    value={regolithMeters}
                    onChange={(e) => {
                      sound.playClick();
                      setRegolithMeters(parseFloat(e.target.value));
                    }}
                    className="w-full accent-cyan-400"
                  />

                  {/* Shield Gauge */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Internal Radiation Dose</div>
                      <div className={`text-xl font-bold font-mono mt-0.5 ${
                        attenuatedDose < 15 ? 'text-emerald-400' : attenuatedDose < 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {attenuatedDose} <span className="text-xs font-mono text-slate-400">%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {attenuatedDose < 15 ? 'Safe for Long Missions' : 'Excessive Radiation Risk'}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Shielding Efficiency</div>
                      <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                        {(100 - attenuatedDose)}%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Cosmic Rays Absorbed
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLesson.interactiveActivity.type === 'comm_delay' && (
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Moon to Earth Distance: 384,400 km</div>
                      <div className="text-[11px] text-slate-400">Speed of light: 300,000 km/s (1.3s one-way)</div>
                    </div>

                    <button
                      onClick={runCommPing}
                      disabled={pingActive}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Radio Ping</span>
                    </button>
                  </div>

                  {/* Radio wave travel visualization */}
                  <div className="relative h-20 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between px-6">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                        🌕
                      </div>
                      <span className="text-[10px] text-cyan-300 font-mono mt-1">Moon Base</span>
                    </div>

                    {/* Progress track */}
                    <div className="flex-1 mx-4 relative">
                      <div className="w-full bg-slate-800 h-1 rounded-full"></div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400 flex items-center justify-center text-[8px] text-slate-950 font-bold transition-all"
                        style={{
                          left: pingProgress <= 50 ? `${pingProgress * 2}%` : `${(100 - (pingProgress - 50) * 2)}%`
                        }}
                      >
                        ⚡
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-600 flex items-center justify-center text-xs">
                        🌍
                      </div>
                      <span className="text-[10px] text-blue-300 font-mono mt-1">Earth Control</span>
                    </div>
                  </div>

                  <div className="text-center text-xs font-mono text-cyan-300">
                    {pingActive ? `Signal in flight across deep space... (${(pingProgress * 0.026).toFixed(1)}s)` : 'Radio loop latency: 2.6 seconds round trip'}
                  </div>
                </div>
              )}

              {/* MODULE 03: WATER RECYCLING LAB */}
              {activeLesson.interactiveActivity.type === 'water_filter' && (() => {
                const recoveryRates = [75, 88, 95, 98];
                const basePowers = [0.6, 1.2, 2.1, 2.8];
                const ppmValues = [45, 18, 6, 2];
                const recovery = recoveryRates[filterIntensity - 1];
                const power = Number((basePowers[filterIntensity - 1] + (thermalPurgeActive ? 0.6 : 0.0)).toFixed(1));
                const ppm = thermalPurgeActive ? Math.max(1, Math.round(ppmValues[filterIntensity - 1] * 0.4)) : ppmValues[filterIntensity - 1];

                return (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Droplets className="w-4 h-4 text-cyan-400" />
                          <span>ECLSS Multi-Stage Filtration Experiment</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Balance water recovery percentage against electrical power demand
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                        Simulated ECLSS Loop
                      </span>
                    </div>

                    {/* Multi-stage filtration flow visual */}
                    <div className="grid grid-cols-3 gap-2 py-2">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Stage 1</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">Particulate Trap</div>
                        <div className="text-[10px] text-slate-400 mt-1">Strains dust & lint</div>
                        <div className="mt-1.5 text-[10px] text-emerald-400 font-mono">100% Active</div>
                      </div>
                      <div className={`border rounded-lg p-2.5 text-center transition-all ${
                        filterIntensity >= 2 ? 'bg-cyan-950/40 border-cyan-500/40' : 'bg-slate-900 border-slate-800 opacity-60'
                      }`}>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Stage 2</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">Catalytic Bed</div>
                        <div className="text-[10px] text-slate-400 mt-1">Breaks organics</div>
                        <div className="mt-1.5 text-[10px] text-cyan-300 font-mono">
                          {filterIntensity >= 2 ? 'Engaged' : 'Bypassed'}
                        </div>
                      </div>
                      <div className={`border rounded-lg p-2.5 text-center transition-all ${
                        filterIntensity >= 3 ? 'bg-blue-950/40 border-blue-500/40' : 'bg-slate-900 border-slate-800 opacity-60'
                      }`}>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Stage 3</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">Vacuum Distillation</div>
                        <div className="text-[10px] text-slate-400 mt-1">Boils at low pressure</div>
                        <div className="mt-1.5 text-[10px] text-blue-300 font-mono">
                          {filterIntensity >= 3 ? 'Ultra Distill' : 'Standard'}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Controls */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-white">Filtration Intensity Level:</span>
                          <span className="font-mono text-cyan-400 font-bold">
                            Level {filterIntensity}: {filterIntensity === 1 ? 'Eco Minimal (75%)' : filterIntensity === 2 ? 'Standard (88%)' : filterIntensity === 3 ? 'High Yield (95%)' : 'NASA Maximum (98%)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((level) => (
                            <button
                              key={level}
                              onClick={() => {
                                sound.playClick();
                                setFilterIntensity(level);
                              }}
                              className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
                                filterIntensity === level
                                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              Level {level} ({recoveryRates[level - 1]}%)
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div>
                          <div className="text-xs font-semibold text-white">Thermal Flash Sterilization</div>
                          <div className="text-[11px] text-slate-400">High-temp loop purge destroys microbes (+0.6 kW)</div>
                        </div>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setThermalPurgeActive(!thermalPurgeActive);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                            thermalPurgeActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {thermalPurgeActive ? '● Purge Active (+0.6 kW)' : '○ Standby UV'}
                        </button>
                      </div>
                    </div>

                    {/* Results Metrics Strip */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Water Recovery</div>
                        <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{recovery}%</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Recycled Loop</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Power Consumed</div>
                        <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{power} kW</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Base Electrical Draw</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Purity Quality</div>
                        <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{ppm} ppm</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ppm <= 5 ? 'Ultra-Pure Potable' : ppm <= 20 ? 'Drinkable Clean' : 'Greywater Grade'}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <strong>Scientific Tradeoff:</strong> Pushing water recovery from 88% to 98% requires nearly triple the electrical power because boiling down dense brine requires high-temperature vacuum distillation.
                    </div>
                    <div className="text-[10px] text-slate-500 text-center font-mono">
                      * Educational simulation estimates based on NASA Marshall Space Flight Center ECLSS engineering models.
                    </div>
                  </div>
                );
              })()}

              {/* MODULE 04: LUNAR LIGHTING LAB */}
              {activeLesson.interactiveActivity.type === 'solar_angle' && (() => {
                let sunElevation = 0;
                let solarOutputKw = 0;
                let isSunlit = false;
                let tempC = -20;
                let locationDesc = '';

                if (lunarLocation === 'equator') {
                  // Equator: 177 hrs day, 177 hrs night
                  const normalized = cycleHour % 354;
                  if (normalized < 177) {
                    isSunlit = true;
                    sunElevation = Math.round(Math.sin((normalized / 177) * Math.PI) * 90);
                    solarOutputKw = Number((Math.sin((normalized / 177) * Math.PI) * 15.0).toFixed(1));
                    tempC = Math.round(20 + Math.sin((normalized / 177) * Math.PI) * 100);
                  } else {
                    isSunlit = false;
                    sunElevation = -Math.round(Math.sin(((normalized - 177) / 177) * Math.PI) * 90);
                    solarOutputKw = 0.0;
                    tempC = -130;
                  }
                  locationDesc = 'Equator: Harsh 14 Earth days of direct sun (+120°C) followed by 14 Earth days of deep freezing night (-130°C). Batteries must carry 354 hours of outpost life!';
                } else if (lunarLocation === 'shackleton_peak') {
                  // South Pole Peak of Eternal Light: high illumination ~86%
                  const dip = Math.sin((cycleHour / 354) * Math.PI * 2);
                  sunElevation = Number((2.5 + dip * 1.5).toFixed(1)); // low glancing angle 1° to 4°
                  isSunlit = dip > -0.7; // ~86% light
                  solarOutputKw = isSunlit ? Number((10.5 + dip * 3.0).toFixed(1)) : 1.5;
                  tempC = isSunlit ? -20 : -90;
                  locationDesc = 'South Pole Peak: Elevated crater rims catch horizontal sunlight nearly continuously (up to 86% of the year) due to the Moon’s low 1.5° axial tilt. The ideal location for a lunar base!';
                } else {
                  // Permanently Shadowed Region (PSR)
                  sunElevation = -12;
                  isSunlit = false;
                  solarOutputKw = 0.0;
                  tempC = -240;
                  locationDesc = 'Crater Floor (PSR): In deep crater bottoms, the Sun never rises above the crater rim. Temperatures stay at -240°C, preserving ancient water ice for billions of years!';
                }

                return (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-amber-400" />
                          <span>Lunar Day/Night & Sunlight Angle Simulator</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Explore why polar crater peaks are chosen over the lunar equator
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                        LRO Lola Illumination Model
                      </span>
                    </div>

                    {/* Location Selection Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setLunarLocation('shackleton_peak');
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          lunarLocation === 'shackleton_peak'
                            ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1">
                          <span>⛰️ Shackleton Peak</span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono mt-0.5">86% Sunlight Peak</div>
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          setLunarLocation('equator');
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          lunarLocation === 'equator'
                            ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">🌕 Lunar Equator</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">14d Sun / 14d Night</div>
                      </button>

                      <button
                        onClick={() => {
                          sound.playClick();
                          setLunarLocation('shadowed_crater');
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          lunarLocation === 'shadowed_crater'
                            ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">❄️ Shadowed Crater</div>
                        <div className="text-[10px] text-blue-300 font-mono mt-0.5">0% Sun (Water Ice)</div>
                      </button>
                    </div>

                    {/* Cycle Time Slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">Lunar Day/Night Cycle Progress:</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          Hour {cycleHour} of 354h (~Day {Math.floor(cycleHour / 24) + 1})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="354"
                        value={cycleHour}
                        onChange={(e) => {
                          sound.playClick();
                          setCycleHour(parseInt(e.target.value));
                        }}
                        className="w-full accent-amber-400"
                      />
                    </div>

                    {/* Visual Solar Angle Dial / Horizon View */}
                    <div className="relative h-28 bg-gradient-to-b from-[#0A1024] to-[#060810] border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-end p-3">
                      {/* Sun Representation */}
                      {isSunlit ? (
                        <div
                          className="absolute w-8 h-8 rounded-full bg-amber-400 shadow-lg shadow-amber-400/80 flex items-center justify-center text-slate-950 font-bold text-xs transition-all duration-200"
                          style={{
                            left: `${Math.min(90, Math.max(10, (cycleHour / 354) * 100))}%`,
                            bottom: `${Math.min(75, Math.max(15, 20 + sunElevation * 0.8))}%`
                          }}
                        >
                          ☀️
                        </div>
                      ) : (
                        <div className="absolute top-3 right-4 text-xs font-mono text-slate-400 flex items-center gap-1">
                          <span>🌑 Night Shadow</span>
                        </div>
                      )}

                      {/* Terrain Horizon Line */}
                      <div className="relative z-10 border-t-2 border-slate-700 pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Horizon Line (0°)</span>
                        <span>Sun Elevation: {sunElevation}°</span>
                        <span>Surface: {tempC}°C</span>
                      </div>
                    </div>

                    {/* Telemetry Output Strip */}
                    <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-800">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Solar Array Output</div>
                        <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{solarOutputKw} kW</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{isSunlit ? 'Active Generation' : 'Zero Sunlight'}</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Battery Net Flow</div>
                        <div className={`text-lg font-bold font-mono mt-0.5 ${solarOutputKw >= 7.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {solarOutputKw >= 7.5 ? `+${(solarOutputKw - 7.5).toFixed(1)} kW` : `-${(7.5 - solarOutputKw).toFixed(1)} kW`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{solarOutputKw >= 7.5 ? 'Charging Bank' : 'Draining Storage'}</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Surface Temp</div>
                        <div className={`text-lg font-bold font-mono mt-0.5 ${tempC < -100 ? 'text-blue-400' : tempC > 50 ? 'text-rose-400' : 'text-cyan-300'}`}>
                          {tempC}°C
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Regolith Surface</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                      <strong>Scientific Insight: </strong> {locationDesc}
                    </div>
                    <div className="text-[10px] text-slate-500 text-center font-mono">
                      * Educational simulation estimates based on Lunar Reconnaissance Orbiter (LRO) elevation and lighting analyses.
                    </div>
                  </div>
                );
              })()}

              {/* MODULE 05: SPACE FARMING LAB */}
              {activeLesson.interactiveActivity.type === 'led_farming' && (() => {
                // Optimal ratio is ~75% Red, ~25% Blue
                const balanceScore = Math.max(10, Math.round(100 - Math.abs(redLight - 75) * 0.8 - Math.abs(blueLight - 25) * 0.8));
                const photoperiodFactor = photoperiod / 24;
                const biomassGrowthRate = Math.min(100, Math.round(balanceScore * photoperiodFactor));
                const oxygenBonusKgPerHour = Number((0.010 + (biomassGrowthRate / 100) * 0.022).toFixed(3));
                const powerKw = Number(((photoperiod / 24) * (1.0 + (redLight + blueLight) * 0.012)).toFixed(2));
                const harvestDays = Math.max(16, Math.round(36 - (biomassGrowthRate / 100) * 16));

                return (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sprout className="w-4 h-4 text-emerald-400" />
                          <span>Hydroponic LED Spectrum Mixer Lab</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tune wavelength ratios to optimize vegetable growth rate vs electrical power
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                        NASA Veggie Plant Model
                      </span>
                    </div>

                    {/* Interactive LED Spectrum Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-rose-300">🔴 Red Light (660nm)</span>
                          <span className="font-mono text-rose-400 font-bold">{redLight}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={redLight}
                          onChange={(e) => {
                            sound.playClick();
                            setRedLight(parseInt(e.target.value));
                          }}
                          className="w-full accent-rose-500"
                        />
                        <div className="text-[10px] text-slate-400">Drives photosynthesis & leaf biomass</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-blue-300">🔵 Blue Light (450nm)</span>
                          <span className="font-mono text-blue-400 font-bold">{blueLight}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={blueLight}
                          onChange={(e) => {
                            sound.playClick();
                            setBlueLight(parseInt(e.target.value));
                          }}
                          className="w-full accent-blue-500"
                        />
                        <div className="text-[10px] text-slate-400">Controls stomata opening & stout stems</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-amber-300">⏱️ Photoperiod Hours</span>
                          <span className="font-mono text-amber-400 font-bold">{photoperiod} h/d</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="24"
                          value={photoperiod}
                          onChange={(e) => {
                            sound.playClick();
                            setPhotoperiod(parseInt(e.target.value));
                          }}
                          className="w-full accent-amber-500"
                        />
                        <div className="text-[10px] text-slate-400">Hours of LED lighting per 24h</div>
                      </div>
                    </div>

                    {/* Dynamic LED Growth Chamber Box Preview */}
                    <div
                      className="rounded-xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300"
                      style={{
                        backgroundColor: `rgba(${Math.round(redLight * 2.2)}, 12, ${Math.round(blueLight * 2.2)}, 0.25)`,
                        borderColor: `rgba(${Math.round(redLight * 2.2)}, 60, ${Math.round(blueLight * 2.2)}, 0.6)`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                          🥗
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Simulated Space Crop: Red Romaine Lettuce</div>
                          <div className="text-[11px] text-slate-200 mt-0.5">
                            Chlorophyll A & B Absorption: {balanceScore >= 80 ? 'Optimal Absorption' : balanceScore >= 60 ? 'Moderate Absorption' : 'Sub-Optimal Spectrum'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase text-slate-300">Harvest Cycle</div>
                        <div className="text-base font-bold font-mono text-emerald-300">~{harvestDays} Days to Harvest</div>
                      </div>
                    </div>

                    {/* Metrics Strip */}
                    <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-800">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Biomass Growth Index</div>
                        <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{biomassGrowthRate}%</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Photosynthesis Rate</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Bonus O₂ Released</div>
                        <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">+{oxygenBonusKgPerHour} kg/h</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Supplemental Air</div>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">LED Power Draw</div>
                        <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{powerKw} kW</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Electrical Grid Load</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                      <strong>Botanical Science Fact: </strong> In space, plants appear purple-pink under grow lights because chlorophyll molecules absorb red and blue photons while reflecting green wavelengths. Real crops also require precise root-zone water misting and temperature regulation.
                    </div>
                    <div className="text-[10px] text-slate-500 text-center font-mono">
                      * Educational plant physiology simulation model based on NASA Kennedy Space Center Veggie and Advanced Plant Habitat experiments.
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Quick Concept Quiz */}
            <div className="border-t border-slate-800/80 pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Cadet Comprehension Check
                </h4>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {activeLesson.quiz.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeLesson.quiz.options.map((opt, idx) => {
                  const isSelected = quizAnswers[activeLesson.id] === idx;
                  const hasAnswered = showQuizResult[activeLesson.id];
                  const isCorrect = idx === activeLesson.quiz.correctIndex;

                  let btnStyle = 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200';
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200';
                    } else if (isSelected) {
                      btnStyle = 'bg-red-500/20 border-red-400 text-red-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(activeLesson.id, idx)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {showQuizResult[activeLesson.id] && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed mt-2">
                  <span className="font-bold text-white">Science Explanation: </span>
                  {activeLesson.quiz.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
