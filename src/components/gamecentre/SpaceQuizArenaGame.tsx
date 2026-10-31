import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameDifficulty } from '../../types/gameCentre';
import { GAME_DEFINITIONS } from '../../data/gameCentreData';
import { GameInstructionsModal } from './GameInstructionsModal';
import { GameResultDebrief } from './GameResultDebrief';
import { sound } from '../../utils/audio';
import {
  HelpCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  Flame
} from 'lucide-react';

interface SpaceQuizArenaGameProps {
  difficulty: GameDifficulty;
  highScore: number;
  onSaveScore: (score: number, stars: number) => void;
  onBackToHub: () => void;
  onSelectDifficulty: (d: GameDifficulty) => void;
}

interface Question {
  id: string;
  category: 'Moon & Apollo' | 'Space Physics' | 'Living in Space' | 'Artemis Program';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  funFact: string;
}

const QUESTION_BANK: Question[] = [
  {
    id: 'q1',
    category: 'Moon & Apollo',
    question: 'How long does one full day-night cycle (one lunar day) last on the Moon?',
    options: ['24 hours (same as Earth)', 'About 28 Earth days', '365 Earth days', 'Only 12 hours'],
    correctIndex: 1,
    explanation: 'The Moon takes about 27.3 Earth days to rotate once on its axis, meaning daytime lasts about two weeks and nighttime lasts two weeks!',
    funFact: 'Because the Moon rotates at the exact same rate it orbits Earth (tidal locking), we always see the same face of the Moon from Earth!'
  },
  {
    id: 'q2',
    category: 'Space Physics',
    question: 'How does gravity on the Moon compare to Earth?',
    options: ['Exactly the same', 'Twice as strong', 'About one-sixth (1/6th) of Earth', 'There is zero gravity on the Moon'],
    correctIndex: 2,
    explanation: 'The Moon has less mass than Earth, creating about 1/6th of Earth gravity. A 60 kg astronaut weighs only 10 kg on the lunar surface!',
    funFact: 'Apollo astronauts found that walking was awkward in 1/6th gravity, so they invented the famous two-footed "bunny hop" to move faster.'
  },
  {
    id: 'q3',
    category: 'Living in Space',
    question: 'Why do astronauts recycle up to 98% of their water in space?',
    options: ['Space water tastes better', 'Water is extremely heavy and expensive to launch from Earth', 'Plants produce too much water', 'Comets block water tankers'],
    correctIndex: 1,
    explanation: 'Every kilogram of water launched into orbit costs thousands of dollars in rocket fuel, so closed-loop recycling of sweat, breath humidity, and urine is essential.',
    funFact: 'The water purification system on the International Space Station produces drinking water purer than municipal municipal tap water!'
  },
  {
    id: 'q4',
    category: 'Artemis Program',
    question: 'What is the primary target location for NASA’s Artemis lunar base?',
    options: ['The lunar equator', 'The Sea of Tranquillity', 'The Moon’s South Pole', 'The far side center'],
    correctIndex: 2,
    explanation: 'The South Pole features high ridges of near-constant solar illumination alongside deep permanently shadowed craters containing billions of tons of water ice.',
    funFact: 'Shackleton Crater at the lunar South Pole is over 4 kilometers (2.5 miles) deep—three times deeper than the Grand Canyon!'
  },
  {
    id: 'q5',
    category: 'Space Physics',
    question: 'Why is the sky on the Moon pitch black even during the middle of the day?',
    options: ['The Sun does not shine there', 'The Moon has no atmosphere to scatter sunlight', 'Lunar dust absorbs all light', 'Space helmets darken the view'],
    correctIndex: 1,
    explanation: 'Earth’s sky is blue because gases in our atmosphere scatter blue sunlight (Rayleigh scattering). Without an atmosphere on the Moon, light travels in straight lines and the sky remains black.',
    funFact: 'Standing on the daylit Moon, you can look up and see both the brilliant Sun and bright stars in the black sky simultaneously!'
  },
  {
    id: 'q6',
    category: 'Living in Space',
    question: 'What do hydroponic plants in space use instead of natural dirt/soil?',
    options: ['Ground-up space rocks only', 'Water rich in dissolved mineral nutrients and LED light', 'Crushed astronaut food', 'Volcanic magma'],
    correctIndex: 1,
    explanation: 'Hydroponics and aeroponics deliver water directly mixed with potassium, nitrogen, phosphorus, and calcium to plant roots without heavy soil.',
    funFact: 'NASA astronauts have grown and eaten red romaine lettuce, radishes, and chili peppers aboard the International Space Station!'
  },
  {
    id: 'q7',
    category: 'Moon & Apollo',
    question: 'What is the fine, abrasive gray powder that covers the entire Moon called?',
    options: ['Stardust', 'Lunar Regolith', 'Basalt Slag', 'Cosmic Powder'],
    correctIndex: 1,
    explanation: 'Lunar regolith is formed by billions of years of meteorite impacts grinding the surface basalt rocks into microscopic, jagged glass-like shards.',
    funFact: 'Apollo astronauts reported that lunar regolith clung to their spacesuits through static electricity and smelled faintly like spent gunpowder!'
  },
  {
    id: 'q8',
    category: 'Space Physics',
    question: 'Why do astronauts need heavy shielding against solar storms on the Moon?',
    options: ['The Moon lacks a global magnetic field to deflect charged particles', 'The Moon is too close to the Sun', 'Solar storms freeze the surface', 'Cosmic rays make radios too loud'],
    correctIndex: 0,
    explanation: 'Earth is protected by a strong magnetic field (magnetosphere). The Moon has no global magnetic field, leaving astronauts vulnerable to energetic protons during solar flares.',
    funFact: 'Underground volcanic lava tubes on the Moon can be tens of meters wide and provide natural shielding equivalent to meters of lead!'
  }
];

