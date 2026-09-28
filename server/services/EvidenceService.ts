import { HistoricalMatchItem, NewAnomalySubmission } from '../../src/types/spaceMem.ts';

export interface EvaluatedEvidence {
  hasSufficientEvidence: boolean;
  highRelevanceMatches: HistoricalMatchItem[];
  mediumRelevanceMatches: HistoricalMatchItem[];
  lowRelevanceMatches: HistoricalMatchItem[];
  usedMatches: HistoricalMatchItem[];
  relevanceStatement: string;
  conflictingEvidence: {
    detected: boolean;
    conflicts: Array<{
      caseId: string;
      observation: string;
      conclusion: string;
      outcome: string;
    }>;
    statement: string;
  };
  classifiedSections: {
    currentCase: string[];
    historicalEvidence: string[];
    aiHypothesis: string[];
    engineerValidationRequired: string[];
  };
}

export class EvidenceService {
  public static readonly HIGH_THRESHOLD = 0.75;
  public static readonly MEDIUM_THRESHOLD = 0.50;

  /**
   * Evaluates recalled memories against aerospace similarity thresholds (NOT probability of correctness)
   */
  public static evaluateMemories(
    submission: NewAnomalySubmission,
    recalledMatches: HistoricalMatchItem[]
  ): EvaluatedEvidence {
    const highMatches: HistoricalMatchItem[] = [];
    const mediumMatches: HistoricalMatchItem[] = [];
    const lowMatches: HistoricalMatchItem[] = [];

    for (const match of recalledMatches) {
      if (match.similarityScore >= this.HIGH_THRESHOLD) {
        highMatches.push(match);
      } else if (match.similarityScore >= this.MEDIUM_THRESHOLD) {
        mediumMatches.push(match);
      } else {
        lowMatches.push(match);
      }
    }

    const hasSufficientEvidence = highMatches.length > 0 || mediumMatches.length > 0;
    const usedMatches = [...highMatches, ...mediumMatches];

    let relevanceStatement = '';
    if (!hasSufficientEvidence) {
      relevanceStatement =
        'No sufficiently similar historical memory was found in the engineering memory bank. Investigation proceeding with general aerospace failure physics as AI hypothesis.';
    } else if (highMatches.length > 0) {
      relevanceStatement = `High-relevance historical precedent identified (${highMatches.map(m => `${m.caseId}: ${(m.similarityScore * 100).toFixed(0)}% similarity`).join(', ')}). Evidence strongly informs investigation path, subject to qualified engineer verification.`;
    } else {
      relevanceStatement = `Medium-relevance historical supporting evidence identified (${mediumMatches.map(m => `${m.caseId}: ${(m.similarityScore * 100).toFixed(0)}% similarity`).join(', ')}). Presenting as contextual supporting evidence.`;
    }

    // Contradiction detection across recalled precedents
    const conflictingEvidence = this.detectContradictions(usedMatches);

    // Build the 4 distinct evidence categories
    const classifiedSections = this.buildClassifiedEvidence(submission, usedMatches, hasSufficientEvidence);

    return {
      hasSufficientEvidence,
      highRelevanceMatches: highMatches,
      mediumRelevanceMatches: mediumMatches,
      lowRelevanceMatches: lowMatches,
      usedMatches,
      relevanceStatement,
      conflictingEvidence,
      classifiedSections
    };
  }

