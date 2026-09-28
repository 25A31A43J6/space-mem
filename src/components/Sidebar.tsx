import React from 'react';
import {
  LayoutDashboard,
  Search,
  Database,
  FileText,
  Network,
  MessageSquareCode,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Activity,
  Zap,
  Workflow
} from 'lucide-react';
import { SystemStatus } from '../types/spaceMem.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: SystemStatus | null;
  memoryCount?: number;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onQuickScenario?: (scenario: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  status,
  memoryCount = 12,
  collapsed,
  setCollapsed,
  onQuickScenario
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
    { id: 'new_investigation', label: 'New Investigation', icon: Search, highlight: true, category: 'Investigation' },
    { id: 'memory_demo', label: 'Memory Learning Demo', icon: Workflow, highlight: true, accent: true, category: 'Judge Demo' },
    { id: 'historical_memory', label: 'Historical Memory', icon: Database, badge: memoryCount, category: 'Engineering Memory' },
    { id: 'failure_cases', label: 'Failure Cases', icon: FileText, category: 'Engineering Memory' },
    { id: 'knowledge_map', label: 'Knowledge Map', icon: Network, category: 'Intelligence' },
    { id: 'assistant', label: 'Investigation Assistant', icon: MessageSquareCode, category: 'Intelligence' },
    { id: 'demo', label: 'Before vs After (60s)', icon: Sparkles, category: 'Comparison' },
    { id: 'settings', label: 'Settings & Compliance', icon: Sliders, category: 'System' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 bg-white/[0.05] backdrop-blur-2xl border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out select-none shadow-2xl text-slate-200 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Top Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-transparent">
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center border border-sky-400/30 shadow-sm group-hover:border-sky-400 transition-all">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-['Inter'] text-base font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
                  SPACE<span className="text-sky-400">-MEM</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/15 font-medium">
                  v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate font-sans">
                Spacecraft Anomaly Memory
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-none">
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Platform Modules
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/20 text-white font-semibold border border-sky-400/40 shadow-sm backdrop-blur-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent font-normal'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? item.accent
                          ? 'text-amber-400'
                          : 'text-sky-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        isActive
                          ? 'bg-sky-500/30 text-sky-200 border-sky-400/40 font-semibold'
                          : 'bg-white/10 text-slate-300 border-white/15'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {!collapsed && item.accent && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold tracking-wider">
                      60s
                    </span>
                  )}

                  {/* Active Edge Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-sky-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Diagnostic Launchers (expanded only) */}
        {!collapsed && onQuickScenario && (
          <div className="pt-3 border-t border-white/10">
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Quick Scenarios</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-1 px-1">
              <button
                onClick={() => onQuickScenario('pcdu_voltage')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/15 transition-all font-mono truncate cursor-pointer"
              >
                ⚡ PCDU Bus Transient (87% Match)
              </button>
              <button
                onClick={() => onQuickScenario('rw_friction')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/15 transition-all font-mono truncate cursor-pointer"
              >
                🔄 RW-2 Tachometer Spike
              </button>
              <button
                onClick={() => onQuickScenario('transponder_lock')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] border border-transparent hover:border-white/15 transition-all font-mono truncate cursor-pointer"
              >
                📡 X-Band PLL Unlock Drift
              </button>
            </div>
          </div>
        )}

        {/* Hindsight Memory Card in Sidebar in Dark Glass */}
        {!collapsed && (
          <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                Hindsight Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              Bank: <span className="text-sky-300 font-medium">{status?.hindsightBankId || 'space-mem-engineering'}</span>
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/10 font-sans">
              <span>Retained Memories:</span>
              <span className="text-white font-mono font-bold">{status?.totalHistoricalCases || 12}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom User / Safety Footprint */}
      <div className="p-3 border-t border-white/10 bg-transparent shrink-0">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[10px] font-mono leading-tight">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>DECISION-SUPPORT ONLY • HUMAN VALIDATION</span>
            </div>
            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-400">
              <span>STATUS: NOMINAL</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="System Status: Online" />
          </div>
        )}
      </div>
    </aside>
  );
};
