import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Database,
  Cpu,
  RotateCcw,
  CheckCircle2,
  Download,
  ShieldAlert,
  Key,
  Award,
  BookOpen,
  Workflow,
  AlertTriangle
} from 'lucide-react';
import { resetDemoData, fetchAllCases, validateHackathonRequirements } from '../api.ts';
import { SystemStatus, HackathonValidationReport } from '../types/spaceMem.ts';

interface SettingsViewProps {
  status: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ status, onRefreshStatus }) => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [rawJson, setRawJson] = useState<string>('');
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<HackathonValidationReport | null>(null);

  useEffect(() => {
    fetchAllCases().then(cases => {
      setRawJson(JSON.stringify(cases, null, 2));
    });
  }, [resetSuccess]);

  const handleRunValidation = async () => {
    setValidating(true);
    try {
      const rep = await validateHackathonRequirements();
      setValidationReport(rep);
    } catch (err: any) {
      alert('Validation check failed: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset memory bank to default 12 historical spacecraft cases?')) return;
    setResetting(true);
    try {
      await resetDemoData();
      setResetSuccess(true);
      setResetting(false);
      onRefreshStatus();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
      setResetting(false);
    }
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([rawJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `space-mem-engineering-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs mb-1.5 font-bold">
          <Sliders className="w-3.5 h-3.5" />
          <span>SYSTEM CONFIGURATION &amp; MEMORY ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-['Inter'] font-light text-white tracking-tight">
          Settings &amp; Environment Status
        </h1>
        <p className="text-sm text-slate-300 mt-1">
          Manage Hindsight Cloud connectivity, Groq LLM reasoning engine, and memory persistence.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3 shadow-lg backdrop-blur-md">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-amber-300 font-bold block mb-1">
            ENGINEERING DECISION-SUPPORT SYSTEM DISCLAIMER
          </strong>
          <span className="font-sans leading-relaxed text-slate-300">
            SPACE-MEM is designed to assist satellite and spacecraft engineers by recalling previous anomaly investigations.
            All AI-generated recommendations must be verified by qualified engineers. Automated commanding or modification is strictly prohibited.
          </span>
        </div>
      </div>

      {/* Section 30 & 31: Hackathon Requirement Validation & Health Check */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-indigo-400/30 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Hackathon Requirement Compliance Verification (Section 30 &amp; 31)
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Live automated test suite verifying RETAIN, RECALL, REFLECT, bank directives, provenance, and security.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunValidation}
            disabled={validating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>{validating ? 'Running 10 Tests...' : 'Run 10-Point Verification'}</span>
          </button>
        </div>

        {validationReport && (
          <div className="space-y-3 animate-fade-in pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  validationReport.overallStatus === 'PASS'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {validationReport.overallStatus}
                </span>
                <span className="text-white font-bold">
                  {validationReport.totalPassed} / {validationReport.checks.length} CHECKS PASSED
                </span>
              </div>
              <span className="text-slate-400 text-[10px]">
                Audited: {new Date(validationReport.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {validationReport.checks.map(check => (
                <div
                  key={check.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-white font-semibold text-[11px] flex items-center gap-1.5 font-sans">
                      <span className={check.status === 'PASS' ? 'text-emerald-400' : 'text-red-400'}>
                        {check.status === 'PASS' ? '✓' : '✗'}
                      </span>
                      <span>{check.title}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      check.status === 'PASS' ? 'text-emerald-300 bg-emerald-500/10' : 'text-red-300 bg-red-500/10'
                    }`}>
                      {check.status} ({check.latencyMs}ms)
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                    {check.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 27: Bank Mission & Reflection Directives */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>Hindsight Bank Mission &amp; Directives (Section 27)</span>
          </span>
          <span className="text-xs font-mono text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded font-bold">
            CONSTRAINED REFLECTION
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 text-xs">
          <span className="font-mono text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
            Bank Mission Statement:
          </span>
          <p className="text-white font-medium italic leading-relaxed bg-white/[0.03] p-3 rounded-lg border border-white/10">
            “You are the long-term engineering memory for SPACE-MEM. Prioritize confirmed spacecraft engineering experience, failure investigations, validated root causes, corrective actions, test conditions, outcomes, and lessons learned. Never treat an unconfirmed AI hypothesis as established engineering knowledge.”
          </p>
        </div>

        <div className="space-y-1.5 text-xs">
          <span className="font-mono text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
            7 Mandatory Engineering Directives:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
            {[
              'Always distinguish historical evidence from hypotheses.',
              'Never fabricate historical cases.',
              'Prefer confirmed engineering experience.',
              'Preserve provenance of recalled memories.',
              'Require human validation before operational decisions.',
              'Do not treat simulated data as real-world evidence.',
              'Do not convert similarity scores into probability of correctness.'
            ].map((directive, idx) => (
              <div key={idx} className="flex items-start gap-1.5 bg-white/[0.03] p-2.5 rounded-lg border border-white/10">
                <span className="text-sky-400 font-bold shrink-0">{idx + 1}.</span>
                <span>{directive}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hindsight Status Panel */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Database className="w-4 h-4" />
            </div>
            <span>Hindsight Cloud Memory Engine</span>
          </span>
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded font-bold border ${
            status?.hindsightConnected
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
          }`}>
            {status?.hindsightConnected ? 'HINDSIGHT CONNECTED' : 'DEMO MODE ACTIVE'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <span className="text-slate-400 block text-[10px] mb-1 font-sans font-semibold">MEMORY BANK ID</span>
            <span className="text-sky-300 text-sm font-bold">{status?.hindsightBankId || 'space-mem-engineering'}</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <span className="text-slate-400 block text-[10px] mb-1 font-sans font-semibold">BASE URL</span>
            <span className="text-white truncate block font-medium">{status?.hindsightBaseUrl || 'https://api.hindsightcloud.com'}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 text-xs space-y-1.5 text-slate-300">
          <p className="font-bold text-white font-sans flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-sky-400" />
            <span>Environment Variable Configuration:</span>
          </p>
          <p className="text-slate-300 text-xs font-sans leading-relaxed">
            To connect directly to Hindsight Cloud, set <code className="text-sky-300 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/15 font-semibold">HINDSIGHT_API_KEY</code>, <code className="text-sky-300 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/15 font-semibold">HINDSIGHT_BASE_URL</code>, and <code className="text-sky-300 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/15 font-semibold">HINDSIGHT_BANK_ID</code> in server secrets.
            If unset, the app runs in fully operational <strong className="text-white font-semibold">Demo Mode</strong> with local persistence across RETAIN, RECALL, and REFLECT.
          </p>
        </div>
      </div>

      {/* Groq LLM Engine Status */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <span>Groq Reasoning Engine</span>
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold">
            ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <span className="text-slate-400 block text-[10px] mb-1 font-sans font-semibold">ACTIVE MODEL</span>
            <span className="text-white text-sm font-bold">{status?.groqModel || status?.geminiModel || 'openai/gpt-oss-120b'}</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <span className="text-slate-400 block text-[10px] mb-1 font-sans font-semibold">LLM STATUS</span>
            <span className="text-emerald-400 font-bold font-sans">
              {status?.groqConnected ? 'Connected (Server-Side Groq API)' : 'Configured (Server-Side)'}
            </span>
          </div>
        </div>
      </div>

      {/* Reset & Memory Export */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-sans text-sm font-bold text-white">
            Memory Bank Management &amp; Backup
          </span>
          <span className="text-xs font-mono text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2.5 py-0.5 rounded font-bold">
            {status?.totalHistoricalCases || 12} Cases in Bank
          </span>
        </div>

        {resetSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-sm backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Memory bank reset to 12 default spacecraft engineering failure cases!</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 hover:border-white/25 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Memory Bank JSON</span>
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>{resetting ? 'Resetting...' : 'Reset to Default 12 Cases'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
