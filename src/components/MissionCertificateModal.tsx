import React, { useState, useRef } from 'react';
import { Award, Download, Printer, X, Sparkles, CheckCircle2, ShieldCheck, Star } from 'lucide-react';
import { sound } from '../utils/audio';

interface MissionCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionTitle: string;
  solsCommanded: number;
  finalScore: number;
  ratingBadge: string;
  completionDate?: string;
}

export const MissionCertificateModal: React.FC<MissionCertificateModalProps> = ({
  isOpen,
  onClose,
  missionTitle,
  solsCommanded,
  finalScore,
  ratingBadge,
  completionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}) => {
  const [cadetName, setCadetName] = useState<string>('Junior Commander Alex');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Client-side high-resolution PNG generation using HTML5 Canvas (zero external dependencies)
  const handleDownloadPNG = () => {
    sound.playClick();
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1600;
      const height = 1100;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // 1. Background fill
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#070b14');
      grad.addColorStop(0.5, '#0b132b');
      grad.addColorStop(1, '#050810');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Outer decorative gold/cyan border
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(42, 42, width - 84, height - 84);

      // Corner stars
      const drawCornerStar = (x: number, y: number) => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCornerStar(55, 55);
      drawCornerStar(width - 55, 55);
      drawCornerStar(55, height - 55);
      drawCornerStar(width - 55, height - 55);

      // 3. Header & Insignia
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NASA SPACE APPS CHALLENGE 2026 · JUNIOR ASTRONAUT TRAINER', width / 2, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('LUNOPS ACADEMY', width / 2, 185);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('CERTIFICATE OF MISSION COMMAND EXCELLENCE', width / 2, 235);

      // Decorative divider
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 250, 260);
      ctx.lineTo(width / 2 + 250, 260);
      ctx.stroke();

      // 4. Citation body
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px sans-serif';
      ctx.fillText('This official simulator record certifies that Junior Astronaut', width / 2, 330);

      // Cadet Name
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText(cadetName || 'Junior Mission Commander', width / 2, 415);

      // Subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px sans-serif';
      ctx.fillText('has demonstrated outstanding scientific thinking, resource stewardship, and crew leadership in commanding', width / 2, 480);

      // Mission Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`“${missionTitle}”`, width / 2, 535);

      // 5. Stat Badges Box
      const badgeY = 620;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.roundRect(width / 2 - 450, badgeY, 900, 160, 20);
      ctx.fill();
      ctx.stroke();

      // Column 1: Sols
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px monospace';
      ctx.fillText('LUNAR DURATION', width / 2 - 300, badgeY + 50);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 38px monospace';
      ctx.fillText(`${solsCommanded} Sols`, width / 2 - 300, badgeY + 105);

      // Column 2: Score
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px monospace';
      ctx.fillText('COMMAND SCORE', width / 2, badgeY + 50);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 38px monospace';
      ctx.fillText(`${finalScore} PTS`, width / 2, badgeY + 105);

      // Column 3: Rank
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px monospace';
      ctx.fillText('CADET HONOR BADGE', width / 2 + 300, badgeY + 50);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(ratingBadge, width / 2 + 300, badgeY + 102);

      // 6. Signatures Area
      const sigY = 880;

      // Sig 1: Commander Luna
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(250, sigY);
      ctx.lineTo(550, sigY);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'italic bold 28px Georgia, serif';
      ctx.fillText('Commander Luna', 400, sigY - 18);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText('FLIGHT DIRECTOR · ARTEMIS OUTPOST', 400, sigY + 30);

      // Sig 2: Academy Date
      ctx.beginPath();
      ctx.moveTo(width - 550, sigY);
      ctx.lineTo(width - 250, sigY);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '22px monospace';
      ctx.fillText(completionDate, width - 400, sigY - 16);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText('DATE OF SIMULATION COMPLETION', width - 400, sigY + 30);

      // 7. Footer Disclaimer
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('LUNOPS is an educational simulation. Not an official NASA or US Government credential. Created for youth space science learning.', width / 2, height - 60);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `LUNOPS_Certificate_${cadetName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      sound.playSuccess();
    } catch (e) {
      console.error('Error generating certificate image', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B132B] border border-cyan-500/40 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl shadow-cyan-950/60 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Junior Astronaut Mission Certificate</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name Customization Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <label htmlFor="cadet-name-input" className="text-xs text-slate-300 font-medium">
              Customize Cadet Name / Callsign:
            </label>
          </div>
          <input
            id="cadet-name-input"
            type="text"
            value={cadetName}
            onChange={(e) => setCadetName(e.target.value)}
            maxLength={35}
            className="px-3 py-1.5 bg-[#070B14] border border-cyan-500/40 rounded-lg text-sm text-cyan-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full sm:w-64"
            placeholder="e.g. Commander Maya"
          />
        </div>

        {/* The Printable Certificate Box */}
        <div
          ref={certificateRef}
          id="lunops-printable-certificate"
          className="relative bg-gradient-to-br from-[#070B14] via-[#0B132B] to-[#050810] border-4 border-cyan-500/60 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-inner overflow-hidden"
        >
          {/* Decorative double border */}
          <div className="absolute inset-2 border border-amber-500/40 rounded-lg pointer-events-none" />

          {/* Corner gold stars */}
          <div className="absolute top-4 left-4 text-amber-400 text-xs">★</div>
          <div className="absolute top-4 right-4 text-amber-400 text-xs">★</div>
          <div className="absolute bottom-4 left-4 text-amber-400 text-xs">★</div>
          <div className="absolute bottom-4 right-4 text-amber-400 text-xs">★</div>

          <div className="space-y-1">
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-cyan-400">
              NASA SPACE APPS CHALLENGE 2026 · JUNIOR ASTRONAUT MISSION TRAINER
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              LUNOPS ACADEMY
            </h2>
            <div className="text-xs sm:text-sm font-bold text-amber-400 tracking-wider">
              CERTIFICATE OF MISSION COMMAND EXCELLENCE
            </div>
          </div>

          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto" />

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            This official simulation flight record certifies that Junior Astronaut
          </p>

          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 py-1">
            {cadetName || 'Junior Mission Commander'}
          </div>

          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            has demonstrated outstanding scientific thinking, closed-loop resource management, and crew leadership in commanding
          </p>

          <div className="text-base sm:text-lg font-bold text-white bg-slate-900/60 border border-slate-800 rounded-lg py-1.5 px-4 inline-block">
            “{missionTitle}”
          </div>

          {/* Key Accomplishments Ribbon */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto bg-slate-900/80 border border-slate-800 rounded-xl p-3 my-2">
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400">Duration</div>
              <div className="text-sm sm:text-base font-bold font-mono text-cyan-300">{solsCommanded} Sols</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400">Command Score</div>
              <div className="text-sm sm:text-base font-bold font-mono text-amber-300">{finalScore} pts</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase font-mono text-slate-400">Cadet Honor</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-400 truncate">{ratingBadge}</div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto pt-4 text-center">
            <div className="border-t border-slate-700 pt-1.5">
              <div className="text-xs sm:text-sm italic font-serif text-slate-200">Commander Luna</div>
              <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">Flight Director · Artemis Alpha</div>
            </div>
            <div className="border-t border-slate-700 pt-1.5">
              <div className="text-xs sm:text-sm font-mono text-slate-200">{completionDate}</div>
              <div className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">Date of Completion</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-[9px] text-slate-400 pt-2">
            Educational space simulation certificate. Not an official US Government or NASA credential.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          <div className="text-xs text-slate-400">
            Share your accomplishment with parents, teachers, or classmates!
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm shadow-cyan-950"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating...' : 'Download Image (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