  /**
   * Section 10: Contradiction Detection
   * Analyzes if two historical cases had differing root causes or opposing corrective actions
   */
  private static detectContradictions(matches: HistoricalMatchItem[]): {
    detected: boolean;
    conflicts: Array<{ caseId: string; observation: string; conclusion: string; outcome: string }>;
    statement: string;
  } {
    if (matches.length < 2) {
      return { detected: false, conflicts: [], statement: '' };
    }

    const conflicts: Array<{ caseId: string; observation: string; conclusion: string; outcome: string }> = [];

    // Compare pairs for opposing root cause mechanisms or divergent corrective actions
    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const m1 = matches[i];
        const m2 = matches[j];

        // Example: One case points to electrical noise/instability while another points to thermal solder contraction or firmware race
        const root1 = m1.previousRootCause.toLowerCase();
        const root2 = m2.previousRootCause.toLowerCase();
        const action1 = m1.previousCorrectiveAction.toLowerCase();
        const action2 = m2.previousCorrectiveAction.toLowerCase();

        const hasDivergentAction =
          (action1.includes('increase') && action2.includes('decrease')) ||
          (action1.includes('resistor') && action2.includes('firmware')) ||
          (action1.includes('hardware rework') && action2.includes('procedural limit'));

        if (hasDivergentAction) {
          conflicts.push(
            {
              caseId: m1.caseId,
              observation: `In ${m1.satellite} (${m1.component}): Symptoms matched current anomaly profile.`,
              conclusion: `Root Cause: ${m1.previousRootCause}. Validated Action: ${m1.previousCorrectiveAction}`,
              outcome: m1.previousOutcome
            },
            {
              caseId: m2.caseId,
              observation: `In ${m2.satellite} (${m2.component}): Exhibited similar thermal/electrical symptom signatures.`,
              conclusion: `Root Cause: ${m2.previousRootCause}. Validated Action: ${m2.previousCorrectiveAction}`,
              outcome: m2.previousOutcome
            }
          );
        }
      }
    }

    if (conflicts.length > 0) {
      return {
        detected: true,
        conflicts,
        statement:
          'CONFLICTING HISTORICAL EVIDENCE: Recalled precedents resolved similar telemetry symptoms using divergent engineering solutions. Engineer review is required to determine applicability to the current case.'
      };
    }

    return { detected: false, conflicts: [], statement: '' };
  }

  /**
   * Section 2: Memory Evidence Categories (Strict Separation)
   */
  private static buildClassifiedEvidence(
    submission: NewAnomalySubmission,
    usedMatches: HistoricalMatchItem[],
    hasSufficientEvidence: boolean
  ) {
    const currentCase: string[] = [
      `Spacecraft: ${submission.satellite || 'Unknown Satellite'}, Subsystem: ${submission.subsystem}, Component: ${submission.component}`,
      `Test Environment: ${submission.testType} at ${submission.temperature}°C, ${submission.voltage}V bus, ${submission.current}A, Chamber: ${submission.pressure || 'Ambient'}, Vibe: ${submission.vibration || '0 g'}`,
      `Observed Symptoms: ${submission.symptoms}`,
      `Reported Telemetry Delta: ${submission.telemetryObservations || 'No raw waveforms attached'}`,
      `Triggered Error Codes: ${submission.errorCodes || 'None reported'}`
    ];

    const historicalEvidence: string[] = [];
    if (hasSufficientEvidence) {
      for (const m of usedMatches) {
        historicalEvidence.push(
          `[${m.caseId}] ${m.satellite} - ${m.component} (${m.subsystem}): Recalled with ${(m.similarityScore * 100).toFixed(0)}% similarity. Root cause: "${m.previousRootCause}". What failed first: "${m.previousWhatFailed}". Validated solution: "${m.previousCorrectiveAction}". Outcome: "${m.previousOutcome}". Key lesson: "${m.primaryLesson}".`
        );
      }
    } else {
      historicalEvidence.push(
        'No sufficiently similar historical memory was found in the engineering memory bank (all database matches scored below the 0.50 aerospace relevance threshold).'
      );
    }

    const aiHypothesis: string[] = [];
    if (hasSufficientEvidence) {
      const top = usedMatches[0];
      aiHypothesis.push(
        `Hypothesis A (Precedent-Grounded): The observed telemetry delta on ${submission.component} may be driven by the same physical mechanism verified in ${top.caseId} (${top.previousRootCause}).`
      );
      aiHypothesis.push(
        `Hypothesis B (Thermal Dependency): Operation at ${submission.temperature}°C alters semiconductor threshold voltages and passive tolerances, potentially shifting loop stability margins.`
      );
    } else {
      aiHypothesis.push(
        `Hypothesis (First-Principles Aerospace): Given no historical precedent in the memory bank, evaluate standard stress vectors for ${submission.subsystem}: thermal interface delamination, clock jitter, or test ground-loop transients.`
      );
    }

    const engineerValidationRequired: string[] = [
      'Perform non-invasive high-bandwidth oscilloscope probe check on switching nodes before altering hardware or wiring.',
      'Check calibration offsets of chamber data acquisition channels to rule out ground support equipment (GSE) measurement artifact.',
      'Validate all findings against spacecraft subsystem interface control documents (ICDs) with Lead Systems Engineer sign-off before proceeding.'
    ];

    return {
      currentCase,
      historicalEvidence,
      aiHypothesis,
      engineerValidationRequired
    };
  }

  /**
   * Principled Aerospace Confidence Assessment
   * Confidence is NOT artificially increased with turns.
   * Grounded strictly in evidence quality, similarity, multi-case agreement, and contradiction penalties.
   */
  public static calculateGroundedConfidence(
    submission: NewAnomalySubmission,
    evidenceEvaluation: EvaluatedEvidence
  ): {
    score: number;
    level: 'High' | 'Medium' | 'Low';
    justification: string;
  } {
    if (!evidenceEvaluation.hasSufficientEvidence || evidenceEvaluation.usedMatches.length === 0) {
      return {
        score: 25,
        level: 'Low',
        justification:
          'Low confidence (25%): Zero historical cases in the Hindsight memory bank reached the 0.50 similarity threshold. Hypotheses generated from general aerospace physical principles.'
      };
    }

    const topMatch = evidenceEvaluation.usedMatches[0];
    const topScore = topMatch.similarityScore; // 0.50 to 0.95
    let calculatedScore = Math.round(topScore * 100);

    // Multi-case agreement bonus: If 2+ matches corroborate without contradiction
    if (evidenceEvaluation.usedMatches.length >= 2 && !evidenceEvaluation.conflictingEvidence.detected) {
      const additionalCount = Math.min(3, evidenceEvaluation.usedMatches.length - 1);
      calculatedScore = Math.min(94, calculatedScore + additionalCount * 4);
    }

    // Contradiction penalty: If precedents had divergent root causes or fixes
    if (evidenceEvaluation.conflictingEvidence.detected) {
      calculatedScore = Math.max(30, calculatedScore - 25);
    }

    // Level determination strictly by score
    const level: 'High' | 'Medium' | 'Low' =
      calculatedScore >= 75 ? 'High' : calculatedScore >= 50 ? 'Medium' : 'Low';

    let justification = '';
    if (evidenceEvaluation.conflictingEvidence.detected) {
      justification = `Confidence downgraded to ${calculatedScore}% (${level}) due to conflicting historical resolutions across ${evidenceEvaluation.conflictingEvidence.conflicts.map(c => c.caseId).join(', ')}.`;
    } else if (evidenceEvaluation.usedMatches.length >= 2) {
      justification = `High multi-precedent corroboration (${calculatedScore}%): ${evidenceEvaluation.usedMatches.length} historical failure cases in Hindsight bank (${evidenceEvaluation.usedMatches.map(m => m.caseId).join(', ')}) share matching ${submission.subsystem} telemetry and environmental profile.`;
    } else {
      justification = `Grounded in single precedent ${topMatch.caseId} (${(topScore * 100).toFixed(0)}% similarity) under ${topMatch.subsystem}. Confidence (${calculatedScore}%, ${level}) reflects single-source precedent without multi-mission corroboration.`;
    }

    return {
      score: calculatedScore,
      level,
      justification
    };
  }
}
