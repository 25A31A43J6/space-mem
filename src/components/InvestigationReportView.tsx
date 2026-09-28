import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Database,
  ArrowRight,
  BookmarkCheck,
  AlertTriangle,
  Lightbulb,
  FileText,
  Save,
  ExternalLink,
  Zap,
  RotateCcw,
  Check,
  Scale,
  Workflow,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { AnalysisResult, SaveExperiencePayload } from '../types/spaceMem.ts';
import { retainExperience } from '../api.ts';

interface InvestigationReportViewProps {
  result: AnalysisResult;
  onSelectCase: (caseId: string) => void;
  onNewInvestigation: () => void;
  onExperienceSaved: (retainedCaseId: string) => void;
}

export const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  result,
  onSelectCase,
  onNewInvestigation,
  onExperienceSaved
}) => {
  const [saveFormOpen, setSaveFormOpen] = useState(false);
  const [savingExperience, setSavingExperience] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [engineerConfirmed, setEngineerConfirmed] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ALL' | 'HISTORICAL' | 'HYPOTHESIS' | 'VALIDATION'>('ALL');
  const [showDirectives, setShowDirectives] = useState(false);

  const [saveData, setSaveData] = useState<SaveExperiencePayload>({
    caseId: `CASE-${Date.now().toString().slice(-4)}`,
    satellite: result.currentAnomaly.satellite,
    subsystem: result.currentAnomaly.subsystem,
    component: result.currentAnomaly.component,
    componentType: 'Space-Qualified Subassembly',
    testType: 'Thermal Vacuum (TVAC)',
    failureMode: result.currentAnomaly.failureMode,
    confirmedRootCause: result.whatHappenedLastTime.previousRootCause === 'No historical memory found.'
      ? ''
      : result.whatHappenedLastTime.previousRootCause,
    correctiveActionTaken: result.whatHappenedLastTime.previousCorrectiveAction === 'Perform first-principles bench characterization.'
      ? ''
      : result.whatHappenedLastTime.previousCorrectiveAction,
    outcome: 'RESOLVED',
    whatWorked: result.whatHappenedLastTime.previousOutcome,
    whatFailed: result.whatHappenedLastTime.previousWhatFailedFirst,
    lessonsLearned: result.whatHappenedLastTime.keyLessonLearned,
    checkFirstNextTime: 'Verify thermal/voltage dependency early in diagnosis cycle.',
    engineerName: 'Lead Systems Engineer',
    caseStatus: 'CONFIRMED',
    engineerValidated: true
  });

  const handleRetainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMessage(null);

    if (!engineerConfirmed) {
      setSaveErrorMessage('Engineer validation sign-off is required. Please check the confirmation box below to verify that this case contains confirmed engineering knowledge.');
      return;
    }

    setSavingExperience(true);
    try {
      const res = await retainExperience({
        ...saveData,
        engineerValidated: true,
        caseStatus: 'CONFIRMED'
      });
      setSavingExperience(false);
      setSaveSuccessMessage(
        res.lifecycleMessage ||
          `Successfully retained into Hindsight bank (${res.source}) as ${res.case.id}! Future investigations will now benefit from this precedent.`
      );
      onExperienceSaved(res.case.id);
    } catch (err: any) {
      console.error('Error retaining experience:', err);
      setSavingExperience(false);
      setSaveErrorMessage(err.message || 'Failed to save experience into memory bank.');
    }
  };

  const isCloudMemory = result.memorySource === 'HINDSIGHT CLOUD';

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12 font-sans text-slate-100">
      {/* Investigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-2xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
            </span>
            <span className="font-bold tracking-wider text-sky-400">INVESTIGATION REPORT #{result.investigationId}</span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400 font-sans">{new Date(result.generatedAt).toLocaleString()}</span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400 font-mono text-[11px]">AUDIT: #{result.auditId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-['Inter'] font-light text-white tracking-tight">
            Anomaly Correlation &amp; Memory Analysis
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Memory Source Badge */}
          <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
            isCloudMemory
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-sky-500/20 text-sky-300 border-sky-400/40'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>{isCloudMemory ? 'MEMORY SOURCE: HINDSIGHT CLOUD' : 'MEMORY SOURCE: LOCAL DEMO MEMORY'}</span>
          </span>

          <button
            onClick={onNewInvestigation}
            className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm font-sans backdrop-blur-md"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>New Investigation</span>
          </button>

          <button
            onClick={() => setSaveFormOpen(!saveFormOpen)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-colors font-sans"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>SAVE THIS EXPERIENCE</span>
          </button>
        </div>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5 shadow-md backdrop-blur-md font-sans">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-medium">
          {result.safetyNotice || result.disclaimer}
        </span>
      </div>

      {/* Section 10: Contradiction Detection Alert */}
      {result.conflictingEvidence?.detected && (
        <div className="p-5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-100 space-y-3 shadow-xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>CONFLICTING HISTORICAL EVIDENCE DETECTED</span>
          </div>
          <p className="text-xs sm:text-sm font-sans leading-relaxed text-amber-200">
            {result.conflictingEvidence.statement}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {result.conflictingEvidence.conflicts.map((c, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30 text-xs space-y-1">
                <span className="font-mono text-amber-300 font-bold block">{c.caseId} Observation:</span>
                <p className="text-slate-300 font-sans">{c.observation}</p>
                <div className="text-amber-200 font-mono text-[11px] pt-1">{c.conclusion}</div>
                <span className="text-[10px] text-emerald-300 block font-mono">Outcome: {c.outcome}</span>
              </div>
            ))}
          </div>

          <div className="text-right text-[11px] font-mono text-amber-300 font-bold">
            HUMAN-IN-THE-LOOP: Engineer review is required to determine applicability to current flight hardware.
          </div>
        </div>
      )}

      {/* 1. TOP SECTION: CURRENT ANOMALY */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-xs uppercase tracking-wider text-white font-bold flex items-center gap-2 font-mono">
            <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <FileText className="w-4 h-4" />
            </div>
            <span>CURRENT ANOMALY (INPUT DATA)</span>
          </h2>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
            result.currentAnomaly.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
            result.currentAnomaly.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
            'bg-sky-500/20 text-sky-300 border-sky-400/40'
          }`}>
            SEVERITY: {result.currentAnomaly.severity}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold font-sans">SPACECRAFT / SATELLITE</span>
            <span className="text-white font-bold text-base font-sans">{result.currentAnomaly.satellite}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold font-sans">SUBSYSTEM</span>
            <span className="text-sky-400 font-bold text-sm font-sans">{result.currentAnomaly.subsystem}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold font-sans">COMPONENT</span>
            <span className="text-white font-bold text-sm font-sans">{result.currentAnomaly.component}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 text-xs space-y-2 backdrop-blur-md">
          <div className="text-slate-200">
            <strong className="text-white font-semibold">Identified Failure Mode:</strong> {result.currentAnomaly.failureMode}
          </div>
          <div className="text-slate-300 font-mono">
            <strong className="text-white font-semibold font-sans">Telemetry Delta:</strong> {result.currentAnomaly.telemetryDelta}
          </div>
          <div className="text-slate-300 font-mono">
            <strong className="text-white font-semibold font-sans">Triggered Error Codes:</strong> {result.currentAnomaly.errorCodes.join(', ') || 'N/A'}
          </div>
          <div className="text-slate-300 leading-relaxed font-sans">
            <strong className="text-white font-semibold">Observed Symptoms:</strong> {result.currentAnomaly.detectedSymptoms.join(' • ')}
          </div>
        </div>
      </div>

      {/* 2. STAR FEATURE — “WHAT HAPPENED LAST TIME?” */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.08] border border-sky-400/30 shadow-2xl space-y-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-sky-400 tracking-wider uppercase flex items-center gap-2">
                <span>STAR FEATURE • RECALLED PRECEDENT</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 border border-white/15">
                  Bank: {result.memoryBankId || 'space-mem-engineering'}
                </span>
              </div>
              <h2 className="text-xl font-['Inter'] font-semibold tracking-tight text-white">
                WHAT HAPPENED LAST TIME?
              </h2>
            </div>
          </div>

          {result.whatHappenedLastTime.previousCaseId && result.whatHappenedLastTime.previousCaseId !== 'NO_MATCH' && (
            <button
              onClick={() => onSelectCase(result.whatHappenedLastTime.previousCaseId)}
              className="text-xs font-mono text-white hover:text-sky-300 flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-sky-400/30 hover:border-sky-400/50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm font-semibold backdrop-blur-md"
            >
              <span>Inspect {result.whatHappenedLastTime.previousCaseId}</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            </button>
          )}
        </div>

        <blockquote className="text-sm sm:text-base text-white font-medium italic border-l-4 border-sky-400 pl-4 py-2 leading-relaxed bg-white/[0.06] rounded-r-xl p-3 shadow-md backdrop-blur-md">
          “{result.whatHappenedLastTime.summary}”
        </blockquote>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          {/* Previous Root Cause */}
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-1 shadow-sm backdrop-blur-md">
            <span className="font-mono text-amber-400 font-bold uppercase tracking-wider block text-[11px]">
              Previous Root Cause
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {result.whatHappenedLastTime.previousRootCause}
            </p>
          </div>

          {/* Previous Corrective Action */}
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-1 shadow-sm backdrop-blur-md">
            <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider block text-[11px]">
              Previous Corrective Action
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {result.whatHappenedLastTime.previousCorrectiveAction}
            </p>
          </div>

          {/* Previous Outcome */}
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-1 shadow-sm backdrop-blur-md">
            <span className="font-mono text-sky-400 font-bold uppercase tracking-wider block text-[11px]">
              Previous Outcome
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {result.whatHappenedLastTime.previousOutcome}
            </p>
          </div>

          {/* What Failed First (Crucial Lesson!) */}
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 space-y-1 shadow-sm backdrop-blur-md">
            <span className="font-mono text-red-300 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>What Failed First (Do NOT Repeat)</span>
            </span>
            <p className="text-red-200 leading-relaxed font-sans">
              {result.whatHappenedLastTime.previousWhatFailedFirst}
            </p>
          </div>
        </div>

        {/* Primary Lesson Learned */}
        <div className="p-4 rounded-xl bg-white/[0.05] border border-amber-500/30 flex items-start gap-3.5 shadow-sm backdrop-blur-md">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-amber-300 uppercase tracking-wider block mb-1 text-[11px]">
              Key Lesson Learned
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {result.whatHappenedLastTime.keyLessonLearned}
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400 text-right">
          SIMULATED ENGINEERING DATA • HACKATHON DEMONSTRATION
        </div>
      </div>

      {/* 2.5 HINDSIGHT REFLECT: MULTI-MEMORY REASONING (SECTIONS 26 & 27) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 border border-indigo-400/30 shadow-2xl space-y-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 flex items-center justify-center shadow-sm">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span>CORE MEMORY OPERATION • HINDSIGHT REFLECT</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                  {result.hindsightReflection?.reflectionSource || 'HINDSIGHT REFLECT'}
                </span>
              </div>
              <h2 className="text-xl font-['Inter'] font-semibold tracking-tight text-white">
                Multi-Memory Pattern &amp; Cross-Case Reflection
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-3 py-1 rounded-lg border font-bold ${
              result.hindsightReflection?.hasPattern
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {result.hindsightReflection?.hasPattern
                ? 'RECURRING PATTERN IDENTIFIED'
                : 'INSUFFICIENT PATTERN EVIDENCE'}
            </span>
          </div>
        </div>

        {/* Pattern Outcome or Insufficient Evidence Banner */}
        {result.hindsightReflection?.hasPattern ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.05] border border-indigo-400/30 space-y-2">
              <span className="font-mono text-indigo-300 font-bold uppercase tracking-wider block text-[11px]">
                Recurring Failure Mechanism:
              </span>
              <p className="text-white font-semibold text-sm leading-snug">
                {result.hindsightReflection.recurringFailureMechanism}
              </p>
              <p className="text-slate-300 text-xs leading-relaxed font-sans pt-1">
                {result.hindsightReflection.reflectedPatternObservation}
              </p>
            </div>

            {/* Cross-case connections */}
            {result.hindsightReflection.connectionsIdentified && result.hindsightReflection.connectionsIdentified.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px] font-semibold">
                  Cross-Case Historical Connections ({result.hindsightReflection.supportingCaseIds.join(', ')}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {result.hindsightReflection.connectionsIdentified.map((conn, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectCase(conn.caseId)}
                      className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-400/40 cursor-pointer transition-all space-y-1 group"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-indigo-400 font-bold group-hover:text-indigo-300 flex items-center gap-1.5">
                          <span>{conn.caseId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                        <span className="text-[10px] text-slate-400">{conn.subsystem}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                        {conn.connection}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lessons learned synthesis */}
            {result.hindsightReflection.lessonsLearnedSynthesis && (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-amber-500/30 text-xs flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-amber-300 font-bold uppercase tracking-wider block text-[11px] mb-0.5">
                    Unified Multi-Mission Engineering Lesson:
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {result.hindsightReflection.lessonsLearnedSynthesis}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5 font-sans">
            <div className="flex items-center gap-2 font-mono font-bold text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Insufficient Historical Evidence to Establish a Reliable Pattern</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              In accordance with Hindsight Bank Directives, the system refuses to fabricate or hallucinate recurring failure mechanisms when the available memories in bank <strong className="text-white">{result.memoryBankId || 'space-mem-engineering'}</strong> do not meet the minimum cross-case correlation threshold.
            </p>
          </div>
        )}

        {/* 4 Strict Categories from Reflection */}
        {result.hindsightReflection?.reflectionCategories && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 text-xs font-sans">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-emerald-500/30 space-y-1.5">
              <span className="font-mono text-[11px] font-bold text-emerald-300 block">
                [HISTORICAL EVIDENCE]
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {result.hindsightReflection.reflectionCategories.historicalEvidence.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0 font-mono">✓</span>
                    <span>{item.replace('[HISTORICAL EVIDENCE]', '').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-indigo-500/30 space-y-1.5">
              <span className="font-mono text-[11px] font-bold text-indigo-300 block">
                [REFLECTED PATTERN / OBSERVATION]
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {result.hindsightReflection.reflectionCategories.reflectedPattern.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 shrink-0 font-mono">⚡</span>
                    <span>{item.replace('[REFLECTED PATTERN]', '').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-amber-500/30 space-y-1.5">
              <span className="font-mono text-[11px] font-bold text-amber-300 block">
                [AI HYPOTHESIS]
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {result.hindsightReflection.reflectionCategories.aiHypothesis.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0 font-mono">?</span>
                    <span>{item.replace('[AI HYPOTHESIS]', '').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-red-500/30 space-y-1.5">
              <span className="font-mono text-[11px] font-bold text-red-300 block">
                [ENGINEER VALIDATION REQUIRED]
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {result.hindsightReflection.reflectionCategories.engineerValidation.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-red-400 shrink-0 font-mono">⚠</span>
                    <span>{item.replace('[ENGINEER VALIDATION REQUIRED]', '').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section 27: Collapsible Hindsight Bank Mission & Directives */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => setShowDirectives(!showDirectives)}
            className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-white py-1 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-sky-400">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Hindsight Bank Mission &amp; Reflection Directives (Section 27)</span>
            </span>
            {showDirectives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDirectives && (
            <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 text-xs animate-fade-in font-sans">
              <div>
                <span className="font-mono text-[10px] text-sky-300 font-bold block mb-1 uppercase tracking-wider">
                  Configured Bank Mission:
                </span>
                <p className="text-slate-200 italic leading-relaxed bg-white/[0.04] p-3 rounded-lg border border-white/10">
                  “{result.hindsightReflection?.bankMission || 'You are the long-term engineering memory for SPACE-MEM. Prioritize confirmed spacecraft engineering experience, failure investigations, validated root causes, corrective actions, test conditions, outcomes, and lessons learned. Never treat an unconfirmed AI hypothesis as established engineering knowledge.'}”
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] text-sky-300 font-bold block mb-1.5 uppercase tracking-wider">
                  Active Directives Constraining Reflection:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                  {(result.hindsightReflection?.bankDirectives || [
                    'Always distinguish historical evidence from hypotheses.',
                    'Never fabricate historical cases.',
                    'Prefer confirmed engineering experience.',
                    'Preserve provenance of recalled memories.',
                    'Require human validation before operational decisions.',
                    'Do not treat simulated data as real-world evidence.',
                    'Do not convert similarity scores into probability of correctness.'
                  ]).map((directive, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                      <span className="text-sky-400 shrink-0 font-bold">{idx + 1}.</span>
                      <span>{directive}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2.8 MEMORY USED SUMMARY (HACKATHON REQUIREMENT) */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-sky-500/25 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                HINDSIGHT PROVENANCE &amp; GROQ REASONING
              </span>
              <h2 className="text-base font-semibold text-white font-['Inter']">
                MEMORY USED
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-lg border ${
              result.memoryUsedSummary?.memoryImpact === 'INFLUENCED' || (result.retrievedMemoryIds && result.retrievedMemoryIds.length > 0)
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {result.memoryUsedSummary?.memoryImpact === 'INFLUENCED' || (result.retrievedMemoryIds && result.retrievedMemoryIds.length > 0)
                ? 'Historical memory influenced this investigation.'
                : 'NO RELEVANT HISTORICAL MEMORY FOUND.'}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-mono">
          <span>Historical cases recalled: </span>
          <strong className="text-sky-300 font-bold text-sm">
            {result.memoryUsedSummary?.historicalCasesRecalledCount ?? result.retrievedMemoryIds.length}
          </strong>
          <span className="text-slate-400 ml-2">
            ({result.memorySource} • Bank: {result.memoryBankId || 'space-mem-engineering'})
          </span>
        </div>

        {/* Relevant Historical Cases List */}
        {result.memoryUsedSummary?.relevantMemories && result.memoryUsedSummary.relevantMemories.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Relevant Historical Cases Recalled:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {result.memoryUsedSummary.relevantMemories.map((mem) => (
                <div
                  key={mem.caseId}
                  onClick={() => onSelectCase(mem.caseId)}
                  className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer space-y-1.5 font-sans"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-sky-400 font-bold text-xs flex items-center gap-1.5">
                      <span>{mem.caseId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      {Math.round(mem.similarityScore * 100)}% Match
                    </span>
                  </div>
                  <div className="text-white font-medium text-xs">
                    {mem.component} <span className="text-slate-400 font-normal">({mem.satellite})</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-slate-200">Failure Mode:</strong> {mem.failureMode}
                  </div>
                  <div className="text-amber-300 text-[11px] leading-relaxed">
                    <strong>Key Lesson:</strong> {mem.keyLesson}
                  </div>
                  {mem.whatWorked && (
                    <div className="text-emerald-300 text-[10px] leading-relaxed font-mono">
                      ✓ What Worked: {mem.whatWorked}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
            No prior precedent met the 0.50 similarity threshold. Groq reasoned from first-principles aerospace physics.
          </div>
        )}

        {/* Reflected Patterns & New Knowledge Retained */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-indigo-400/30 space-y-1.5">
            <span className="font-mono text-indigo-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reflected Pattern</span>
            </span>
            <p className="text-slate-300 text-xs leading-relaxed font-sans">
              {result.hindsightReflection?.patternStatement ||
                result.memoryUsedSummary?.reflectedPatterns?.[0] ||
                'Analysis grounded in spacecraft qualification behavioral history.'}
            </p>
            {result.hindsightReflection?.supportingCaseIds && result.hindsightReflection.supportingCaseIds.length > 0 && (
              <div className="text-[10px] font-mono text-slate-400">
                Supporting Cases: {result.hindsightReflection.supportingCaseIds.join(', ')}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-emerald-500/30 space-y-1.5">
            <span className="font-mono text-emerald-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Knowledge For Future Retention</span>
            </span>
            <p className="text-slate-300 text-xs leading-relaxed font-sans">
              {result.memoryUsedSummary?.newKnowledgeLearned ||
                'Upon engineer validation, verified root cause and corrective action will be retained in Hindsight for future recall.'}
            </p>
            <div className="pt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Reasoning Engine:</span>
              <span className="text-sky-300 font-semibold">{result.memoryUsedSummary?.engineUsed || 'Groq (openai/gpt-oss-120b)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2 REQUIREMENT: MEMORY EVIDENCE CATEGORIES (Strict Classification) */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs uppercase tracking-wider text-white font-bold font-mono">
              EVIDENCE CLASSIFICATION MATRIX (SECTION 2 CONSTITUTION)
            </h2>
          </div>

          <div className="flex gap-1 bg-black/40 p-1 rounded-xl text-xs font-mono">
            {(['ALL', 'HISTORICAL', 'HYPOTHESIS', 'VALIDATION'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveCategoryTab(tab)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  activeCategoryTab === tab
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {/* [CURRENT CASE] */}
          {(activeCategoryTab === 'ALL') && (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2 backdrop-blur-md">
              <span className="font-mono text-[11px] font-bold text-sky-300 tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>[CURRENT CASE]</span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans">Information supplied by the engineer for current anomaly:</p>
              <ul className="space-y-1.5 text-slate-200">
                {(result.currentCaseObservations || []).map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-mono shrink-0">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* [HISTORICAL EVIDENCE] */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'HISTORICAL') && (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-emerald-500/30 space-y-2 backdrop-blur-md">
              <span className="font-mono text-[11px] font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>[HISTORICAL EVIDENCE]</span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans">Ground truth retrieved from Hindsight memory bank:</p>
              <ul className="space-y-1.5 text-slate-200">
                {(result.historicalEvidence || []).map((ev, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-mono shrink-0">✓</span>
                    <span className="leading-relaxed">{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* [AI HYPOTHESIS] */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'HYPOTHESIS') && (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-amber-500/30 space-y-2 backdrop-blur-md">
              <span className="font-mono text-[11px] font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>[AI HYPOTHESIS]</span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans">Possible explanations (NOT confirmed historical facts):</p>
              <ul className="space-y-1.5 text-slate-200">
                {(result.aiHypotheses || []).map((hyp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-mono shrink-0">?</span>
                    <span className="leading-relaxed">{hyp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* [ENGINEER VALIDATION REQUIRED] */}
          {(activeCategoryTab === 'ALL' || activeCategoryTab === 'VALIDATION') && (
            <div className="p-4 rounded-xl bg-white/[0.04] border border-red-500/30 space-y-2 backdrop-blur-md">
              <span className="font-mono text-[11px] font-bold text-red-300 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>[ENGINEER VALIDATION REQUIRED]</span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans">Mandatory verification checks before operational action:</p>
              <ul className="space-y-1.5 text-slate-200">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-mono shrink-0">⚠</span>
                  <span className="leading-relaxed">All AI-generated recommendations require qualified human engineer sign-off.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-mono shrink-0">⚠</span>
                  <span className="leading-relaxed">Automated commanding or direct flight software rework is strictly prohibited.</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 4. HISTORICAL MATCH SECTION */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>HISTORICAL MATCHES — {result.historicalMatches.length} Similar Cases Recalled</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Retrieved via {result.memorySource}
          </span>
        </div>

        <div className="space-y-3">
          {result.historicalMatches.map((m) => {
            const isHigh = m.similarityScore >= 0.75;
            const isMedium = m.similarityScore >= 0.50 && m.similarityScore < 0.75;

            return (
              <div
                key={m.caseId}
                className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 hover:border-sky-400/40 transition-all space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded border border-sky-400/30">
                      {m.caseId}
                    </span>
                    <span className="text-sm font-semibold text-white">{m.component}</span>
                    <span className="text-xs text-slate-400">({m.satellite})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                      isHigh
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : isMedium
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                        : 'bg-white/10 text-slate-400 border-white/15'
                    }`}>
                      Similarity: {(m.similarityScore * 100).toFixed(0)}% ({isHigh ? 'HIGH RELEVANCE' : isMedium ? 'MEDIUM RELEVANCE' : 'LOW RELEVANCE'})
                    </span>
                    <button
                      onClick={() => onSelectCase(m.caseId)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Matching factors */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  {m.matchingFactors.map((factor, fIdx) => (
                    <span key={fIdx} className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/15">
                      ✓ {factor}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                    <span className="text-slate-400 font-mono block text-[11px] mb-1 font-semibold">Previous Symptoms:</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                      {m.previousSymptoms.slice(0, 2).map((s, sIdx) => (
                        <li key={sIdx} className="truncate">{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
                    <span className="text-slate-400 font-mono block text-[11px] mb-1 font-semibold">Validated Solution:</span>
                    <p className="text-emerald-400 font-semibold truncate">{m.previousCorrectiveAction}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. RECOMMENDED INVESTIGATION PATH */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-xs uppercase tracking-wider text-white font-bold flex items-center gap-2 font-mono">
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>RECOMMENDED INVESTIGATION PATH</span>
          </h2>
          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-bold">
            HUMAN VERIFICATION REQUIRED
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          Step-by-step engineering checklist generated from Hindsight reflection. Every item must be validated by a qualified test engineer:
        </p>

        <div className="space-y-3">
          {result.recommendations.map(step => (
            <div
              key={step.stepNumber}
              className="p-4 sm:p-5 rounded-xl bg-white/[0.05] border border-white/10 space-y-2.5 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5 border border-sky-400/30">
                    {step.stepNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">
                      {step.actionTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                      {step.rationale}
                    </p>
                  </div>
                </div>

                {step.historicalPrecedentCaseId && (
                  <span className="text-[10px] font-mono text-sky-300 bg-sky-500/20 px-2.5 py-1 rounded-md border border-sky-400/30 shrink-0 font-semibold">
                    Ref: {step.historicalPrecedentCaseId}
                  </span>
                )}
              </div>

              {/* Mandatory AI Verification Caution Label */}
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-mono text-amber-300 font-bold block mb-0.5">
                    {step.cautionNotice}
                  </strong>
                  <span className="text-amber-200/90 font-sans">Verification Procedure: {step.verificationProcedure}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. CONFIDENCE AND EVIDENCE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Confidence Card */}
        <div className="p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-3 shadow-2xl">
          <span className="text-xs font-mono text-slate-400 block tracking-wider font-bold">AI EVIDENCE CONFIDENCE</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-mono font-bold ${
              result.confidence.level === 'High' ? 'text-emerald-400' :
              result.confidence.level === 'Medium' ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {result.confidence.level.toUpperCase()} ({result.confidence.score}%)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {result.confidence.justification}
          </p>
          <span className="text-[11px] font-mono text-sky-300 block pt-2 border-t border-white/10 font-bold">
            Evidence Grounding: {result.confidence.evidenceCount} Hindsight memories
          </span>
        </div>

        {/* Evidence Used List */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-mono text-white uppercase font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span>EVIDENCE MEMORIES USED ({result.evidenceUsed.length})</span>
            </span>
            <span className="text-[10px] font-mono text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded font-semibold">
              Bank: {result.memoryBankId || 'space-mem-engineering'}
            </span>
          </div>

          <div className="space-y-2">
            {result.evidenceUsed.map(ev => (
              <div
                key={ev.caseId}
                onClick={() => onSelectCase(ev.caseId)}
                className="p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 hover:border-sky-400/30 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-sky-300 font-bold bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">{ev.caseId}</span>
                  <span className="text-slate-300 group-hover:text-white transition-colors truncate max-w-sm font-sans">{ev.relevantHistoricalInfo}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-slate-400">{ev.memorySource || result.memorySource}</span>
                  <span className="font-mono text-[11px] text-slate-400">{ev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. SAVE THIS EXPERIENCE (Learning Loop - Closed Loop) */}
      <div className="p-6 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-['Inter'] font-semibold tracking-tight text-white">
                SAVE THIS EXPERIENCE (CLOSED-LOOP LEARNING)
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Only CONFIRMED engineering investigations with validated corrective actions can become durable Hindsight memory.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSaveFormOpen(!saveFormOpen)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-slate-200 cursor-pointer transition-colors shadow-sm backdrop-blur-md"
          >
            {saveFormOpen ? 'Hide Retain Form' : 'Open Retain Form'}
          </button>
        </div>

        {/* Closed Loop Visual Stepper */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300 gap-2">
          <span className="text-slate-400">Lifecycle:</span>
          <span className="text-slate-400">1. DRAFT</span>
          <span>→</span>
          <span className="text-slate-400">2. INVESTIGATING</span>
          <span>→</span>
          <span className="text-sky-300 font-bold">3. ENGINEER REVIEW</span>
          <span>→</span>
          <span className={`font-bold ${engineerConfirmed ? 'text-emerald-300' : 'text-slate-400'}`}>4. CONFIRMED</span>
          <span>→</span>
          <span className={`font-bold ${saveSuccessMessage ? 'text-emerald-400' : 'text-slate-500'}`}>5. RETAINED TO HINDSIGHT</span>
        </div>

        {saveSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 shadow-sm backdrop-blur-md animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="block">{saveSuccessMessage}</span>
              <span className="text-[11px] font-mono text-emerald-300/80 block mt-0.5">
                Target Bank: {result.memoryBankId || 'space-mem-engineering'} • Status: Available for future investigations.
              </span>
            </div>
          </div>
        )}

        {saveErrorMessage && (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2.5 shadow-sm backdrop-blur-md animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="whitespace-pre-line">{saveErrorMessage}</span>
          </div>
        )}

        {saveFormOpen && (
          <form onSubmit={handleRetainSubmit} className="space-y-4 bg-white/[0.05] p-5 rounded-xl border border-white/10 shadow-sm backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Case ID to Commit</label>
                <input
                  type="text"
                  value={saveData.caseId}
                  onChange={e => setSaveData({ ...saveData, caseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Spacecraft / Program</label>
                <input
                  type="text"
                  value={saveData.satellite}
                  onChange={e => setSaveData({ ...saveData, satellite: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Component</label>
                <input
                  type="text"
                  value={saveData.component}
                  onChange={e => setSaveData({ ...saveData, component: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirmed Root Cause (Physical/Electrical Mechanism)</label>
                <textarea
                  rows={2}
                  value={saveData.confirmedRootCause}
                  onChange={e => setSaveData({ ...saveData, confirmedRootCause: e.target.value })}
                  placeholder="Detail the verified physical failure mechanism (minimum 10 chars)..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Validated Corrective Action Taken</label>
                <textarea
                  rows={2}
                  value={saveData.correctiveActionTaken}
                  onChange={e => setSaveData({ ...saveData, correctiveActionTaken: e.target.value })}
                  placeholder="Detail approved hardware rework, parameter tune, or procedure..."
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">What Worked (Verified Solution)</label>
                <input
                  type="text"
                  value={saveData.whatWorked}
                  onChange={e => setSaveData({ ...saveData, whatWorked: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">What Failed First (False Troubleshooting Lead)</label>
                <input
                  type="text"
                  value={saveData.whatFailed}
                  onChange={e => setSaveData({ ...saveData, whatFailed: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lessons Learned</label>
                <input
                  type="text"
                  value={saveData.lessonsLearned}
                  onChange={e => setSaveData({ ...saveData, lessonsLearned: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Engineer Sign-Off Name &amp; Title</label>
                <input
                  type="text"
                  value={saveData.engineerName || ''}
                  onChange={e => setSaveData({ ...saveData, engineerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                  required
                />
              </div>
            </div>

            {/* Section 8 & 9: Engineer Confirmation Gate */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-sky-400/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="engineerConfirmCheckbox"
                checked={engineerConfirmed}
                onChange={e => setEngineerConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-sky-500 focus:ring-sky-400 cursor-pointer"
              />
              <label htmlFor="engineerConfirmCheckbox" className="text-xs text-slate-200 cursor-pointer select-none leading-relaxed">
                <strong className="text-white block font-sans">Engineer Quality Control Sign-off Confirmation (Mandatory):</strong>
                I confirm as a qualified spacecraft engineer that this investigation contains verified root cause and validated corrective actions. I authorize retaining this confirmed experience into the durable Hindsight memory bank for future spacecraft programs.
              </label>
            </div>

            <div className="text-right pt-2">
              <button
                type="submit"
                disabled={savingExperience}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-lg ml-auto transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingExperience ? 'Committing to Hindsight...' : 'Commit Confirmed Experience to Bank'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
