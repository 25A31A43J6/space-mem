import React, { useState, useEffect } from 'react';
import {
  Network,
  Info,
  ExternalLink,
  Zap,
  Activity
} from 'lucide-react';
import { fetchAllCases } from '../api.ts';
import { HistoricalFailureCase } from '../types/spaceMem.ts';

interface KnowledgeMapViewProps {
  onSelectCase: (caseId: string) => void;
  onAnalyzeNew: () => void;
}

export const KnowledgeMapView: React.FC<KnowledgeMapViewProps> = ({
  onSelectCase,
  onAnalyzeNew
}) => {
  const [cases, setCases] = useState<HistoricalFailureCase[]>([]);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<HistoricalFailureCase | null>(null);

  useEffect(() => {
    fetchAllCases().then(data => {
      setCases(data);
      if (data.length > 0) setSelectedCase(data[0]);
    });
  }, []);

  const subsystems = [
    'ALL',
    'Electrical Power (EPS)',
    'Attitude & Orbit Control (ADCS)',
    'Telemetry & Telecommand (TT&C)',
    'Thermal Control (TCS)',
    'On-Board Computer (OBC)',
    'Propulsion (PROP)',
    'Optical Payload (PL)'
  ];

  const displayedCases = selectedSubsystem === 'ALL'
    ? cases
    : cases.filter(c => c.subsystem === selectedSubsystem);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-xs mb-1.5 font-bold">
            <Network className="w-3.5 h-3.5" />
            <span>RELATIONAL FAILURE GRAPH</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-['Inter'] font-light text-white tracking-tight">
            Failure Knowledge Map
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Trace relationships across Subsystems, Components, Failure Modes, Root Causes, and Validated Fixes.
          </p>
        </div>

        <button
          onClick={onAnalyzeNew}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shrink-0 transition-colors shadow-lg"
        >
          <Zap className="w-4 h-4 text-sky-100" />
          <span>Analyze Current Anomaly</span>
        </button>
      </div>

      {/* Subsystem Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {subsystems.map(sub => (
          <button
            key={sub}
            onClick={() => setSelectedSubsystem(sub)}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer backdrop-blur-md ${
              selectedSubsystem === sub
                ? 'bg-sky-500/25 text-sky-200 border-sky-400/50 font-bold shadow-sm'
                : 'bg-white/[0.08] text-slate-300 border-white/15 hover:text-white hover:bg-white/[0.14]'
            }`}
          >
            {sub === 'ALL' ? 'All Subsystems (12)' : sub.replace(/\(.*\)/, '')}
          </button>
        ))}
      </div>

      {/* Relational Knowledge Graph Visualizer & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Flow Nodes (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono text-white uppercase font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>RELATIONAL GRAPH MAPPING ({displayedCases.length} NODES)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded border border-white/15">
              CLICK ANY BRANCH TO INSPECT
            </span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {displayedCases.map(c => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400/50 shadow-md'
                      : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.10]'
                  }`}
                >
                  {/* Top Line: Satellite & ID */}
                  <div className="flex items-center justify-between text-xs font-mono mb-2.5">
                    <span className="text-sky-300 font-bold">{c.id} • {c.satellite}</span>
                    <span className="text-slate-400">{c.testType}</span>
                  </div>

                  {/* Flow Chain Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs">
                    {/* Subsystem */}
                    <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                      <span className="text-[10px] font-mono text-sky-400 block font-bold mb-0.5">SUBSYSTEM</span>
                      <span className="text-white text-xs truncate block font-semibold">{c.subsystem.split(' ')[0]}</span>
                    </div>

                    <div className="hidden sm:flex justify-center text-slate-400">→</div>

                    {/* Component */}
                    <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/15 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-400 block font-bold mb-0.5">COMPONENT</span>
                      <span className="text-white text-xs truncate block font-semibold">{c.component.split(' ')[0]}</span>
                    </div>

                    <div className="hidden sm:flex justify-center text-slate-400">→</div>

                    {/* Root Cause Node */}
                    <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 shadow-sm">
                      <span className="text-[10px] font-mono text-amber-300 block font-bold mb-0.5">CAUSE</span>
                      <span className="text-amber-200 text-xs truncate block font-medium">{c.failureMode}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector (1 Col) */}
        {selectedCase && (
          <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                <span>RELATIONSHIP INSPECTOR</span>
              </span>
              <span className="font-mono text-xs text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30 font-bold">
                {selectedCase.id}
              </span>
            </div>

            <div>
              <h3 className="text-base font-['Inter'] font-bold text-white">
                {selectedCase.component}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Program: {selectedCase.satellite} • {selectedCase.subsystem}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 block font-bold">OBSERVED SYMPTOMS:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{selectedCase.symptoms.join(' • ')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1">
                <span className="text-[11px] font-mono text-amber-300 block font-bold">ROOT CAUSE DETERMINATION:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{selectedCase.investigation.rootCause}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 space-y-1">
                <span className="text-[11px] font-mono text-emerald-300 block font-bold">VALIDATED CORRECTIVE ACTION:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{selectedCase.correctiveAction.actionAttempted}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-500/15 border border-sky-400/30 space-y-1">
                <span className="text-[11px] font-mono text-sky-300 block font-bold">LESSON LEARNED:</span>
                <p className="text-slate-200 leading-relaxed font-sans">{selectedCase.lessonsLearned.primaryLesson}</p>
              </div>
            </div>

            <button
              onClick={() => onSelectCase(selectedCase.id)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-lg"
            >
              <span>View Full Dossier Timeline</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-100" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
