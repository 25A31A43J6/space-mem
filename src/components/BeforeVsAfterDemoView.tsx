import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Play
} from 'lucide-react';
import { fetchComparisonDemo } from '../api.ts';

interface BeforeVsAfterDemoViewProps {
  onStartInvestigation: (scenario: string) => void;
  onSelectCase: (caseId: string) => void;
}

export const BeforeVsAfterDemoView: React.FC<BeforeVsAfterDemoViewProps> = ({
  onStartInvestigation,
  onSelectCase
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState('CASE-001');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchComparisonDemo(selectedCaseId)
      .then(data => {
        setComparisonData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching comparison demo:', err);
        setLoading(false);
      });
  }, [selectedCaseId]);

  const testCases = [
    { id: 'CASE-001', label: 'PCDU Voltage Instability at -25°C TVAC', type: 'pcdu_voltage' },
    { id: 'CASE-003', label: 'Reaction Wheel Tach Jitter post Vibration', type: 'reaction_wheel' },
    { id: 'CASE-004', label: 'S-Band Telemetry Packet Loss at 10W Burst', type: 'transponder' },
    { id: 'CASE-007', label: 'Star Tracker Lost Lock under Thermal Delta', type: 'star_tracker' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs mb-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>HACKATHON 60-SECOND DEMONSTRATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-['Inter'] font-light text-white tracking-tight">
            Without Memory vs. With SPACE-MEM
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Why generic AI fails in aerospace, and how persistent Hindsight memory prevents multimillion-dollar mistakes.
          </p>
        </div>

        {/* 60-Second Walkthrough Runner */}
        <button
          onClick={() => onStartInvestigation('pcdu_voltage')}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-lg shrink-0 transition-colors"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch 60-Second Demo</span>
        </button>
      </div>

      {/* Case Scenario Selector Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {testCases.map(tc => (
          <button
            key={tc.id}
            onClick={() => setSelectedCaseId(tc.id)}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer backdrop-blur-md ${
              selectedCaseId === tc.id
                ? 'bg-sky-500/25 text-sky-200 border-sky-400/50 font-bold shadow-sm'
                : 'bg-white/[0.08] text-slate-300 border-white/15 hover:text-white hover:bg-white/[0.14]'
            }`}
          >
            {tc.id}: {tc.label}
          </button>
        ))}
      </div>

      {/* Side-by-Side Comparison Container */}
      {loading ? (
        <div className="p-16 text-center font-mono text-slate-400 animate-pulse text-sm">
          Generating comparison analysis...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* COLUMN 1: WITHOUT MEMORY */}
          <div className="rounded-2xl border border-red-500/30 bg-white/[0.08] backdrop-blur-md p-6 space-y-4 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                <span className="text-xs font-mono font-bold text-red-300 flex items-center gap-2 uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>WITHOUT MEMORY — START FROM ZERO</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                  GENERIC AI RESPONSE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-mono text-red-200">
                Anomaly: {comparisonData.withoutMemory.anomalySummary}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">AI Diagnosis Output:</span>
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {comparisonData.withoutMemory.aiResponse}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-red-300 font-bold uppercase tracking-wider">Severe Operational Risks:</span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {comparisonData.withoutMemory.riskAnalysis.map((risk: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-red-500/20 text-xs font-mono text-red-200 bg-red-500/15 p-3 rounded-xl border border-red-500/30 font-medium">
              <strong>Cost of Zero Memory:</strong> {comparisonData.withoutMemory.engineeringCost}
            </div>
          </div>

          {/* COLUMN 2: WITH SPACE-MEM */}
          <div className="rounded-2xl border border-sky-400/40 bg-white/[0.08] backdrop-blur-md p-6 space-y-4 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
                <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-2 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>WITH SPACE-MEM — LEARN FROM HISTORY</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold">
                  HINDSIGHT GROUNDED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-400/30 text-xs font-mono text-sky-200 font-medium">
                {comparisonData.withSpaceMem.anomalySummary}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">SPACE-MEM Memory Reflection:</span>
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {comparisonData.withSpaceMem.aiResponse}
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-200 font-mono">
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-emerald-300 font-bold">Precedent Case: {comparisonData.withSpaceMem.evidencePrecedent}</span>
                  <button
                    onClick={() => onSelectCase(comparisonData.caseId)}
                    className="text-sky-400 hover:text-sky-300 cursor-pointer font-bold font-sans"
                  >
                    Inspect →
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-sky-400/20 text-xs font-mono text-emerald-300 bg-emerald-500/15 p-3 rounded-xl border border-emerald-500/30 font-medium">
              <strong>Advantage:</strong> {comparisonData.withSpaceMem.engineeringCost}
            </div>
          </div>
        </div>
      )}

      {/* 60-Second Demo Sequence Infographic */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-3.5 shadow-2xl">
        <h3 className="text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>60-SECOND HACKATHON DEMO WALKTHROUGH CHECKLIST</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-sky-400 font-bold block mb-1 text-xs font-mono">1. OPEN DASHBOARD</span>
            <p className="text-slate-300 text-xs font-sans">Show 12 historical spacecraft cases retained in Hindsight.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-sky-400 font-bold block mb-1 text-xs font-mono">2. SUBMIT ANOMALY</span>
            <p className="text-slate-300 text-xs font-sans">Click Scenario 1 (PCDU Voltage drop at -25°C TVAC).</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-sky-400 font-bold block mb-1 text-xs font-mono">3. RECALL &amp; REFLECT</span>
            <p className="text-slate-300 text-xs font-sans">Show "What happened last time?" &amp; gate resistor fix.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-sky-400 font-bold block mb-1 text-xs font-mono">4. RETAIN MEMORY</span>
            <p className="text-slate-300 text-xs font-sans">Save new experience to Hindsight; observe memory count increment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
