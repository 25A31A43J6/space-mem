import React, { useEffect, useState } from 'react';
import {
  Search,
  Database,
  FileText,
  MessageSquareCode,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
  Layers,
  Thermometer,
  ShieldCheck,
  Workflow,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { fetchStats } from '../api.ts';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onSelectCase: (caseId: string) => void;
  onStartAnalysisWithScenario: (scenarioType: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onSelectCase,
  onStartAnalysisWithScenario
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans text-slate-100">
      {/* Hero Banner Section in Dark Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-7 sm:p-9 shadow-2xl">
        {/* Subtle aerospace orbital ambient glow */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28"></div>
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Orbital curved SVG path micro-element */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="85%" cy="30%" rx="350" ry="180" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 8" />
          <ellipse cx="85%" cy="30%" rx="480" ry="240" fill="none" stroke="#94a3b8" strokeWidth="0.75" />
          <circle cx="68%" cy="22%" r="4" fill="#38bdf8" />
          <circle cx="68%" cy="22%" r="10" fill="none" stroke="#38bdf8" strokeWidth="0.5" className="animate-ping" style={{ animationDuration: '3s' }} />
        </svg>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-xs font-mono mb-4 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
            </span>
            <span className="tracking-wider uppercase font-semibold text-[11px] text-sky-300">FLIGHT ANOMALY MEMORY ARCHITECTURE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-['Inter'] font-light tracking-tight text-white mb-3 leading-[1.18]">
            SPACE-MEM: Remember Every Failure.<br />
            <span className="font-semibold text-sky-400">
              Diagnose the Next One Faster.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed max-w-3xl font-normal">
            An AI-powered engineering memory platform that stores historical spacecraft failure cases, symptoms, root causes, and corrective actions in a persistent <strong className="text-white font-semibold">Hindsight</strong> bank.
            Every spacecraft failure becomes experience for the next spacecraft.
          </p>

          {/* Primary Action Buttons in Dark Glass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveTab('new_investigation')}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-sans"
            >
              <Search className="w-4 h-4 text-sky-100" />
              <span>Analyze New Failure</span>
            </button>

            <button
              onClick={() => setActiveTab('historical_memory')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 hover:border-white/25 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-sm backdrop-blur-md"
            >
              <Database className="w-4 h-4 text-sky-400" />
              <span>Historical Memory</span>
            </button>

            <button
              onClick={() => setActiveTab('failure_cases')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 hover:border-white/25 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-sm backdrop-blur-md"
            >
              <FileText className="w-4 h-4 text-slate-300" />
              <span>Failure Cases</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 hover:border-white/25 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-sm backdrop-blur-md"
            >
              <MessageSquareCode className="w-4 h-4 text-indigo-400" />
              <span>Investigation Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Engineering Memory Highlight: Hindsight Recall Loop */}
      <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-6 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white font-sans">
                Hindsight Engineering Memory Architecture
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Continuous knowledge preservation loop across satellite assembly, integration, testing, and flight
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono px-3 py-1 rounded-lg border font-semibold ${
              stats?.hindsightConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
            }`}>
              SOURCE: {stats?.hindsightConnected ? 'HINDSIGHT CLOUD' : 'DEMO MODE — Local engineering memory'}
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/15 font-medium">
              bank: <strong className="text-sky-300">{stats?.hindsightBankId || 'space-mem-engineering'}</strong>
            </span>
          </div>
        </div>

        {/* Closed-Loop Learning Process: 8-Stage Cycle */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-sky-400" />
              <span>Closed-Loop Engineering Memory Lifecycle</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
              HINDSIGHT-FIRST INVESTIGATION RULE ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-white/10 space-y-1">
              <div className="font-mono text-[10px] text-sky-400 font-bold">STAGE 1</div>
              <div className="font-medium text-white text-[11px] leading-tight">CURRENT ANOMALY</div>
              <div className="text-[9px] text-slate-400">Telemetry &amp; Symptoms</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-sky-400/30 bg-sky-500/10 space-y-1">
              <div className="font-mono text-[10px] text-sky-300 font-bold">STAGE 2</div>
              <div className="font-medium text-sky-200 text-[11px] leading-tight">HINDSIGHT RECALL</div>
              <div className="text-[9px] text-sky-300/80">Semantic &amp; Vector Query</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-white/10 space-y-1">
              <div className="font-mono text-[10px] text-indigo-400 font-bold">STAGE 3</div>
              <div className="font-medium text-white text-[11px] leading-tight">EVIDENCE ANALYSIS</div>
              <div className="text-[9px] text-slate-400">Classify Historical Facts</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-white/10 space-y-1">
              <div className="font-mono text-[10px] text-indigo-400 font-bold">STAGE 4</div>
              <div className="font-medium text-white text-[11px] leading-tight">AI REFLECTION</div>
              <div className="text-[9px] text-slate-400">Hypotheses &amp; Risks</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-amber-500/30 bg-amber-500/10 space-y-1">
              <div className="font-mono text-[10px] text-amber-400 font-bold">STAGE 5</div>
              <div className="font-medium text-amber-200 text-[11px] leading-tight">ENGINEER VALIDATION</div>
              <div className="text-[9px] text-amber-300/80">Human-In-The-Loop Sign-Off</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-white/10 space-y-1">
              <div className="font-mono text-[10px] text-emerald-400 font-bold">STAGE 6</div>
              <div className="font-medium text-white text-[11px] leading-tight">CONFIRMED CAUSE</div>
              <div className="text-[9px] text-slate-400">Tested Ground Workaround</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-emerald-400/30 bg-emerald-500/10 space-y-1">
              <div className="font-mono text-[10px] text-emerald-300 font-bold">STAGE 7</div>
              <div className="font-medium text-emerald-200 text-[11px] leading-tight">HINDSIGHT RETAIN</div>
              <div className="text-[9px] text-emerald-300/80">Durable Bank Ingestion</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.05] border border-white/10 space-y-1">
              <div className="font-mono text-[10px] text-sky-400 font-bold">STAGE 8</div>
              <div className="font-medium text-white text-[11px] leading-tight">FUTURE PRECEDENTS</div>
              <div className="text-[9px] text-slate-400">Instant Recall Next Flight</div>
            </div>
          </div>
        </div>

        {/* 3 Core Hindsight Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10 space-y-1.5 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sky-400 font-bold uppercase text-[11px] tracking-wider">1. RETAIN</span>
              <span className="text-[10px] font-mono text-slate-400">Persistent Memory</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-sans">Ingest Anomaly Experience</h3>
            <p className="text-slate-300 font-sans leading-relaxed text-xs">
              Every completed failure investigation—including symptoms, confirmed root cause, what worked, and what failed first—is committed to Hindsight Cloud.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10 space-y-1.5 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-indigo-400 font-bold uppercase text-[11px] tracking-wider">2. RECALL</span>
              <span className="text-[10px] font-mono text-slate-400">Semantic Precedents</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-sans">Match Past Anomaly Precedents</h3>
            <p className="text-slate-300 font-sans leading-relaxed text-xs">
              When a component drops voltage, draws high motor current, or loses transponder lock, RECALL correlates telemetry vectors with historical ground cases.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.06] border border-white/10 space-y-1.5 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold uppercase text-[11px] tracking-wider">3. REFLECT</span>
              <span className="text-[10px] font-mono text-slate-400">Groq Synthesis</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-sans">Generate Actionable Guidance</h3>
            <p className="text-slate-300 font-sans leading-relaxed text-xs">
              Synthesizes previous successful workarounds and flags failed hypotheses so test engineers avoid repeating costly diagnostic mistakes.
            </p>
          </div>
        </div>
      </div>

      {/* System Overview Metrics in Dark Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-sans">
            <span className="font-medium">Total Cases</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {loading ? '...' : stats?.totalCases || 12}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">verified ground cases</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-sans">
            <span className="font-medium">Resolved Cases</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            {loading ? '...' : stats?.resolvedCases || 12}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">validated fixes</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-sans">
            <span className="font-medium">Subsystems</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {loading ? '...' : stats?.subsystemsCount || 8}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">EPS, ADCS, TT&amp;C, etc.</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-sans">
            <span className="font-medium">TVAC Anomaly Cases</span>
            <Thermometer className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {loading ? '...' : stats?.tvacCases || 5}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">thermal vacuum tests</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-sans">
            <span className="font-medium">Vibe &amp; Acoustic</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {loading ? '...' : stats?.vibeCases || 3}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">structural resonance</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-sans">
            <span className="font-medium">Diagnostic Speed</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            -82%
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-0.5">time to first root cause</span>
        </div>
      </div>

      {/* Main Grid: Recent Anomalies & Quick Scenario Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Historical Anomaly Cases List */}
        <div className="lg:col-span-2 rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-white">
                Recent Spacecraft Anomaly Records
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('historical_memory')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer font-sans transition-colors"
            >
              <span>View all {stats?.totalCases || 12} cases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/10">
            {(stats?.recentCases || []).map((item: any) => (
              <div
                key={item.id}
                onClick={() => onSelectCase(item.id)}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.06] -mx-2 px-3 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                      {item.id}
                    </span>
                    <span className="text-xs text-slate-300 font-sans">{item.satellite} • {item.subsystem}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      item.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-white/10 text-slate-300 border border-white/15'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium truncate font-sans group-hover:text-sky-400 transition-colors">{item.failureMode}</p>
                  <p className="text-xs text-slate-400 font-sans">Component: <span className="text-slate-200 font-medium">{item.component}</span></p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded font-semibold inline-block mb-1">
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono block">{item.detectedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1-Click Anomaly Investigation Launcher in Dark Glass */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-white">
              Instant Hackathon Demo Scenarios
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Test the complete Hindsight RECALL &amp; REFLECT loop with one click using realistic aerospace anomaly data:
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => onStartAnalysisWithScenario('pcdu_voltage')}
              className="w-full text-left p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer group shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1">
                <span className="font-bold">SCENARIO 1 (POWER BUS)</span>
                <span className="text-sky-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">Run →</span>
              </div>
              <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors font-sans">
                PCDU Bus Voltage Instability at -25°C TVAC
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                Matches CASE-001 &amp; CASE-006. Demonstrates gate driver oscillation diagnosis.
              </div>
            </button>

            <button
              onClick={() => onStartAnalysisWithScenario('reaction_wheel')}
              className="w-full text-left p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer group shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1">
                <span className="font-bold">SCENARIO 2 (ADCS)</span>
                <span className="text-sky-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">Run →</span>
              </div>
              <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors font-sans">
                Reaction Wheel Jitter post Random Vibe
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                Matches CASE-003. Recalls wave spring relaxation vs encoder board error.
              </div>
            </button>

            <button
              onClick={() => onStartAnalysisWithScenario('transponder')}
              className="w-full text-left p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer group shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1">
                <span className="font-bold">SCENARIO 3 (TT&amp;C)</span>
                <span className="text-sky-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">Run →</span>
              </div>
              <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors font-sans">
                S-Band Transponder Frame Drops at 10W
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                Matches CASE-004. RF chassis ground loop vs diplexer isolation failure.
              </div>
            </button>

            <button
              onClick={() => onStartAnalysisWithScenario('star_tracker')}
              className="w-full text-left p-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer group shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center justify-between text-xs font-mono text-sky-400 mb-1">
                <span className="font-bold">SCENARIO 4 (OPTICAL SENSOR)</span>
                <span className="text-sky-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">Run →</span>
              </div>
              <div className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors font-sans">
                Star Tracker Lost Lock under Thermal Gradient
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                Matches CASE-007. Kinematic flexure mount vs optical stray light.
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
