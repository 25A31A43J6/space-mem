import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  ArrowRight
} from 'lucide-react';
import { fetchAllCases } from '../api.ts';
import { HistoricalFailureCase } from '../types/spaceMem.ts';

interface HistoricalMemoryViewProps {
  onSelectCase: (caseId: string) => void;
  onAnalyzeNew: () => void;
}

export const HistoricalMemoryView: React.FC<HistoricalMemoryViewProps> = ({
  onSelectCase,
  onAnalyzeNew
}) => {
  const [cases, setCases] = useState<HistoricalFailureCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [testTypeFilter, setTestTypeFilter] = useState('ALL');

  const loadCases = () => {
    setLoading(true);
    fetchAllCases({
      subsystem: subsystemFilter !== 'ALL' ? subsystemFilter : undefined,
      severity: severityFilter !== 'ALL' ? severityFilter : undefined,
      testType: testTypeFilter !== 'ALL' ? testTypeFilter : undefined,
      search: search.trim() ? search.trim() : undefined
    })
      .then(data => {
        setCases(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching historical cases:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCases();
  }, [subsystemFilter, severityFilter, testTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-xs mb-1.5 font-bold">
            <Database className="w-3.5 h-3.5" />
            <span>HINDSIGHT MEMORY BANK: space-mem-engineering</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-['Inter'] font-light text-white tracking-tight">
            Engineering Memory &amp; Historical Failures
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Persistent repository of spacecraft anomalies, root causes, corrective actions, and lessons learned.
          </p>
        </div>

        <button
          onClick={onAnalyzeNew}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-lg shrink-0 transition-colors"
        >
          <Search className="w-4 h-4 text-sky-100" />
          <span>Match a New Failure</span>
        </button>
      </div>

      {/* Filter and Search Bar in Dark Glass */}
      <div className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search historical failures, components, symptoms..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 font-sans shadow-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-semibold font-sans">Subsystem Filter</label>
            <select
              value={subsystemFilter}
              onChange={e => setSubsystemFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/15 text-slate-200 focus:outline-none focus:border-sky-400 font-sans"
            >
              <option value="ALL">All Subsystems</option>
              <option value="Electrical Power (EPS)">Electrical Power (EPS)</option>
              <option value="Attitude & Orbit Control (ADCS)">Attitude & Orbit Control (ADCS)</option>
              <option value="Telemetry & Telecommand (TT&C)">Telemetry & Telecommand (TT&C)</option>
              <option value="Thermal Control (TCS)">Thermal Control (TCS)</option>
              <option value="On-Board Computer (OBC)">On-Board Computer (OBC)</option>
              <option value="Propulsion (PROP)">Propulsion (PROP)</option>
              <option value="Optical Payload (PL)">Optical Payload (PL)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-semibold font-sans">Severity Filter</label>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/15 text-slate-200 focus:outline-none focus:border-sky-400 font-sans"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1 font-semibold font-sans">Test Type Filter</label>
            <select
              value={testTypeFilter}
              onChange={e => setTestTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/15 text-slate-200 focus:outline-none focus:border-sky-400 font-sans"
            >
              <option value="ALL">All Test Regimes</option>
              <option value="Thermal Vacuum (TVAC)">Thermal Vacuum (TVAC)</option>
              <option value="Vibration & Acoustic Test">Vibration & Acoustic Test</option>
              <option value="Hardware-in-the-Loop (HIL)">Hardware-in-the-Loop (HIL)</option>
              <option value="EMI/EMC Qualification">EMI/EMC Qualification</option>
              <option value="Thermal Cycling">Thermal Cycling</option>
              <option value="Integrated System Test">Integrated System Test</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memory Library Cards in Dark Glass */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-sm animate-pulse">
          Querying Hindsight memory bank...
        </div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-2 shadow-2xl">
          <p className="text-white font-medium">No matching historical memory cases found.</p>
          <button
            onClick={() => {
              setSearch('');
              setSubsystemFilter('ALL');
              setSeverityFilter('ALL');
              setTestTypeFilter('ALL');
            }}
            className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 hover:border-sky-400/50 hover:bg-white/[0.12] hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-lg"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded border border-sky-400/30">
                      {c.id}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">{c.satellite}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    c.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    c.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-white/10 text-slate-300 border border-white/15'
                  }`}>
                    {c.severity}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    {c.component}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {c.subsystem} • {c.testType}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs space-y-1">
                  <div className="text-slate-300">
                    <span className="font-semibold text-white">Failure:</span> {c.failureMode}
                  </div>
                  <div className="text-slate-400 truncate">
                    <span className="font-semibold text-slate-200">Root Cause:</span> {c.investigation.rootCause}
                  </div>
                  <div className="text-emerald-300 font-medium truncate">
                    <span className="font-semibold text-white">Corrective:</span> {c.correctiveAction.actionAttempted}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono">{c.date}</span>
                <span className="text-sky-400 font-semibold group-hover:text-sky-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  <span>Inspect Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
