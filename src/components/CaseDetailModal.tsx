import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Lightbulb,
  ShieldAlert,
  Gauge
} from 'lucide-react';
import { fetchCaseById } from '../api.ts';
import { HistoricalFailureCase } from '../types/spaceMem.ts';

interface CaseDetailModalProps {
  caseId: string | null;
  onClose: () => void;
  onAnalyzeSimilar?: (caseItem: HistoricalFailureCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseId,
  onClose
}) => {
  const [caseItem, setCaseItem] = useState<HistoricalFailureCase | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setCaseItem(null);
      return;
    }
    setLoading(true);
    fetchCaseById(caseId)
      .then(data => {
        setCaseItem(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching case:', err);
        setLoading(false);
      });
  }, [caseId]);

  if (!caseId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-950/80 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col backdrop-blur-xl text-slate-100">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-sky-300 bg-sky-500/20 px-2.5 py-1 rounded border border-sky-400/30">
              {caseId}
            </span>
            <span className="font-sans text-xs text-white font-bold tracking-wider uppercase">
              HISTORICAL FAILURE INVESTIGATION DOSSIER
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/15"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5 text-slate-200">
          {loading ? (
            <div className="py-20 text-center font-mono text-slate-400 animate-pulse text-sm">
              Loading dossier from Hindsight memory bank...
            </div>
          ) : !caseItem ? (
            <div className="py-20 text-center text-slate-400 font-mono text-sm">
              Could not retrieve case details.
            </div>
          ) : (
            <>
              {/* Header Title */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-2xl font-['Inter'] font-semibold tracking-tight text-white">
                    {caseItem.component}
                  </h2>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold border ${
                    caseItem.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                    caseItem.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-white/10 text-slate-300 border border-white/15'
                  }`}>
                    {caseItem.severity}
                  </span>
                </div>
                <p className="text-xs text-sky-400 font-mono mt-1 font-semibold">
                  {caseItem.satellite} • {caseItem.subsystem} • {caseItem.testType} ({caseItem.date})
                </p>
                <div className="mt-2 text-xs text-amber-300 font-semibold">
                  <strong>Failure Mode:</strong> {caseItem.failureMode}
                </div>
              </div>

              {/* Conditions & Telemetry */}
              <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 border-b border-white/10 pb-1.5 font-bold">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    <span>TEST CONDITIONS &amp; TELEMETRY</span>
                  </span>
                  <span className="text-slate-400">{caseItem.testConditions.duration}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">TEMP</span>
                    <span className="text-white font-bold">{caseItem.testConditions.temperature}°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">PRESSURE</span>
                    <span className="text-white font-bold truncate block">{caseItem.testConditions.pressure}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">BUS VOLT</span>
                    <span className="text-white font-bold">{caseItem.testConditions.voltage}V</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                    <span className="text-slate-400 block text-[10px] font-sans font-semibold">CURRENT</span>
                    <span className="text-white font-bold">{caseItem.testConditions.current}A</span>
                  </div>
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="space-y-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>INVESTIGATION CHRONOLOGY</span>
                </h3>

                <div className="space-y-3 pl-2 border-l-2 border-sky-400/60">
                  {caseItem.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-5 space-y-0.5">
                      <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400 border-2 border-slate-950 shadow-xs" />
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-white">{event.step} — {event.title}</span>
                        {event.timestamp && <span className="text-slate-400 font-sans">({event.timestamp})</span>}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cause & Corrective */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1 backdrop-blur-md">
                  <span className="font-mono text-amber-300 font-bold block text-[11px] uppercase">
                    Confirmed Root Cause
                  </span>
                  <p className="text-slate-200 leading-relaxed">{caseItem.investigation.rootCause}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 space-y-1 backdrop-blur-md">
                  <span className="font-mono text-emerald-300 font-bold block text-[11px] uppercase">
                    Validated Corrective Action
                  </span>
                  <p className="text-slate-200 leading-relaxed">{caseItem.correctiveAction.actionAttempted}</p>
                </div>
              </div>

              {/* Lessons Learned */}
              <div className="p-4 rounded-xl bg-sky-500/15 border border-sky-400/30 space-y-1 text-xs backdrop-blur-md">
                <span className="font-mono text-sky-300 font-bold block text-[11px] uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-sky-400" />
                  <span>Key Lessons Learned</span>
                </span>
                <p className="text-slate-200 leading-relaxed font-sans font-medium">{caseItem.lessonsLearned.primaryLesson}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Retained into Bank: {caseItem.retainedDate}</span>
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer transition-colors border border-white/15"
                >
                  Close Dossier
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
