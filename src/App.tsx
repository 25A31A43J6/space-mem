import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { NewInvestigationView } from './components/NewInvestigationView.tsx';
import { InvestigationReportView } from './components/InvestigationReportView.tsx';
import { HistoricalMemoryView } from './components/HistoricalMemoryView.tsx';
import { FailureCasesView } from './components/FailureCasesView.tsx';
import { KnowledgeMapView } from './components/KnowledgeMapView.tsx';
import { AssistantChatView } from './components/AssistantChatView.tsx';
import { BeforeVsAfterDemoView } from './components/BeforeVsAfterDemoView.tsx';
import { MemoryLearningDemoView } from './components/MemoryLearningDemoView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { CaseDetailModal } from './components/CaseDetailModal.tsx';
import { fetchSystemStatus } from './api.ts';
import { SystemStatus, AnalysisResult } from './types/spaceMem.ts';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Active investigation result
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);

  // Direct case inspecting modal
  const [inspectingCaseId, setInspectingCaseId] = useState<string | null>(null);

  // Selected case for FailureCases tab
  const [selectedFailureCaseId, setSelectedFailureCaseId] = useState<string | null>(null);

  // Quick scenario pre-loader
  const [activeScenario, setActiveScenario] = useState<string | undefined>(undefined);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full-screen Background Video Reference & Autoplay Handler
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Background video autoplay restricted by browser policy; starts muted with poster fallback:', err);
        });
      }
    }
  }, []);

  const loadStatus = () => {
    fetchSystemStatus()
      .then(data => setSystemStatus(data))
      .catch(err => console.error('Failed to fetch status:', err));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleStartAnalysisWithScenario = (scenario: string) => {
    setActiveScenario(scenario);
    setActiveTab('new_investigation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLatestAnalysis(result);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectCase = (caseId: string) => {
    setInspectingCaseId(caseId);
  };

  const handleNavigateToFailureCase = (caseId: string) => {
    setSelectedFailureCaseId(caseId);
    setActiveTab('failure_cases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExperienceSaved = (retainedCaseId: string) => {
    loadStatus();
    setToastMessage(`Experience formally retained into Hindsight bank as ${retainedCaseId}. System memory updated.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-['Inter',sans-serif] selection:bg-sky-500/20 selection:text-sky-950 relative overflow-x-hidden">
      {/* Layer 1: Full-Screen Background Video */}
      <video
        ref={videoRef}
        className="background-video"
        autoPlay
        muted
        loop
        playsInline
        poster="/space-bg.jpg"
      >
        <source src="/your-uploaded-video.mp4" type="video/mp4" />
        <source src="/background-video.mp4" type="video/mp4" />
        <source src="/space-bg.mp4" type="video/mp4" />
        <source src="/space-video.mp4" type="video/mp4" />
        {/* Graceful image fallback */}
        <img
          src="/space-bg.jpg"
          alt="Space Earth Orbit"
          className="w-full h-full object-cover"
        />
      </video>

      {/* Layer 2: Dark Transparent Overlay */}
      <div className="video-overlay background-overlay" />

      {/* Layer 3: Existing Prototype UI */}
      <div className="app-content min-h-screen flex relative w-full">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/85 border border-emerald-500/40 text-emerald-200 px-5 py-3.5 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-3 backdrop-blur-xl animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="font-medium text-slate-100">{toastMessage}</span>
          </div>
        )}

        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          status={systemStatus}
          memoryCount={systemStatus?.totalHistoricalCases || 12}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onQuickScenario={handleStartAnalysisWithScenario}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
          }`}
        >
        {/* Top Header */}
        <Header
          status={systemStatus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onSelectCase={handleInspectCase}
              onStartAnalysisWithScenario={handleStartAnalysisWithScenario}
            />
          )}

          {activeTab === 'new_investigation' && (
            <NewInvestigationView
              onAnalysisComplete={handleAnalysisComplete}
              initialScenario={activeScenario}
            />
          )}

          {activeTab === 'report' && latestAnalysis && (
            <InvestigationReportView
              result={latestAnalysis}
              onSelectCase={handleInspectCase}
              onNewInvestigation={() => setActiveTab('new_investigation')}
              onExperienceSaved={handleExperienceSaved}
            />
          )}

          {activeTab === 'historical_memory' && (
            <HistoricalMemoryView
              onSelectCase={handleInspectCase}
              onAnalyzeNew={() => setActiveTab('new_investigation')}
            />
          )}

          {activeTab === 'failure_cases' && (
            <FailureCasesView
              selectedCaseId={selectedFailureCaseId}
              onSelectCase={handleInspectCase}
              onAnalyzeNew={() => setActiveTab('new_investigation')}
            />
          )}

          {activeTab === 'knowledge_map' && (
            <KnowledgeMapView
              onSelectCase={handleInspectCase}
              onAnalyzeNew={() => setActiveTab('new_investigation')}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantChatView
              onSelectCase={handleInspectCase}
            />
          )}

          {activeTab === 'memory_demo' && (
            <MemoryLearningDemoView
              onSelectCase={handleInspectCase}
              onRefreshGlobalStatus={loadStatus}
            />
          )}

          {activeTab === 'demo' && (
            <BeforeVsAfterDemoView
              onStartInvestigation={handleStartAnalysisWithScenario}
              onSelectCase={handleNavigateToFailureCase}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              status={systemStatus}
              onRefreshStatus={loadStatus}
            />
          )}
        </main>

        {/* Mission Control Futuristic Glass Footer */}
        <footer className="border-t border-white/10 bg-white/[0.04] backdrop-blur-md py-5 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-normal text-slate-300">
              <span className="text-white font-semibold tracking-tight">SPACE-MEM</span> — Spacecraft Failure Memory &amp; Investigation Assistant
            </div>
            <div className="text-[12px] text-slate-400 font-sans">
              Persistent Memory Engine: <strong className="text-sky-400 font-medium">Hindsight Cloud</strong> (<span className="font-mono text-[11px] text-slate-300">bank: space-mem-engineering</span>) • Model: <strong className="text-slate-300 font-medium">{systemStatus?.groqModel || 'Groq (openai/gpt-oss-120b)'}</strong>
            </div>
            <div className="text-amber-300 text-[10px] px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-500/30 font-medium font-mono">
              SIMULATED ENGINEERING DATA • QUALIFIED HUMAN VALIDATION REQUIRED
            </div>
          </div>
        </footer>
      </div>

      {/* Case Detail Dossier Modal */}
      <CaseDetailModal
        caseId={inspectingCaseId}
        onClose={() => setInspectingCaseId(null)}
      />
      </div>
    </div>
  );
};

export default App;