const QUIZ_DIFFICULTY_CONFIG: Record<GameDifficulty, { timePerQuestion: number; hintEnabled: boolean }> = {
  explorer: { timePerQuestion: 25, hintEnabled: true },
  junior_engineer: { timePerQuestion: 18, hintEnabled: false },
  mission_commander: { timePerQuestion: 12, hintEnabled: false }
};

export const SpaceQuizArenaGame: React.FC<SpaceQuizArenaGameProps> = ({
  difficulty,
  highScore,
  onSaveScore,
  onBackToHub,
  onSelectDifficulty
}) => {
  const gameDef = GAME_DEFINITIONS.find(g => g.id === 'space_quiz')!;
  const difficultyConfig = QUIZ_DIFFICULTY_CONFIG[difficulty];

  // State
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(difficultyConfig.timePerQuestion);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const hasSavedRef = useRef<boolean>(false);

  const currentQ = QUESTION_BANK[currentQuestionIndex];

  // Restart Quiz
  const resetQuiz = useCallback(() => {
    hasSavedRef.current = false;
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerConfirmed(false);
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setCorrectAnswersCount(0);
    setTimeLeft(difficultyConfig.timePerQuestion);
    setIsGameOver(false);
  }, [difficulty]);

  // Handle Option Select
  const handleSelectOption = (idx: number) => {
    if (isAnswerConfirmed || isGameOver) return;
    sound.playClick();
    setSelectedAnswerIndex(idx);
    setIsAnswerConfirmed(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      sound.playScore();
      const streakMultiplier = streak >= 3 ? 3 : streak >= 1 ? 2 : 1;
      if (streak >= 1) sound.playPowerUp();

      const questionPoints = 100 * streakMultiplier + timeLeft * 5;
      setScore(s => s + questionPoints);
      setStreak(st => {
        const nextStreak = st + 1;
        setHighestStreak(h => Math.max(h, nextStreak));
        return nextStreak;
      });
      setCorrectAnswersCount(c => c + 1);
    } else {
      sound.playThud();
      setStreak(0);
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    sound.playClick();
    if (currentQuestionIndex < QUESTION_BANK.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerConfirmed(false);
      setTimeLeft(difficultyConfig.timePerQuestion);
    } else {
      // Quiz completed!
      setIsGameOver(true);
      const stars = correctAnswersCount >= 7 ? 3 : correctAnswersCount >= 5 ? 2 : 1;
      sound.playSuccess();
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        onSaveScore(score, stars);
      }
    }
  };

  // Timer per question
  useEffect(() => {
    if (showInstructions || isGameOver || isAnswerConfirmed) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time out! Counts as missed answer
          setIsAnswerConfirmed(true);
          sound.playAlert();
          setStreak(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInstructions, isGameOver, isAnswerConfirmed]);

  const starsEarned = correctAnswersCount >= 7 ? 3 : correctAnswersCount >= 5 ? 2 : correctAnswersCount >= 3 ? 1 : 0;

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
          scienceTakeaway="Mastering space science, lunar geology, and life support systems is the foundation of becoming an Artemis astronaut and space explorer."
          statsSummary={[
            { label: 'Correct Answers', value: `${correctAnswersCount} / ${QUESTION_BANK.length}` },
            { label: 'Accuracy Rating', value: `${Math.round((correctAnswersCount / QUESTION_BANK.length) * 100)}%` },
            { label: 'Highest Streak', value: `${highestStreak} In A Row` }
          ]}
          onReplay={resetQuiz}
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
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Space Quiz Arena</h1>
              <span className="text-xs font-mono text-violet-300 uppercase px-2 py-0.5 rounded bg-violet-950/80 border border-violet-500/30 font-semibold">
                {difficulty.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Question {currentQuestionIndex + 1} of {QUESTION_BANK.length} · Test your space science knowledge!
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-3">
          {/* Question Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Clock className={`w-4 h-4 ${timeLeft < 5 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Timer</div>
              <div className="font-mono font-bold text-cyan-300">{timeLeft}s</div>
            </div>
          </div>

          {/* Streak Badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 animate-bounce">
              <Flame className="w-4 h-4 text-amber-400 fill-current" />
              <div className="text-xs font-mono font-bold text-amber-300">
                {streak}x STREAK!
              </div>
            </div>
          )}

          {/* Current Score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Score</div>
              <div className="font-mono font-bold text-white">{score}</div>
            </div>
          </div>

          {/* Controls */}
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
              resetQuiz();
            }}
            title="Restart quiz"
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

      {/* Main Question Card */}
      <div className="bg-[#050811] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl mx-auto">
        {/* Category & Progress */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
          <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider">
            Category: {currentQ.category}
          </span>
          <span className="text-slate-400 font-mono">
            Question {currentQuestionIndex + 1} / {QUESTION_BANK.length}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {currentQ.question}
        </h2>

        {/* 4 Multi-Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((opt, idx) => {
            let btnStyle = 'p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ';

            if (!isAnswerConfirmed) {
              btnStyle += 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 hover:border-cyan-400/50 text-slate-200';
            } else {
              if (idx === currentQ.correctIndex) {
                btnStyle += 'bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20';
              } else if (idx === selectedAnswerIndex) {
                btnStyle += 'bg-rose-950/40 border-rose-500 text-rose-200';
              } else {
                btnStyle += 'bg-slate-900/40 border-slate-800/60 opacity-40 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswerConfirmed}
                className={btnStyle}
              >
                <span>{opt}</span>
                {isAnswerConfirmed && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                )}
                {isAnswerConfirmed && idx === selectedAnswerIndex && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Science Fact (Appears after answer) */}
        {isAnswerConfirmed && (
          <div className="space-y-3 pt-3 border-t border-slate-800 animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed">
              <strong className="text-cyan-300 flex items-center gap-1.5 mb-1 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Scientific Explanation:
              </strong>
              {currentQ.explanation}
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 flex items-center gap-1 mb-0.5">
                ✨ Space Fun Fact:
              </strong>
              {currentQ.funFact}
            </div>

            {/* Next Question Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25"
              >
                <span>
                  {currentQuestionIndex < QUESTION_BANK.length - 1 ? 'Next Question' : 'Complete Quiz & View Score'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
