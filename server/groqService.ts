import Groq from 'groq-sdk';
import { AssistantMessage, RecommendedInvestigationStep } from '../src/types/spaceMem.ts';
import { memoryStore } from './memoryStore.ts';
import { hindsightService } from './hindsightService.ts';
import { SafetyGuardService } from './services/SafetyGuardService.ts';

export interface GroqInvestigationInput {
  submission: {
    satellite: string;
    subsystem: string;
    component: string;
    testType: string;
    temperature: number;
    voltage: number;
    current: number;
    pressure: string;
    vibration: string;
    errorCodes: string;
    symptoms: string;
    telemetryObservations: string;
  };
  recalledMemories: any[];
  hasSufficientEvidence: boolean;
  relevanceStatement: string;
  hindsightReflection?: any;
}

export interface GroqInvestigationOutput {
  failureMode: string;
  whatHappenedSummary: string;
  previousWhatFailedFirst: string;
  likelyRootCauses: string[];
  historicalEvidence: string[];
  patterns: string[];
  recommendedActions: RecommendedInvestigationStep[];
  confidence: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  confidenceJustification: string;
  uncertainties: string[];
  memoryUsed: Array<{
    caseId: string;
    lesson: string;
    pattern?: string;
    influence: string;
  }>;
  isFallback: boolean;
  sourceLabel: string;
}

export class GroqService {
  private groqClient: Groq | null = null;
  private modelName: string;

