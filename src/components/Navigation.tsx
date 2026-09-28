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
  Layers,
  Workflow
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  memoryCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, memoryCount = 12 }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_investigation', label: 'New Investigation', icon: Search, highlight: true },
    { id: 'memory_demo', label: 'Learning Demo', icon: Workflow, highlight: true, accent: true },
    { id: 'historical_memory', label: 'Historical Memory', icon: Database, badge: memoryCount },
    { id: 'failure_cases', label: 'Failure Cases', icon: FileText },
    { id: 'knowledge_map', label: 'Knowledge Map', icon: Network },
    { id: 'assistant', label: 'Investigation Assistant', icon: MessageSquareCode },
    { id: 'demo', label: 'Before vs After', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="bg-[#05070d]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-[73px] z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none py-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.18)] font-semibold'
                      : item.accent
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-semibold'
                      : 'bg-white/[0.08] text-white border border-white/15 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive 
                    ? item.accent ? 'text-amber-400' : 'text-cyan-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.accent && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold tracking-wider">
                    60s
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
