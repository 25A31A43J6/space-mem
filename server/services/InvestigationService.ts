import { AnalysisResult, NewAnomalySubmission, RecommendedInvestigationStep, MemoryUsedSummary } from '../../src/types/spaceMem.ts';
import { hindsightService } from '../hindsightService.ts';
import { memoryStore } from '../memoryStore.ts';
import { MemoryValidationService } from './MemoryValidationService.ts';
import { EvidenceService } from './EvidenceService.ts';
import { SafetyGuardService } from './SafetyGuardService.ts';
import { auditService } from './AuditService.ts';
import { groqService, GroqInvestigationOutput } from '../groqService.ts';

export class InvestigationService {
  /**
   * Section 1: Hindsight-First Investigation Execution
   *
   * TARGET ARCHITECTURE:
   * INPUT SPACECRAFT FAILURE
   *         ↓
   * HINDSIGHT RECALL
   *         ↓
   * RELEVANT HISTORICAL FAILURES
   *         ↓
   * HINDSIGHT REFLECT
   *         ↓
   * HISTORICAL PATTERNS / LESSONS
   *         ↓
   * GROQ LLM (openai/gpt-oss-120b)
   *         ↓
   * ROOT CAUSE ANALYSIS
   *         ↓
   * RECOMMENDATIONS
   *         ↓
   * ENGINEER VALIDATION
   *         ↓
   * HINDSIGHT RETAIN
   */
  public static async executeInvestigation(rawSubmission: NewAnomalySubmission): Promise<AnalysisResult> {
    // Step 1: Validate incoming anomaly
    const validation = MemoryValidationService.validateAnomalySubmission(rawSubmission);
    if (!validation.valid) {
      throw new Error(`Invalid anomaly submission: ${validation.errors.join(' ')}`);
    }

    // Step 2: Normalize engineering information
    const submission: NewAnomalySubmission = {
      ...rawSubmission,
      satellite: MemoryValidationService.sanitizeText(rawSubmission.satellite) || 'Spacecraft-Vehicle',
      component: MemoryValidationService.sanitizeText(rawSubmission.component),
      subsystem: rawSubmission.subsystem,
      testType: rawSubmission.testType,
      symptoms: MemoryValidationService.sanitizeText(rawSubmission.symptoms),
      telemetryObservations: MemoryValidationService.sanitizeText(rawSubmission.telemetryObservations),
      errorCodes: MemoryValidationService.sanitizeText(rawSubmission.errorCodes),
      pressure: MemoryValidationService.sanitizeText(rawSubmission.pressure) || 'Hard Vacuum',
      vibration: MemoryValidationService.sanitizeText(rawSubmission.vibration) || '0 g RMS',
      temperature: Number(rawSubmission.temperature) || 25,
      voltage: Number(rawSubmission.voltage) || 28,
      current: Number(rawSubmission.current) || 1.0,
      severity: rawSubmission.severity || 'HIGH',
      failureTime: rawSubmission.failureTime || new Date().toISOString()
    };

    // Step 3 & 4: Query Hindsight memory (cloud or local fallback)
    console.log('[SPACE-MEM] Hindsight recall started');
    const recallResult = await hindsightService.recallMemory(submission, 4);
    const recalledMatches = recallResult.matches;
    console.log(`[SPACE-MEM] Historical memories retrieved (${recalledMatches.length} cases): [${recallResult.retrievedMemoryIds.join(', ')}] from ${recallResult.memorySource}`);

    // Step 5: Evaluate relevance against thresholds
    const evidenceEvaluation = EvidenceService.evaluateMemories(submission, recalledMatches);
    const topMatch = evidenceEvaluation.hasSufficientEvidence ? evidenceEvaluation.usedMatches[0] : null;

    // Step 6: Contradiction Detection
    const conflictingEvidence = evidenceEvaluation.conflictingEvidence;

    // Step 7: Hindsight REFLECT (Reason over multiple memories, discover patterns & connections)
    console.log('[SPACE-MEM] Hindsight reflection started');
    const reflectionResult = await hindsightService.reflectMemories(submission, recalledMatches);
    console.log('[SPACE-MEM] Hindsight reflection completed');

    // Step 8: Evidence-grounded Groq LLM Reasoning (Constrained by Hindsight Bank Mission & Directives)
    console.log('[SPACE-MEM] Groq investigation started');
    let groqOutput: GroqInvestigationOutput;
    try {
      groqOutput = await groqService.generateInvestigation({
        submission: {
          satellite: submission.satellite,
          subsystem: submission.subsystem,
          component: submission.component,
          testType: submission.testType,
          temperature: submission.temperature,
          voltage: submission.voltage,
          current: submission.current,
          pressure: submission.pressure,
          vibration: submission.vibration,
          errorCodes: submission.errorCodes,
          symptoms: submission.symptoms,
          telemetryObservations: submission.telemetryObservations
        },
        recalledMemories: evidenceEvaluation.usedMatches,
        hasSufficientEvidence: evidenceEvaluation.hasSufficientEvidence,
        relevanceStatement: evidenceEvaluation.relevanceStatement,
        hindsightReflection: reflectionResult
      });
      console.log(`[SPACE-MEM] Groq investigation completed (source: ${groqOutput.sourceLabel})`);
    } catch (err: any) {
      console.warn('[SPACE-MEM] Groq investigation encountered error, using deterministic aerospace fallback:', err.message || err);
      groqOutput = (groqService as any).generateDeterministicFallback({
        submission,
        recalledMemories: evidenceEvaluation.usedMatches,
        hasSufficientEvidence: evidenceEvaluation.hasSufficientEvidence,
        relevanceStatement: evidenceEvaluation.relevanceStatement,
        hindsightReflection: reflectionResult
      }, err.message);
    }

    const primaryMatchCase = topMatch ? memoryStore.getCaseById(topMatch.caseId) : null;

    const failureMode = groqOutput.failureMode ||
      (primaryMatchCase ? primaryMatchCase.failureMode : `${submission.component} Operational Anomaly`);

    let whatHappenedSummary = groqOutput.whatHappenedSummary;
    let previousWhatFailedFirst = groqOutput.previousWhatFailedFirst;

    if (!whatHappenedSummary) {
      if (evidenceEvaluation.hasSufficientEvidence && topMatch) {
        whatHappenedSummary = `In ${topMatch.caseId} on ${topMatch.satellite} (${topMatch.subsystem}), identical behavior occurred during ${primaryMatchCase?.testType || submission.testType}. Investigation confirmed ${topMatch.previousRootCause}.`;
        previousWhatFailedFirst = topMatch.previousWhatFailed || 'Assuming external harness cabling without internal component probing.';
      } else {
        whatHappenedSummary = 'No sufficiently similar historical memory was found in the engineering memory bank. Investigation is initiated from first-principles engineering hypotheses.';
        previousWhatFailedFirst = 'No prior case record available in memory bank. Avoid speculative flight configuration changes without bench baseline characterization.';
      }
    }

    // Recommendations with human-in-the-loop safety gating
    let rawRecommendations: RecommendedInvestigationStep[] = [];
    if (groqOutput.recommendedActions && groqOutput.recommendedActions.length > 0) {
      rawRecommendations = groqOutput.recommendedActions;
    } else if (evidenceEvaluation.hasSufficientEvidence && topMatch) {
      rawRecommendations = [
        {
          stepNumber: 1,
          actionTitle: `Probe ${submission.component} Telemetry Node Against Baseline`,
          rationale: `Historical case ${topMatch.caseId} demonstrated early signal variance prior to protection trip.`,
          historicalPrecedentCaseId: topMatch.caseId,
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. Do not modify operational thresholds on flight hardware.',
          verificationProcedure: 'Review calibration tables and check for thermal coefficient drift in telemetry acquisition chain.'
        },
        {
          stepNumber: 2,
          actionTitle: `Inspect Component Internal Stage (Avoid Repeating Past Failed Lead)`,
          rationale: `In ${topMatch.caseId}, engineers initially attempted: "${previousWhatFailedFirst}", wasting critical test hours without resolving the issue.`,
          historicalPrecedentCaseId: topMatch.caseId,
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. Ground all test fixtures for ESD protection before attaching probes.',
          verificationProcedure: 'Directly probe active switching nodes, clock lines, or thermal interfaces.'
        },
        {
          stepNumber: 3,
          actionTitle: `Characterize Thermal & Electrical Boundary Margins (${submission.temperature}°C)`,
          rationale: `Temperature conditions directly trigger circuit boundary oscillations (${topMatch.primaryLesson}).`,
          historicalPrecedentCaseId: topMatch.caseId,
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. Do not exceed chamber temperature ramp rates (max 3°C/min).',
          verificationProcedure: 'Execute step-temperature ramp while logging bus voltage and signal eye diagram.'
        },
        {
          stepNumber: 4,
          actionTitle: 'Formulate Corrective Action Following Validated Precedent',
          rationale: `In ${topMatch.caseId}, the verified corrective action was: "${topMatch.previousCorrectiveAction}".`,
          historicalPrecedentCaseId: topMatch.caseId,
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. All hardware modifications require formal Engineering Change Order (ECO) sign-off.',
          verificationProcedure: 'Perform component qualification re-test at boundary limits (-35°C to +65°C) to verify restored margins.'
        }
      ];
    } else {
      rawRecommendations = [
        {
          stepNumber: 1,
          actionTitle: `Establish Telemetry Baseline for ${submission.component}`,
          rationale: 'No historical precedent exists in memory bank. Immediate priority is isolating anomalous behavior from test equipment noise.',
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. Verify test equipment grounding before proceeding.',
          verificationProcedure: 'Perform 4-wire Kelvin resistance measurement and check power supply ripple.'
        },
        {
          stepNumber: 2,
          actionTitle: 'Perform Isolated Subsystem Bench Characterization',
          rationale: 'Isolate component from spacecraft bus to determine if anomaly is internal or interface-driven.',
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. Ensure proper current-limiting on ground bench supply.',
          verificationProcedure: 'Execute bench power-up sweep at ambient and plateau temperatures.'
        },
        {
          stepNumber: 3,
          actionTitle: 'Review Subsystem Design Margins against ECSS/NASA Standards',
          rationale: 'Evaluate component operating parameters against worst-case environmental qualification envelopes.',
          cautionNotice: 'AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. Subsystem Lead Engineer review required.',
          verificationProcedure: 'Cross-check component de-rating and thermal dissipation calculations.'
        }
      ];
    }

    const guardedRecommendations = SafetyGuardService.auditAndGuardRecommendations(rawRecommendations);

    // Build evidence used list with memory provenance
    const evidenceUsed = evidenceEvaluation.usedMatches.map(m => {
      const caseItem = memoryStore.getCaseById(m.caseId);
      return {
        caseId: m.caseId,
        memoryType: 'Historical Failure Investigation & Root Cause',
        relevantHistoricalInfo: `${m.satellite} - ${m.component}: ${caseItem?.investigation.rootCause || m.previousRootCause}`,
        date: caseItem?.date || '2024-03-12',
        retainedDate: caseItem?.retainedDate || '2024-03-18',
        memorySource: recallResult.memorySource,
        subsystem: m.subsystem,
        testType: caseItem?.testType || submission.testType
      };
    });

    const calculatedConfidence = EvidenceService.calculateGroundedConfidence(
      submission,
      evidenceEvaluation
    );

    const confidenceScore = calculatedConfidence.score;
    const confidenceLevel = calculatedConfidence.level;
    const confidenceJustification = calculatedConfidence.justification;

    const investigationId = `INV-${Date.now().toString().slice(-6)}`;
    const auditId = `AUDIT-${Date.now().toString().slice(-8)}`;

    // Build rich Memory Used structure
    const relevantMemories = evidenceEvaluation.usedMatches.map(m => {
      const caseItem = memoryStore.getCaseById(m.caseId);
      return {
        caseId: m.caseId,
        satellite: m.satellite,
        subsystem: m.subsystem,
        component: m.component,
        failureMode: caseItem?.failureMode || m.previousSymptoms?.[0] || 'Operational Anomaly',
        similarityScore: m.similarityScore,
        keyLesson: m.primaryLesson,
        whatWorked: m.previousCorrectiveAction,
        whatFailedFirst: m.previousWhatFailed
      };
    });

    const memoryImpact: 'INFLUENCED' | 'NEW_KNOWLEDGE_BASELINE' =
      evidenceEvaluation.hasSufficientEvidence ? 'INFLUENCED' : 'NEW_KNOWLEDGE_BASELINE';

    const memoryImpactStatement = evidenceEvaluation.hasSufficientEvidence
      ? `Historical memory influenced this investigation. Recalled ${evidenceEvaluation.usedMatches.length} precedent(s) (${evidenceEvaluation.usedMatches.map(m => m.caseId).join(', ')}) directly shaped root cause isolation, prioritized diagnostic steps, and prevented repetition of disproven troubleshooting paths.`
      : 'NO RELEVANT HISTORICAL MEMORY FOUND. This investigation establishes new engineering knowledge for future cases.';

    const newKnowledgeLearned = evidenceEvaluation.hasSufficientEvidence && topMatch
      ? `Validates and refines ${topMatch.caseId} precedent under ${submission.testType} at ${submission.temperature}°C; reinforces checking: ${topMatch.primaryLesson}.`
      : `Establishes first-ever engineering baseline for ${submission.component} under ${submission.testType} (${submission.temperature}°C).`;

    const memoryUsedSummary: MemoryUsedSummary = {
      historicalCasesRecalledCount: recalledMatches.length,
      historicalIncidentsRecalled: recalledMatches.map(m => m.caseId),
      memoryInfluencedAnalysis: evidenceEvaluation.hasSufficientEvidence,
      relevantLessons: [
        topMatch?.primaryLesson || 'Verify baseline stability under environmental boundary margins.',
        ...(reflectionResult?.lessonsLearnedSynthesis ? [reflectionResult.lessonsLearnedSynthesis] : [])
      ],
      patternsIdentified: [
        reflectionResult?.patternStatement || 'Analysis evaluated against historical qualification memory.'
      ],
      explanation: evidenceEvaluation.hasSufficientEvidence
        ? `Hindsight memory bank (${recallResult.memorySource}) provided ${evidenceEvaluation.usedMatches.length} matching failure cases that directly shaped the root cause determination and investigation path.`
        : 'No precedent found in Hindsight bank above the 0.50 threshold; Groq reasoned from aerospace physical principles.',
      relevantMemories,
      reflectedPatterns: reflectionResult?.hasPattern && reflectionResult.patternStatement
        ? [reflectionResult.patternStatement, ...(reflectionResult.reflectedPatternObservation ? [reflectionResult.reflectedPatternObservation] : [])]
        : groqOutput.patterns || [],
      newKnowledgeLearned,
      memoryImpact,
      memoryImpactStatement,
      engineUsed: groqOutput.sourceLabel
    };

    const result: AnalysisResult = {
      investigationId,
      auditId,
      generatedAt: new Date().toISOString(),
      currentAnomaly: {
        satellite: submission.satellite,
        component: submission.component,
        subsystem: submission.subsystem,
        failureMode,
        severity: submission.severity,
        detectedSymptoms: submission.symptoms.split(/[;\n]+/).map(s => s.trim()).filter(Boolean),
        telemetryDelta: `T=${submission.temperature}°C, V=${submission.voltage}V, I=${submission.current}A, P=${submission.pressure}, Vibe=${submission.vibration}`,
        errorCodes: submission.errorCodes.split(/[,\s]+/).map(c => c.trim()).filter(Boolean)
      },
      currentCase: submission,
      memorySource: recallResult.memorySource,
      hindsightConnected: recallResult.memorySource === 'HINDSIGHT CLOUD',
      memoryBankId: hindsightService.getStatus().bankId,
      memoryCount: memoryStore.getAllCases().length,
      retrievedMemoryIds: recallResult.retrievedMemoryIds,
      retrievedMemories: recalledMatches,
      evidenceSummary: evidenceEvaluation.relevanceStatement,
      historicalEvidence: groqOutput.historicalEvidence && groqOutput.historicalEvidence.length > 0
        ? groqOutput.historicalEvidence
        : evidenceEvaluation.classifiedSections.historicalEvidence,
      currentCaseObservations: evidenceEvaluation.classifiedSections.currentCase,
      aiHypotheses: groqOutput.likelyRootCauses && groqOutput.likelyRootCauses.length > 0
        ? groqOutput.likelyRootCauses.map(rc => `[GROQ HYPOTHESIS] ${rc}`)
        : evidenceEvaluation.classifiedSections.aiHypothesis,
      recommendedVerificationSteps: guardedRecommendations,
      conflictingEvidence: conflictingEvidence.detected ? conflictingEvidence : undefined,
      confidenceLevel,
      confidenceScore,
      confidenceJustification,
      engineerValidationRequired: true,
      safetyNotice: SafetyGuardService.MANDATORY_SAFETY_NOTICE,
      whatHappenedLastTime: {
        summary: whatHappenedSummary,
        previousCaseId: topMatch?.caseId || (evidenceEvaluation.hasSufficientEvidence ? 'CASE-001' : 'NO_MATCH'),
        previousSatellite: topMatch?.satellite || (evidenceEvaluation.hasSufficientEvidence ? 'AeroSat-4B' : 'N/A'),
        previousRootCause: topMatch?.previousRootCause || (evidenceEvaluation.hasSufficientEvidence ? 'MOSFET gate driver undamped parasitic oscillation.' : 'No historical memory found.'),
        previousCorrectiveAction: topMatch?.previousCorrectiveAction || (evidenceEvaluation.hasSufficientEvidence ? 'Increased gate drive damping resistor and added RC snubber.' : 'Perform first-principles bench characterization.'),
        previousOutcome: topMatch?.previousOutcome || (evidenceEvaluation.hasSufficientEvidence ? 'Main bus ripple reduced to nominal limits.' : 'Investigation Pending'),
        previousWhatFailedFirst,
        keyLessonLearned: topMatch?.primaryLesson || (evidenceEvaluation.hasSufficientEvidence ? 'Evaluate power converter gate-drive damping at cryogenic boundary temperatures.' : 'Always retain validated findings into Hindsight for future programs.')
      },
      historicalMatches: recalledMatches,
      recommendations: guardedRecommendations,
      confidence: {
        level: confidenceLevel,
        score: confidenceScore,
        evidenceCount: evidenceUsed.length,
        justification: confidenceJustification
      },
      evidenceUsed,
      hindsightReflection: reflectionResult,
      disclaimer: SafetyGuardService.MANDATORY_SAFETY_NOTICE,
      memoryEngineStatus: hindsightService.getStatus().message,
      likelyRootCauses: groqOutput.likelyRootCauses,
      patterns: groqOutput.patterns,
      uncertainties: groqOutput.uncertainties,
      memoryUsedSummary
    };

    // Record Audit Trail
    auditService.recordInvestigation({
      auditId,
      investigationId,
      timestamp: result.generatedAt,
      currentCase: {
        caseId: submission.caseId,
        satellite: submission.satellite,
        component: submission.component,
        subsystem: submission.subsystem,
        testType: submission.testType,
        severity: submission.severity,
        temperature: submission.temperature,
        voltage: submission.voltage,
        current: submission.current,
        pressure: submission.pressure,
        vibration: submission.vibration,
        errorCodes: submission.errorCodes,
        symptoms: submission.symptoms
      },
      retrievedMemoryIds: recallResult.retrievedMemoryIds,
      memorySource: recallResult.memorySource,
      similarityScores: Object.fromEntries(recalledMatches.map(m => [m.caseId, m.similarityScore])),
      evidenceCategories: {
        currentCaseObservations: result.currentCaseObservations,
        historicalEvidence: result.historicalEvidence,
        aiHypotheses: result.aiHypotheses,
        engineerValidationRequired: [
          'Human engineer verification required before operational action.',
          ...guardedRecommendations.map(r => r.cautionNotice)
        ]
      },
      aiHypotheses: result.aiHypotheses,
      recommendations: guardedRecommendations.map(r => `${r.actionTitle}: ${r.rationale}`),
      engineerValidationStatus: 'PENDING_REVIEW'
    });

    return result;
  }
}