  constructor() {
    this.modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.groqClient = new Groq({ apiKey: apiKey.trim() });
      } catch (err: any) {
        console.warn('[SPACE-MEM Groq] Failed to initialize Groq client:', err.message || err);
        this.groqClient = null;
      }
    }
  }

  public getStatus(): { connected: boolean; model: string } {
    return {
      connected: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0),
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
    };
  }

  /**
   * Execute chat completion via Groq with timeout and error handling
   */
  public async createChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    responseFormatJson: boolean = false
  ): Promise<{ content: string; source: 'GROQ' | 'FALLBACK'; error?: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    if (!apiKey || apiKey.trim().length === 0) {
      return {
        content: '',
        source: 'FALLBACK',
        error: 'GROQ_API_KEY is not configured in backend environment.'
      };
    }

    try {
      const client = this.groqClient || new Groq({ apiKey: apiKey.trim() });
      this.groqClient = client;

      const requestOptions: any = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      };

      if (responseFormatJson) {
        requestOptions.response_format = { type: 'json_object' };
      }

      // 15-second timeout safeguard for aerospace reliability
      const completionPromise = client.chat.completions.create(requestOptions);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Groq API request timed out after 15000ms')), 15000)
      );

      const response = await Promise.race([completionPromise, timeoutPromise]);
      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        source: 'GROQ'
      };
    } catch (err: any) {
      console.warn('[SPACE-MEM Groq] Error during Groq API call:', err.message || err);
      return {
        content: '',
        source: 'FALLBACK',
        error: err.message || 'Groq API request failed'
      };
    }
  }

  /**
   * Reason over anomaly using historical engineering knowledge from Hindsight via Groq LLM
   */
  public async generateInvestigation(input: GroqInvestigationInput): Promise<GroqInvestigationOutput> {
    const systemPrompt = `You are SPACE-MEM, an AI spacecraft failure investigation assistant.

You analyze spacecraft anomalies using historical engineering knowledge retrieved from Hindsight.

You must:
- analyze the current failure
- compare it with historical failures
- identify recurring patterns
- distinguish evidence from hypotheses
- identify likely root causes
- provide confidence levels
- recommend investigation steps
- clearly cite historical memory/context when provided
- never invent historical incidents
- never claim an investigation was performed if it was not
- defer final engineering decisions to qualified engineers.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a valid JSON object matching this exact schema:
{
  "failureMode": "Precise engineering failure mode name",
  "summary": "1-2 sentences summarizing root cause hypothesis and historical precedent or stating no match was found",
  "whatHappenedSummary": "Detailed historical comparison",
  "previousWhatFailedFirst": "Historical false lead to avoid repeating (or 'N/A' if no precedent)",
  "likelyRootCauses": ["Primary root cause", "Secondary mechanism if applicable"],
  "historicalEvidence": ["Specific telemetry/root cause from recalled memories"],
  "patterns": ["Identified cross-case failure pattern or mechanism"],
  "recommendedActions": [
    {
      "stepNumber": 1,
      "actionTitle": "Specific bench or telemetry check",
      "rationale": "Directly grounded in evidence",
      "historicalPrecedentCaseId": "CASE-XXX (only if real match from context, else omit)",
      "cautionNotice": "AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED.",
      "verificationProcedure": "Specific calibration/probing procedure"
    }
  ],
  "confidence": 85,
  "confidenceLevel": "High" | "Medium" | "Low",
  "confidenceJustification": "Reasoning based on evidence match count and telemetry overlap",
  "uncertainties": ["Key engineering uncertainties requiring bench verification"],
  "memoryUsed": [
    {
      "caseId": "CASE-XXX",
      "lesson": "Key lesson learned from this case",
      "pattern": "Pattern relating to current failure",
      "influence": "How this memory influenced the analysis"
    }
  ]
}`;

    const memoryContext = input.hasSufficientEvidence && input.recalledMemories.length > 0
      ? `RELEVANT HISTORICAL MEMORIES RECALLED FROM HINDSIGHT:
${JSON.stringify(input.recalledMemories, null, 2)}

HINDSIGHT REFLECTION RESULTS:
${JSON.stringify(input.hindsightReflection || {}, null, 2)}`
      : `NO SUFFICIENTLY SIMILAR HISTORICAL MEMORY WAS FOUND in Hindsight bank.
No prior case reached the relevance threshold. State clearly that this is an unprecedented anomaly in the bank and base hypotheses strictly on general aerospace physics principles. Do NOT invent past incidents or case IDs.`;

    const userPrompt = `Investigate the following spacecraft failure:

CURRENT SPACECRAFT ANOMALY:
- Satellite: ${input.submission.satellite}
- Subsystem: ${input.submission.subsystem}
- Component: ${input.submission.component}
- Test Environment: ${input.submission.testType}
- Test Conditions: Temperature=${input.submission.temperature}°C, Voltage=${input.submission.voltage}V, Current=${input.submission.current}A, Pressure=${input.submission.pressure}, Vibration=${input.submission.vibration}
- Observed Symptoms: ${input.submission.symptoms}
- Error Codes: ${input.submission.errorCodes}
- Telemetry Observations: ${input.submission.telemetryObservations}

EVIDENCE CONTEXT:
- Has Sufficient Evidence: ${input.hasSufficientEvidence}
- Status: ${input.relevanceStatement}

${memoryContext}

Provide the structured investigation JSON according to system prompt instructions.`;

    const groqResult = await this.createChatCompletion(systemPrompt, userPrompt, true);

    if (groqResult.source === 'GROQ' && groqResult.content) {
      try {
        let cleanJsonText = groqResult.content.trim();
        // Strip markdown code block if present
        if (cleanJsonText.startsWith('```')) {
          cleanJsonText = cleanJsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleanJsonText);

        return {
          failureMode: parsed.failureMode || `${input.submission.component} Operational Anomaly`,
          whatHappenedSummary: parsed.whatHappenedSummary || parsed.summary || 'Investigation executed by Groq LLM grounded in Hindsight engineering memory.',
          previousWhatFailedFirst: parsed.previousWhatFailedFirst || 'N/A',
          likelyRootCauses: Array.isArray(parsed.likelyRootCauses) && parsed.likelyRootCauses.length > 0
            ? parsed.likelyRootCauses
            : [parsed.failureMode || 'Component operational anomaly'],
          historicalEvidence: Array.isArray(parsed.historicalEvidence) ? parsed.historicalEvidence : [],
          patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
          recommendedActions: Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0
            ? parsed.recommendedActions
            : [],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
          confidenceLevel: parsed.confidenceLevel || (parsed.confidence >= 75 ? 'High' : parsed.confidence >= 50 ? 'Medium' : 'Low'),
          confidenceJustification: parsed.confidenceJustification || 'Analysis synthesized by Groq reasoning over Hindsight memories.',
          uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties : [],
          memoryUsed: Array.isArray(parsed.memoryUsed) ? parsed.memoryUsed : [],
          isFallback: false,
          sourceLabel: `Groq (${this.modelName})`
        };
      } catch (parseErr: any) {
        console.warn('[SPACE-MEM Groq] Failed to parse JSON from Groq output:', parseErr.message);
      }
    }

    // High-Fidelity Deterministic Aerospace Fallback (Offline / When Groq is Unreachable)
    // Explicitly labeled as DEMO/FALLBACK as required by Task 10
    return this.generateDeterministicFallback(input, groqResult.error);
  }

  /**
   * Deterministic Aerospace Fallback labeled clearly as DEMO/FALLBACK (Task 10)
   */
  private generateDeterministicFallback(
    input: GroqInvestigationInput,
    errorMessage?: string
  ): GroqInvestigationOutput {
    const topMatch = input.hasSufficientEvidence && input.recalledMemories.length > 0 ? input.recalledMemories[0] : null;
    const primaryCase = topMatch ? memoryStore.getCaseById(topMatch.caseId) : null;

    let whatHappenedSummary = '';
    let previousWhatFailedFirst = '';
    let likelyRootCauses: string[] = [];
    let patterns: string[] = [];
    let recommendations: RecommendedInvestigationStep[] = [];
    let memoryUsed: Array<{ caseId: string; lesson: string; pattern?: string; influence: string }> = [];

    if (input.hasSufficientEvidence && topMatch) {
      whatHappenedSummary = `[DEMO/FALLBACK] In ${topMatch.caseId} on ${topMatch.satellite} (${topMatch.subsystem}), identical behavior occurred during ${primaryCase?.testType || input.submission.testType}. Investigation confirmed ${topMatch.previousRootCause}.`;
      previousWhatFailedFirst = topMatch.previousWhatFailed || 'Assuming external harness cabling without internal component probing.';
      likelyRootCauses = [topMatch.previousRootCause || `${input.submission.component} parameter drift under qualification stress`];
      patterns = [input.hindsightReflection?.patternStatement || `Recurring failure mechanism matching ${topMatch.caseId} in ${input.submission.subsystem}`];

      recommendations = [
        {
          stepNumber: 1,
          actionTitle: `Probe ${input.submission.component} Telemetry Node Against Baseline`,
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
          actionTitle: `Characterize Thermal & Electrical Boundary Margins (${input.submission.temperature}°C)`,
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
          verificationProcedure: 'Perform component qualification re-test at boundary limits to verify restored margins.'
        }
      ];

      memoryUsed = input.recalledMemories.map((m: any) => ({
        caseId: m.caseId,
        lesson: m.primaryLesson || 'Verify circuit stability at operating temperature boundaries.',
        pattern: `Subsystem ${m.subsystem} failure mode: ${m.previousSymptoms?.[0] || 'telemetry anomaly'}`,
        influence: `Informed root cause identification and prevented repetition of "${m.previousWhatFailed || 'external harness troubleshooting'}".`
      }));
    } else {
      whatHappenedSummary = '[DEMO/FALLBACK] No sufficiently similar historical memory was found in the engineering memory bank. Investigation is initiated from first-principles engineering hypotheses.';
      previousWhatFailedFirst = 'No prior case record available in memory bank. Avoid speculative flight configuration changes without bench baseline characterization.';
      likelyRootCauses = [`Unprecedented ${input.submission.component} anomaly requiring first-principles isolation`];
      patterns = ['Insufficient historical evidence in Hindsight bank to establish a recurring pattern.'];

      recommendations = [
        {
          stepNumber: 1,
          actionTitle: `Establish Telemetry Baseline for ${input.submission.component}`,
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

    const confidenceScore = topMatch ? Math.round(topMatch.similarityScore * 100) : 25;

    return {
      failureMode: primaryCase ? primaryCase.failureMode : `${input.submission.component} Operational Anomaly`,
      whatHappenedSummary,
      previousWhatFailedFirst,
      likelyRootCauses,
      historicalEvidence: input.recalledMemories.map(
        (m: any) => `[DEMO/FALLBACK] ${m.caseId} (${m.satellite}): ${m.previousRootCause}`
      ),
      patterns,
      recommendedActions: recommendations,
      confidence: confidenceScore,
      confidenceLevel: confidenceScore >= 75 ? 'High' : confidenceScore >= 50 ? 'Medium' : 'Low',
      confidenceJustification: `DEMO/FALLBACK deterministic reasoning (${errorMessage ? `Groq: ${errorMessage}` : 'GROQ_API_KEY not provided'}). Grounded in Hindsight historical bank.`,
      uncertainties: [
        'Requires bench oscilloscopy to verify internal semiconductor vs harness capacitance',
        'Human engineer verification required before operational action'
      ],
      memoryUsed,
      isFallback: true,
      sourceLabel: 'DEMO/FALLBACK (Offline Deterministic Mode)'
    };
  }

  /**
   * Investigation Assistant Chat grounded in Hindsight engineering memories via Groq LLM
   */
  public async assistantChat(userMessage: string, history: AssistantMessage[] = []): Promise<AssistantMessage> {
    const allCases = memoryStore.getAllCases();
    const query = userMessage.toLowerCase();

    // Multi-signal aerospace keyword scan
    const queryWords = query.split(/[\s,;.?!]+/).filter(w => w.length > 2);
    const criticalKeywords = [
      'voltage', 'ripple', 'instability', 'uvlo', 'jitter', 'thermal', 'soak',
      'vibration', 'leak', 'reset', 'watchdog', 'bit slip', 'rf', 'drop', 'ground',
      'tvac', 'reaction wheel', 'pcdu', 'star tracker', 'transponder', 'thruster', 'xenon', 'heat pipe'
    ];

    const scoredCases = allCases.map(c => {
      let hits = 0;
      const text = `${c.id} ${c.satellite} ${c.subsystem} ${c.component} ${c.componentType} ${c.failureMode} ${c.testType} ${c.investigation.rootCause} ${c.correctiveAction.actionAttempted} ${c.correctiveAction.whatWorked} ${c.lessonsLearned.primaryLesson} ${c.tags.join(' ')}`.toLowerCase();

      for (const w of queryWords) {
        if (text.includes(w)) hits += criticalKeywords.includes(w) ? 2 : 1;
      }
      return { caseItem: c, hits };
    });

    scoredCases.sort((a, b) => b.hits - a.hits);
    const relevantCases = scoredCases.filter(sc => sc.hits > 0).slice(0, 3).map(sc => sc.caseItem);

    const hasMemories = relevantCases.length > 0;
    const citedCaseIds = relevantCases.map(c => c.id);
    const memorySource = hindsightService.getStatus().memorySource;

    let answerText = '';

    const memoryContext = hasMemories
      ? `RELEVANT HISTORICAL CASES RETRIEVED FROM HINDSIGHT BANK (${memorySource}):
${relevantCases.map(c => `[Case ${c.id}] Spacecraft: ${c.satellite}, Subsystem: ${c.subsystem}, Component: ${c.component}
- Test Environment: ${c.testType} (${c.testConditions.temperature}°C, ${c.testConditions.voltage}V)
- Failure Mode: ${c.failureMode}
- Confirmed Root Cause: ${c.investigation.rootCause}
- Validated Corrective Action: ${c.correctiveAction.actionAttempted}
- What Worked: ${c.correctiveAction.whatWorked}
- What Failed First: ${c.correctiveAction.whatFailedFirst}
- Lessons Learned: ${c.lessonsLearned.primaryLesson}
- Warnings: ${c.lessonsLearned.importantWarnings}`).join('\n\n')}`
      : 'NO SUFFICIENTLY SIMILAR HISTORICAL MEMORY WAS FOUND in the engineering memory bank for this query.';

    const systemPrompt = `You are SPACE-MEM Investigation Assistant, powered by Groq LLM and grounded in Hindsight engineering memory for spacecraft reliability engineers.

CRITICAL INSTRUCTIONS (MANDATORY):
1. If historical cases were found, cite them explicitly: "Based on Hindsight engineering memory (recalled cases: ${citedCaseIds.join(', ')} from ${memorySource})..."
2. If NO sufficiently similar historical memory was found, YOU MUST EXPLICITLY STATE:
   "No sufficiently similar historical memory was found in the engineering memory bank."
   Do NOT invent spacecraft names, case IDs, or previous incidents.
3. Organize your response into EXACTLY four tagged sections:
   [HISTORICAL EVIDENCE] - Concrete telemetry values, failure modes, root causes, and outcomes from retrieved memories (or state no matching memory exists).
   [CURRENT CASE / CONTEXT] - How this applies to ongoing satellite anomaly evaluations.
   [AI HYPOTHESIS] - Plausible engineering hypotheses, clearly framed as hypotheses not verified facts.
   [ENGINEER VALIDATION REQUIRED] - Clear safety notice and concrete bench/telemetry procedures qualified engineers must perform before flight action.
4. Autonomous commanding of spacecraft is strictly forbidden. Maintain professional aerospace engineering rigor.`;

    const userPrompt = `User Engineering Question: "${userMessage}"

${memoryContext}`;

    const groqResult = await this.createChatCompletion(systemPrompt, userPrompt, false);

    if (groqResult.source === 'GROQ' && groqResult.content) {
      answerText = groqResult.content.trim();
    } else {
      // Deterministic aerospace response labeled as DEMO/FALLBACK
      if (hasMemories) {
        const c = relevantCases[0];
        answerText = `[DEMO/FALLBACK MODE] Based on Hindsight engineering memory (recalled cases: ${citedCaseIds.join(', ')} from ${memorySource}):

[HISTORICAL EVIDENCE]
Case ${c.id} on ${c.satellite} (${c.subsystem}) encountered: "${c.failureMode}" under ${c.testType} (${c.testConditions.temperature}°C).
- Confirmed Root Cause: ${c.investigation.rootCause}
- What Failed First (Do NOT Repeat): ${c.correctiveAction.whatFailedFirst}
- Validated Corrective Action: ${c.correctiveAction.whatWorked}
- Primary Lesson Learned: ${c.lessonsLearned.primaryLesson}
- Memory Source: ${memorySource} (Bank: ${hindsightService.getStatus().bankId})

[CURRENT CASE / CONTEXT]
When evaluating similar telemetry anomalies, verify whether thermal gradients or transient spikes match the historical signature of ${c.id}.

[AI HYPOTHESIS]
The observed telemetry instability is likely driven by temperature-dependent semiconductor parameter shift or mechanical interface relaxation rather than random component wearout.

[ENGINEER VALIDATION REQUIRED]
${SafetyGuardService.MANDATORY_SAFETY_NOTICE}
1. Probe active internal switching nodes with high-bandwidth oscilloscope.
2. Review design margins against the cryogenic/hot boundary qualification baseline.
3. Obtain spacecraft systems engineering review before implementing any hardware rework.`;
      } else {
        answerText = `[DEMO/FALLBACK MODE] No sufficiently similar historical memory was found in the engineering memory bank.

[HISTORICAL EVIDENCE]
No corresponding case in the space-mem-engineering bank matched the query parameters. No historical precedent exists in the current memory bank.

[CURRENT CASE / CONTEXT]
For novel anomaly profiles without precedent, reference standard aerospace qualification standards (e.g., ECSS-E-ST-20C for Electrical, ECSS-E-ST-32C for Structures).

[AI HYPOTHESIS]
Evaluate standard aerospace stress vectors for this subsystem: thermal-vacuum transition boundary effects, grounding plane offsets, or test harness vibration fatigue.

[ENGINEER VALIDATION REQUIRED]
${SafetyGuardService.MANDATORY_SAFETY_NOTICE}
1. Establish an anomaly investigation team and isolate the telemetry signature.
2. Conduct isolated bench unit testing before escalating to flight hardware.`;
      }
    }

    answerText = SafetyGuardService.sanitizeAssistantResponse(answerText);

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: answerText,
      timestamp: new Date().toISOString(),
      historicalEvidenceUsed: citedCaseIds,
      hasInsufficientEvidence: !hasMemories
    };
  }

  /**
   * Before vs After Demo comparison generator
   */
  public generateBeforeVsAfterDemo(caseId = 'CASE-001') {
    const historicalCase = memoryStore.getCaseById(caseId) || memoryStore.getAllCases()[0];
    const memorySource = hindsightService.getStatus().memorySource;

    const withoutMemory = {
      title: 'WITHOUT MEMORY — START FROM ZERO',
      badge: 'GENERIC AI (NO HINDSIGHT GROUNDING)',
      anomalySummary: `Anomaly detected on ${historicalCase.component}. Telemetry indicates voltage/current variance and operational dropout during ${historicalCase.testType}.`,
      aiResponse: `“Anomaly detected in subsystem. Possible causes include voltage instability, thermal stress, sensor error, harness degradation, or component aging. Recommended steps:
1. Inspect all external cabling and test harness.
2. Replace power harness and recalibrate ground power supply.
3. Power cycle unit and observe if error persists.
4. If problem continues, replace entire unit assembly.”`,
      riskAnalysis: [
        'Wastes 36+ critical chamber hours swapping external cables that were never faulty.',
        'High probability of repeating past failed fixes (e.g., replacing the chamber harness).',
        'Cannot pinpoint cryogenic temperature coefficient anomalies without memory.',
        'May recommend dangerous bypasses (e.g. widening protection limits) that damage hardware.'
      ],
      engineeringCost: 'Estimated 48 - 72 test hours lost; $120,000+ chamber downtime.'
    };

    const withSpaceMem = {
      title: 'WITH SPACE-MEM — LEARN FROM ENGINEERING HISTORY',
      badge: `HINDSIGHT GROUNDED + GROQ (${memorySource})`,
      anomalySummary: `Exact match found: Case ${historicalCase.id} on ${historicalCase.satellite} encountered identical ${historicalCase.failureMode} at ${historicalCase.testConditions.temperature}°C in ${historicalCase.testType}.`,
      aiResponse: `“Based on Hindsight engineering memory (Case ${historicalCase.id} on ${historicalCase.satellite}):
A previous anomaly showed corresponding symptoms under ${historicalCase.testType} cold soak.

WHAT FAILED FIRST (DO NOT REPEAT):
${historicalCase.correctiveAction.whatFailedFirst}

CONFIRMED ROOT CAUSE:
${historicalCase.investigation.rootCause}

VALIDATED CORRECTIVE ACTION:
${historicalCase.correctiveAction.actionAttempted}

RECOMMENDED INVESTIGATION PATH:
1. Probe active internal nodes for oscillation directly.
2. Measure phase margin at sub-zero soak plateau (${historicalCase.testConditions.temperature}°C).
3. Validate hardware configuration against ${historicalCase.correctiveAction.configurationChange}.”`,
      evidencePrecedent: `Case ${historicalCase.id} (${historicalCase.date}) - Validated in ${historicalCase.testType}`,
      engineeringCost: 'Diagnosed in 45 minutes; prevents repeating 36 hours of useless cable troubleshooting.'
    };

    return {
      caseId: historicalCase.id,
      component: historicalCase.component,
      subsystem: historicalCase.subsystem,
      testType: historicalCase.testType,
      temperature: historicalCase.testConditions.temperature,
      memorySource,
      withoutMemory,
      withSpaceMem
    };
  }
}

export const groqService = new GroqService();
export const geminiService = groqService; // Backwards compatibility alias
