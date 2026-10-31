import React, { useState } from 'react';
import { ResourceState, EngineeringSettings } from '../types/simulation';
import { queryMissionAdvisor, getDiagnosticTips, AdvisorResponse } from '../utils/missionAdvisor';
import { Sparkles, Send, HelpCircle, Lightbulb, Compass, Loader2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface MissionAdvisorPanelProps {
  state: ResourceState;
  settings: EngineeringSettings;
}

export const MissionAdvisorPanel: React.FC<MissionAdvisorPanelProps> = ({
  state,
  settings
}) => {
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversation, setConversation] = useState<Array<{ sender: 'user' | 'luna'; text: string; action?: string; funFact?: string }>>([
    {
      sender: 'luna',
      text: `Greetings, Commander! I'm Flight Director Luna. I'm here to provide scientific explanations, check base telemetry, and offer tactical hints. What would you like to explore?`,
      funFact: 'Did you know? Apollo astronauts brought back 382 kilograms (842 pounds) of lunar rocks and core samples to Earth!'
    }
  ]);

  const diagnosticTips = getDiagnosticTips(state, settings);

  const handleAsk = async (questionToAsk: string) => {
    const q = questionToAsk.trim();
    if (!q || isLoading) return;

    sound.playClick();
    setInputQuestion('');
    setConversation(prev => [...prev, { sender: 'user', text: q }]);
    setIsLoading(true);

    try {
      const result: AdvisorResponse = await queryMissionAdvisor(q, state, settings);
      setConversation(prev => [
        ...prev,
        {
          sender: 'luna',
          text: result.answer,
          action: result.suggestedAction,
          funFact: result.funFact
        }
      ]);
      sound.playPing();
    } catch {
      setConversation(prev => [
        ...prev,
        {
          sender: 'luna',
          text: 'Remember, keeping electrical power net-positive and closed-loop water recovery above 88% is key to outpost survival!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'How do we breathe on the Moon?',
    'Why does Moon dust damage solar panels?',
    'Where does drinking water come from?',
    'What should I do during a solar storm?',
    'How does 1/6th gravity feel?'
  ];

  return (
    <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col h-full">
      {/* Flight Director Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/src/assets/images/junior_astronaut_commander_1793375540756.jpg"
              alt="Commander Luna - Flight Director"
              className="w-10 h-10 rounded-full object-cover border border-cyan-400"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Commander Luna</h3>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-[11px] font-mono text-cyan-400">Flight Director</span>
            </div>
            <div className="text-[11px] text-slate-400">Space Science & Operations Advisor</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cadet Assistant</span>
        </div>
      </div>

      {/* Real-Time Outpost Telemetry Hint Strip */}
      <div className="px-4 py-2.5 bg-cyan-950/20 border-b border-slate-800/80 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200">
          <span className="font-semibold text-amber-300">Live Mission Hint: </span>
          {diagnosticTips[0]}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px] scrollbar-thin">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-none'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none'
              }`}
            >
              {msg.text}

              {msg.action && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  <span>Tip: {msg.action}</span>
                </div>
              )}

              {msg.funFact && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 leading-tight">
                  ✨ <strong>Space Fact:</strong> {msg.funFact}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Commander Luna is calculating space science telemetry...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>Ask Luna a space question:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {sampleQuestions.slice(0, 3).map((sq, i) => (
            <button
              key={i}
              onClick={() => handleAsk(sq)}
              className="text-[11px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 hover:text-white transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(inputQuestion);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask about oxygen, radiation, Moon dust, or power..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="p-2 rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
