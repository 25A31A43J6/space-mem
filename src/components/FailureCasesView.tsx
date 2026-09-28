import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Lightbulb,
  Search,
  Gauge
} from 'lucide-react';
import { fetchAllCases } from '../api.ts';
import { HistoricalFailureCase } from '../types/spaceMem.ts';

interface FailureCasesViewProps {
  selectedCaseId?: string | null;
  onSelectCase: (caseId: string) => void;
  onAnalyzeNew: () => void;
}

export const FailureCasesView: React.FC<FailureCasesViewProps> = ({
  selectedCaseId,
  onSelectCase,
  onAnalyzeNew
}) => {
  const [cases, setCases] = useState<HistoricalFailureCase[]>([]);
  const [activeCase, setActiveCase] = useState<HistoricalFailureCase | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllCases().then(data => {
      setCases(data);
      if (selectedCaseId) {
        const found = data.find(c => c.id.toLowerCase() === selectedCaseId.toLowerCase());
        if (found) setActiveCase(found);
        else setActiveCase(data[0] || null);
      } else if (data.length > 0 && !activeCase) {
        setActiveCase(data[0]);
      }
    });
  }, [selectedCaseId]);

  const filteredCases = cases.filter(c =>
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.satellite.toLowerCase().includes(search.toLowerCase()) ||
    c.component.toLowerCase().includes(search.toLowerCase()) ||
    c.failureMode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-xs mb-1.5 font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>HISTORICAL EXPERIENCES &amp; ANOMALY DOSSIERS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-['Inter'] font-light text-white tracking-tight">
            Spacecraft Failure Case Explorer
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Deep-dive investigation dossiers, chronological timelines, and validated corrective action histories.
          </p>
        </div>

        <button
          onClick={onAnalyzeNew}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shrink-0 transition-colors shadow-lg"
        >
          <Search className="w-4 h-4 text-sky-100" />
          <span>Match a New Failure</span>
        </button>
      </div>

      {/* Main Split Layout: Left Case Selector (1 Col) & Right Dossier (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Case List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter 12 historical cases..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 shadow-sm font-sans backdrop-blur-md"
            />
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredCases.map(c => {
              const isSelected = activeCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveCase(c);
                    onSelectCase(c.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left backdrop-blur-md ${
                    isSelected
                      ? 'bg-sky-500/25 border-sky-400/50 text-white shadow-md'
                      : 'bg-white/[0.06] border-white/10 hover:bg-white/[0.12] text-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-sky-300">
                      {c.id}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      c.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      c.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-white/10 text-slate-300 border border-white/15'
                    }`}>
                      {c.severity}
                    </span>
                  </div>
                  <div className="text-xs font-bold truncate text-white mb-0.5">
                    {c.component}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {c.satellite} • {c.subsystem}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Case Dossier */}
        {activeCase ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Header Card */}
            <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-sky-300 bg-sky-500/20 px-2.5 py-1 rounded border border-sky-400/30">
                    {activeCase.id}
                  </span>
                  <span className="text-sm font-bold text-white">{activeCase.satellite}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                    activeCase.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    activeCase.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-white/10 text-slate-300 border border-white/15'
                  }`}>
                    {activeCase.severity}
                  </span>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                    {activeCase.correctiveAction.solved ? 'RESOLVED' : 'INVESTIGATED'}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-['Inter'] font-semibold tracking-tight text-white">
                  {activeCase.component}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Subsystem: <strong className="text-slate-200 font-semibold">{activeCase.subsystem}</strong> • Test Regime: <strong className="text-slate-200 font-semibold">{activeCase.testType}</strong> • Date: <span className="font-mono text-sky-300 font-medium">{activeCase.date}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 text-xs space-y-1.5 backdrop-blur-md">
                <div className="text-white font-semibold">
                  <span className="text-slate-400 font-normal">Failure Mode:</span> {activeCase.failureMode}
                </div>
                <div className="text-slate-300">
                  <span className="text-white font-semibold">Symptoms:</span> {activeCase.symptoms.join(' • ')}
                </div>
              </div>
            </div>

            {/* Test Conditions & Telemetry */}
            <div className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-white uppercase font-bold border-b border-white/10 pb-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <span>TEST CONDITIONS &amp; TELEMETRY AT FAILURE</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="text-slate-400 block text-[10px] font-sans">TEMP</span>
                  <span className="text-white font-bold">{activeCase.testConditions.temperature}°C</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="text-slate-400 block text-[10px] font-sans">PRESSURE</span>
                  <span className="text-white font-bold truncate block">{activeCase.testConditions.pressure}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="text-slate-400 block text-[10px] font-sans">BUS VOLT</span>
                  <span className="text-white font-bold">{activeCase.testConditions.voltage}V</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="text-slate-400 block text-[10px] font-sans">CURRENT</span>
                  <span className="text-white font-bold">{activeCase.testConditions.current}A</span>
                </div>
              </div>
            </div>

            {/* Chronological Investigation Timeline */}
            <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-white uppercase font-bold border-b border-white/10 pb-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>CHRONOLOGICAL INVESTIGATION TIMELINE</span>
              </div>

              <div className="space-y-4 pl-2 border-l-2 border-sky-400/40">
                {activeCase.timeline.map((step, idx) => (
                  <div key={idx} className="relative pl-6 space-y-1">
                    <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-sky-500 border-2 border-slate-900 shadow-sm" />
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-white">{step.step} — {step.title}</span>
                      {step.timestamp && <span className="text-slate-400 font-sans">({step.timestamp})</span>}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause & Corrective Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-2 shadow-2xl">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  CONFIRMED ROOT CAUSE
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeCase.investigation.rootCause}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-2 shadow-2xl">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  CORRECTIVE ACTION (VALIDATED)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeCase.correctiveAction.actionAttempted} ({activeCase.correctiveAction.whatWorked})
                </p>
              </div>
            </div>

            {/* Key Lessons Learned */}
            <div className="p-5 rounded-2xl bg-sky-500/15 border border-sky-400/30 space-y-2 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-300 font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-sky-400" />
                <span>KEY LESSONS LEARNED &amp; PREVENTIVE GUIDELINES</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                {activeCase.lessonsLearned.primaryLesson}
              </p>
              <div className="pt-2 border-t border-sky-400/20 text-[11px] text-slate-300 font-mono">
                Check First Next Time: <strong className="text-white font-bold">{activeCase.lessonsLearned.checkFirstNextTime}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
