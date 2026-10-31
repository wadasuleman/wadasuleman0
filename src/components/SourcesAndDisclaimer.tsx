import React from 'react';
import { SCIENTIFIC_REFERENCES, NASA_DISCLAIMER } from '../data/scientificSources';
import { ShieldAlert, BookOpen, ExternalLink, CheckCircle2, AlertCircle, Info, Lock } from 'lucide-react';

export const SourcesAndDisclaimer: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Official Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-white">
            NASA Space Apps Challenge 2026 · Official Disclaimer
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-medium">
          "{NASA_DISCLAIMER.text}"
        </p>
        <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-amber-500/20">
          <div>
            <strong>Branding Policy: </strong>
            {NASA_DISCLAIMER.brandingPolicy}
          </div>
          <div>
            <strong>Child Safety & Privacy: </strong>
            {NASA_DISCLAIMER.privacyPolicy}
          </div>
        </div>
      </div>

      {/* Scientific Classification Taxonomy */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">
            Transparency & Scientific Distinction
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            In compliance with challenge guidelines, LUNOPS strictly categorizes every piece of data shown in the simulator into four distinct classifications:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              1. Real NASA Information
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Official NASA mission data, ECLSS operating principles, Lunar Reconnaissance Orbiter (LRO) surface lighting, and plant habitat parameters.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              2. Published Scientific Literature
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Peer-reviewed studies on lunar regolith radiation absorption, volcanic lava tube structural integrity, and 1/6th gravity biomechanics.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              3. Simplified Educational Models
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Discrete hourly mathematical calculations designed to teach cause-and-effect relationships without overwhelming young learners with complex differential equations.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="font-bold text-violet-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400"></span>
              4. Simulated Game Scenarios
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Curated interactive challenges (e.g. tracker actuator jams, solar particle alert drills) created solely for training junior mission commanders.
            </p>
          </div>
        </div>
      </div>

      {/* Full References Database Table / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Documented Scientific Sources & Citations
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {SCIENTIFIC_REFERENCES.length} Documented Sources
          </span>
        </div>

        <div className="space-y-3">
          {SCIENTIFIC_REFERENCES.map((ref) => (
            <div
              key={ref.id}
              className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-4 space-y-2 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-white">{ref.title}</h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-cyan-300">{ref.organization}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{ref.classification}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {ref.summary}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <div>
                  <strong className="text-slate-300">How used in LUNOPS: </strong>
                  {ref.applicationUsage}
                </div>
                <a
                  href={ref.officialUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 whitespace-nowrap"
                >
                  <span>Official Reference</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Child Safety & Privacy Statement */}
      <div className="bg-[#0B132B]/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Child Safety & COPPA Compliance</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          LUNOPS is engineered for children aged 7–12, educators, and classrooms. We do not require account creation, do not request names or personal contact info, and do not track student locations. All mission progress and badge unlocks remain safely stored in your browser’s local storage.
        </p>
      </div>
    </div>
  );
};
