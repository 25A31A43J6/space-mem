import React, { useEffect, useState } from 'react';
import { Database, ShieldAlert, Cpu, Sparkles, Menu, Search } from 'lucide-react';
import { SystemStatus } from '../types/spaceMem.ts';

interface HeaderProps {
  status: SystemStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onOpenQuickSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-white/10 bg-white/[0.05] backdrop-blur-xl sticky top-0 z-40 transition-all shadow-lg text-slate-100">
      {/* Top Engineering Safety Notification Bar */}
      <div className="bg-amber-950/40 border-b border-amber-500/20 px-4 sm:px-6 py-1.5 text-xs flex items-center justify-between text-amber-200 backdrop-blur-md">
        <div className="flex items-center gap-2 max-w-5xl">
          <div className="w-4 h-4 rounded bg-amber-900/50 border border-amber-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
          </div>
          <span className="font-bold tracking-wider text-[11px] font-mono text-amber-300">
            ENGINEERING DECISION-SUPPORT SYSTEM:
          </span>
          <span className="text-amber-200/90 text-[11px] hidden md:inline tracking-normal font-sans">
            AI-generated analysis and recommendations must be reviewed and validated by qualified engineers before any operational decision is made. Automated spacecraft commanding is strictly prohibited.
          </span>
          <span className="text-amber-200/90 text-[11px] md:hidden font-sans">
            Qualified human engineer verification required. No autonomous commanding.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            SYS: ACTIVE
          </span>
          <span className="hidden lg:inline text-white/20">|</span>
          <span className="hidden lg:inline text-slate-300 font-mono text-[11px] tracking-tight">
            {utcTime || 'UTC 00:00:00'}
          </span>
        </div>
      </div>

      {/* Main Header Action Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Contextual Title / Quick Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="md:hidden w-9 h-9 rounded-lg bg-white/[0.08] border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new_investigation')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/25 text-slate-300 hover:text-white text-xs font-sans transition-all cursor-pointer group shadow-xs backdrop-blur-md"
            >
              <Search className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>Search Failure Memory...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] rounded bg-white/10 border border-white/15 text-slate-300 font-mono">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Right Side: High-End Engine Status Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap text-xs font-sans">
          {/* Hindsight Bank Status */}
          <div
            onClick={() => setActiveTab('historical_memory')}
            className="cursor-pointer px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all bg-white/[0.08] hover:bg-white/[0.12] border-white/15 hover:border-sky-400/50 text-slate-200 shadow-xs backdrop-blur-md"
            title={status?.hindsightConnected ? 'Hindsight Cloud Connected' : 'Demo Mode — Local engineering memory'}
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Source: <span className="font-semibold text-white">{status?.hindsightConnected ? 'Hindsight Cloud' : 'Demo Mode — Local engineering memory'}</span>
            </span>
            <span className="text-[10px] text-sky-300 font-mono font-bold">
              bank: {status?.hindsightBankId || 'space-mem-engineering'}
            </span>
          </div>

          {/* Groq AI Status */}
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.08] border border-white/15 text-slate-300 hidden md:flex items-center gap-2 shadow-xs backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-slate-300">
              LLM: <span className="font-semibold text-white">{status?.groqModel || status?.geminiModel || 'openai/gpt-oss-120b'}</span>
            </span>
          </div>

          {/* New Investigation Action button - Primary Sky Blue button in Light Theme */}
          <button
            onClick={() => setActiveTab('new_investigation')}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            <span>Investigate</span>
          </button>
        </div>
      </div>
    </header>
  );
};
