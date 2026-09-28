import { memoryStore } from '../memoryStore.ts';
import { hindsightService } from '../hindsightService.ts';
import { InvestigationService } from './InvestigationService.ts';
import {
  AnalysisResult,
  HistoricalFailureCase,
  NewAnomalySubmission,
  AgentEvolutionStage
} from '../../src/types/spaceMem.ts';

// Scenario 1: Failure A (Novel Anomaly, 0 Relevant Precedents)
export const NOVEL_ANOMALY_STEP1: NewAnomalySubmission = {
  caseId: 'DEMO-NOVEL-01',
  satellite: 'Astro-Probe-9',
  component: 'Hall Thruster XT-200 Anode',
  subsystem: 'Propulsion (PROP)',
  testType: 'Thermal Vacuum (TVAC)',
  failureTime: new Date().toISOString(),
  severity: 'CRITICAL',
  temperature: -45.0,
  voltage: 300.0,
  current: 4.5,
  pressure: '8.0e-7 Torr',
  vibration: '0.0 g RMS',
  symptoms: 'Anode plasma discharge extinction within 8 seconds of ignition command.',
  errorCodes: 'ERR_PROP_DISCHARGE_LOST, ANODE_FLAME_OUT',
  telemetryObservations: 'Discharge current collapsed from 4.5A to 0.08A immediately following high-voltage pulse. Propellant mass flow showed pressure spike.',
  engineerNotes: 'First qualification run of new Hall Thruster XT-200 in deep cryogenic TVAC chamber.'
};

// Validated Knowledge Retained from Failure A
export const CONFIRMED_EXPERIENCE_STEP3 = {
  caseId: 'CASE-2026-XENON-01',
  satellite: 'Astro-Probe-9',
  subsystem: 'Propulsion (PROP)' as const,
  component: 'Hall Thruster XT-200 Anode',
  componentType: 'Electric Propulsion Plasma Accelerator',
  testType: 'Thermal Vacuum (TVAC)' as const,
  failureMode: 'Cold-Ignition Plasma Extinction via Xenon Choke Liquefaction',
  confirmedRootCause:
    'Cryogenic propellant liquefaction in cathode pre-choke valve at -45°C due to inadequate heater duty cycle, causing liquid xenon slugging that choked plasma discharge.',
  correctiveActionTaken:
    'Programmed a mandatory 15-minute cathode heater pre-warm sequence (maintaining cathode valve > +10°C) prior to applying anode ignition voltage pulse.',
  outcome: 'RESOLVED' as const,
  whatWorked:
    '15-minute cathode heater thermal conditioning prevented xenon droplet formation, allowing stable 4.5A discharge across 20 consecutive TVAC ignition cycles.',
  whatFailed:
    'Increasing anode voltage from 300V to 350V and swapping external flow controller cabling failed to prevent extinction.',
  lessonsLearned:
    'Under cryogenic TVAC (< -20°C), Hall Thruster xenon lines must be thermally conditioned above gas condensation threshold before ignition.',
  checkFirstNextTime:
    'Verify cathode valve thermocouple reads >= +10°C before issuing thruster ignition sequence.'
};

// Scenario 2: Failure B (Similar Anomaly on 2nd Spacecraft, Recalls Failure A)
export const RELATED_ANOMALY_STEP5: NewAnomalySubmission = {
  caseId: 'DEMO-NEXTGEN-02',
  satellite: 'DeepSpace-Explorer-2',
  component: 'Hall Thruster XT-250 High-Power Anode',
  subsystem: 'Propulsion (PROP)',
  testType: 'Thermal Vacuum (TVAC)',
  failureTime: new Date().toISOString(),
  severity: 'CRITICAL',
  temperature: -42.0,
  voltage: 320.0,
  current: 4.8,
  pressure: '9.2e-7 Torr',
  vibration: '0.0 g RMS',
  symptoms: 'Thruster plasma flame-out 6 seconds into cold vacuum startup.',
  errorCodes: 'ERR_PROP_DISCHARGE_LOST, XENON_LINE_PULSE',
  telemetryObservations: 'Cathode ignition pulse struck successfully but anode arc extinguished as temperature settled at -42°C. Mass flow fluctuating.',
  engineerNotes: 'Next-generation propulsion qualification test under flight representative thermal envelope.'
};

// Validated Knowledge Retained from Failure B
export const CONFIRMED_EXPERIENCE_STEP6 = {
  caseId: 'CASE-2026-XENON-02',
  satellite: 'DeepSpace-Explorer-2',
  subsystem: 'Propulsion (PROP)' as const,
  component: 'Hall Thruster XT-250 High-Power Anode',
  componentType: 'Electric Propulsion Plasma Accelerator',
  testType: 'Thermal Vacuum (TVAC)' as const,
  failureMode: 'Cold-Soak Xenon Liquefaction & Transient Feed Choke',
  confirmedRootCause:
    'Sub-zero propellant feed valve line reached -42°C in TVAC without active thermal trace-heating, reproducing xenon phase condensation confirmed in CASE-2026-XENON-01.',
  correctiveActionTaken:
    'Retrofitted 2W Kapton foil heater strip onto anode feed manifold with automated pre-heat cycle before ignition.',
  outcome: 'RESOLVED' as const,
  whatWorked:
    'Dual-zone pre-heating (cathode > +10°C, manifold > +15°C) prevented liquid xenon droplet condensation, enabling rapid cold ignition in < 4 seconds across 15 TVAC qualification test runs.',
  whatFailed:
    'Attempting software ignition duration extension without thermal conditioning resulted in repeated cathode arc burnout.',
  lessonsLearned:
    'High-power electric propulsion thrusters (>300V) in cold vacuum require dual-zone pre-conditioning on both cathode and anode xenon lines.',
  checkFirstNextTime:
    'Verify manifold thermocouple reads > +15°C and cathode reads > +10°C before applying anode high-voltage strike.'
};

// Scenario 3: Failure C (Third Anomaly on Fleet Constellation, Recalls Multiple Precedents & Pattern)
export const CONSTELLATION_ANOMALY_STEP7: NewAnomalySubmission = {
  caseId: 'DEMO-FLEET-03',
  satellite: 'HelioOrbit-Constellation-4',
  component: 'Hall Thruster XT-250 Anode Discharge Core',
  subsystem: 'Propulsion (PROP)',
  testType: 'Thermal Vacuum (TVAC)',
  failureTime: new Date().toISOString(),
  severity: 'CRITICAL',
  temperature: -40.0,
  voltage: 310.0,
  current: 4.6,
  pressure: '8.5e-7 Torr',
  vibration: '0.0 g RMS',
  symptoms: 'Thruster plasma flame-out at T+7s during cold plateau startup with line pressure fluctuation.',
  errorCodes: 'ERR_PROP_DISCHARGE_LOST, XENON_CHOKE_ERR',
  telemetryObservations: 'Discharge impedance collapsed from 68Ω to 1.8Ω at -40°C. Mass flow telemetry showed acoustic ripple signature.',
  engineerNotes: 'Fleet qualification run for multi-spacecraft constellation deployment.'
};

export class DemoScenarioService {
  /**
   * Reset demo cases from memory store if present
   */
  public static resetDemoMemory(): void {
    const demoIds = [CONFIRMED_EXPERIENCE_STEP3.caseId, CONFIRMED_EXPERIENCE_STEP6.caseId];
    const allCases = memoryStore.getAllCases().filter(c => !demoIds.includes(c.id));
    (memoryStore as any).cases = allCases;
    console.log('[DemoScenarioService] Reset all demo cases from memory bank.');
  }

  /**
   * STEP 1 & 2: Investigate novel anomaly before any precedent is retained (SESSION 01)
   */
  public static async runStep1NovelAnomaly(): Promise<{
    step: number;
    title: string;
    description: string;
    analysisResult: AnalysisResult;
    hasRelevantPrecedent: boolean;
    precedentSummary: string;
  }> {
    // Ensure demo cases are removed from memory bank for Step 1
    DemoScenarioService.resetDemoMemory();

    const result = await InvestigationService.executeInvestigation(NOVEL_ANOMALY_STEP1);

    return {
      step: 1,
      title: 'STEP 1 & 2: Novel Anomaly (SESSION 01 — 0 Relevant Memories)',
      description:
        'SPACE-MEM executes Hindsight-First Investigation. As this is a novel propulsion failure, Hindsight recall discovers 0 relevant historical precedents. Groq reasons strictly from general aerospace physical principles with Low confidence.',
      analysisResult: result,
      hasRelevantPrecedent: false,
      precedentSummary:
        result.whatHappenedLastTime.summary || 'No sufficiently similar historical memory was found in the engineering memory bank.'
    };
  }

  /**
   * STEP 3 & 4: Engineer confirms root cause and RETAINS experience into Hindsight
   */
  public static async runStep3RetainExperience(): Promise<{
    step: number;
    title: string;
    description: string;
    retainedCase: HistoricalFailureCase;
    memoryId: string;
    source: string;
    bankId: string;
  }> {
    const newCase: HistoricalFailureCase = {
      id: CONFIRMED_EXPERIENCE_STEP3.caseId,
      satellite: CONFIRMED_EXPERIENCE_STEP3.satellite,
      subsystem: CONFIRMED_EXPERIENCE_STEP3.subsystem,
      component: CONFIRMED_EXPERIENCE_STEP3.component,
      componentType: CONFIRMED_EXPERIENCE_STEP3.componentType,
      testType: CONFIRMED_EXPERIENCE_STEP3.testType,
      date: new Date().toISOString().split('T')[0],
      missionPhase: 'Spacecraft Environmental Test',
      severity: 'CRITICAL',
      failureMode: CONFIRMED_EXPERIENCE_STEP3.failureMode,
      testConditions: {
        temperature: -45.0,
        voltage: 300.0,
        current: 4.5,
        pressure: '8.0e-7 Torr',
        vibration: '0.0 g RMS',
        duration: 'Cryogenic TVAC Ignition Run',
        environmentalNotes: 'Chamber cold shroud at -60°C'
      },
      telemetryReadings: {
        discharge_current: '4.5A nominal',
        pre_choke_pressure: '3.2 bar',
        cathode_temp_pre_ignite: '+14.2°C'
      },
      symptoms: [
        'Anode plasma discharge extinction within 8 seconds of ignition command',
        'Propellant mass flow pressure spike'
      ],
      errorCodes: ['ERR_PROP_DISCHARGE_LOST', 'ANODE_FLAME_OUT'],
      investigation: {
        initialHypothesis: 'Suspected high-voltage power supply collapse or harness capacitance.',
        diagnosticSteps: [
          'Logged high-speed oscilloscope telemetry of anode current pulse',
          'Characterized xenon gas liquefaction curves at -45°C vacuum',
          'Installed micro-thermocouple directly on cathode pre-choke valve'
        ],
        testsPerformed: [
          'Cryogenic chamber restart test with variable cathode pre-heat cycles',
          'Pressure pulse spectrometry on xenon feed line'
        ],
        findings: 'Confirmed liquid xenon phase transition in unheated choke tube at -45°C.',
        rootCause: CONFIRMED_EXPERIENCE_STEP3.confirmedRootCause
      },
      correctiveAction: {
        actionAttempted: CONFIRMED_EXPERIENCE_STEP3.correctiveActionTaken,
        configurationChange: 'ECR-PROP-2026-088: Mandatory 15-minute cathode heater pre-conditioning sequence',
        result: 'Achieved 20 consecutive successful cold ignitions with 0 plasma flameouts.',
        solved: true,
        whatWorked: CONFIRMED_EXPERIENCE_STEP3.whatWorked,
        whatFailedFirst: CONFIRMED_EXPERIENCE_STEP3.whatFailed,
        validationPerformed: 'Cryogenic TVAC qualification protocol completed with full engineer sign-off.'
      },
      lessonsLearned: {
        primaryLesson: CONFIRMED_EXPERIENCE_STEP3.lessonsLearned,
        checkFirstNextTime: CONFIRMED_EXPERIENCE_STEP3.checkFirstNextTime,
        flawedAssumptions: 'Assumed external harness impedance or high-voltage arc caused discharge drop.',
        importantWarnings: 'Human engineer sign-off required prior to modifying automated thruster ignition timers.'
      },
      timeline: [
        { step: 'Detection', title: 'Ignition Flameout', description: 'Discharge collapsed at T+8s', timestamp: 'T+00:00:00', status: 'critical' },
        { step: 'Investigation', title: 'Cathode Valve Probe', description: 'Discovered -45°C cold choke point', timestamp: 'T+04:30:00', status: 'info' },
        { step: 'Root cause', title: 'Liquefaction Confirmed', description: CONFIRMED_EXPERIENCE_STEP3.confirmedRootCause, timestamp: 'T+08:00:00', status: 'critical' },
        { step: 'Corrective action', title: 'Pre-Heat Cycle Applied', description: CONFIRMED_EXPERIENCE_STEP3.correctiveActionTaken, timestamp: 'T+12:00:00', status: 'completed' },
        { step: 'Validation', title: '20 Consecutive Starts Verified', description: 'Zero dropouts', timestamp: 'T+18:00:00', status: 'completed' },
        { step: 'Lessons learned', title: 'Retained into Hindsight Bank', description: CONFIRMED_EXPERIENCE_STEP3.lessonsLearned, timestamp: 'T+20:00:00', status: 'completed' }
      ],
      tags: ['propulsion', 'hall_thruster', 'xenon', 'cold_soak', 'retained_experience', 'flight_learning'],
      retainedDate: new Date().toISOString().split('T')[0],
      hindsightMemoryId: 'mem_case_2026_xenon_01',
      isSimulatedData: true
    };

    const retainRes = await hindsightService.retainMemory(newCase);

    return {
      step: 3,
      title: 'STEP 3 & 4: Engineer Confirms Root Cause & RETAINS Experience in Hindsight',
      description:
        `Engineers completed investigation, validated the 15-minute cathode pre-heat cycle, and formally retained the experience into Hindsight memory bank (${retainRes.source}). Memory ID: ${retainRes.memoryId}.`,
      retainedCase: newCase,
      memoryId: retainRes.memoryId,
      source: retainRes.source,
      bankId: hindsightService.getStatus().bankId
    };
  }

  /**
   * STEP 5: Submit related anomaly, RECALL newly retained experience (SESSION 02 — 1 Recalled Case)
   */
  public static async runStep5RelatedAnomaly(): Promise<{
    step: number;
    title: string;
    description: string;
    analysisResult: AnalysisResult;
    recalledExperience: any;
    reflectionPattern: any;
    investigationTransformation: {
      beforeRetain: string;
      afterRetain: string;
      recalledCaseId: string;
      similarityScore: number;
      timeSavedEstimate: string;
      preventedFailedLead: string;
    };
  }> {
    // Ensure Case 1 is in memory bank
    const existing = memoryStore.getCaseById(CONFIRMED_EXPERIENCE_STEP3.caseId);
    if (!existing) {
      await DemoScenarioService.runStep3RetainExperience();
    }

    const result = await InvestigationService.executeInvestigation(RELATED_ANOMALY_STEP5);
    const newlyRecalled = result.historicalMatches.find(m => m.caseId === CONFIRMED_EXPERIENCE_STEP3.caseId);

    return {
      step: 5,
      title: 'STEP 5: Related Anomaly Submitted (SESSION 02 — 1 Recalled Case)',
      description:
        'A second spacecraft program (DeepSpace-Explorer-2) encounters a similar cold-ignition dropout. SPACE-MEM immediately recalls CASE-2026-XENON-01 from Hindsight. Groq uses this precedent to isolate the xenon liquefaction mechanism, preventing 36 hours of useless cable swapping.',
      analysisResult: result,
      recalledExperience: newlyRecalled,
      reflectionPattern: result.hindsightReflection,
      investigationTransformation: {
        beforeRetain: 'Zero historical memory found. Required 24-48 hours of exploratory bench probing and erroneous harness replacements.',
        afterRetain: `Instant recall of ${CONFIRMED_EXPERIENCE_STEP3.caseId} (${Math.round((newlyRecalled?.similarityScore || 0.80) * 100)}% match). Directly isolated xenon liquefaction mechanism.`,
        recalledCaseId: CONFIRMED_EXPERIENCE_STEP3.caseId,
        similarityScore: newlyRecalled?.similarityScore || 0.80,
        timeSavedEstimate: '~36 engineering test hours saved',
        preventedFailedLead: CONFIRMED_EXPERIENCE_STEP3.whatFailed
      }
    };
  }

  /**
   * STEP 6: Engineer validates and RETAINS second failure (DeepSpace-Explorer-2 experience)
   */
  public static async runStep6RetainSecondExperience(): Promise<{
    step: number;
    title: string;
    description: string;
    retainedCase: HistoricalFailureCase;
    memoryId: string;
    source: string;
    bankId: string;
  }> {
    const newCase: HistoricalFailureCase = {
      id: CONFIRMED_EXPERIENCE_STEP6.caseId,
      satellite: CONFIRMED_EXPERIENCE_STEP6.satellite,
      subsystem: CONFIRMED_EXPERIENCE_STEP6.subsystem,
      component: CONFIRMED_EXPERIENCE_STEP6.component,
      componentType: CONFIRMED_EXPERIENCE_STEP6.componentType,
      testType: CONFIRMED_EXPERIENCE_STEP6.testType,
      date: new Date().toISOString().split('T')[0],
      missionPhase: 'Spacecraft Environmental Test',
      severity: 'CRITICAL',
      failureMode: CONFIRMED_EXPERIENCE_STEP6.failureMode,
      testConditions: {
        temperature: -42.0,
        voltage: 320.0,
        current: 4.8,
        pressure: '9.2e-7 Torr',
        vibration: '0.0 g RMS',
        duration: 'High-Power TVAC Cold Plateau',
        environmentalNotes: 'Chamber shroud at -55°C'
      },
      telemetryReadings: {
        discharge_current: '4.8A nominal',
        anode_manifold_temp: '+16.5°C with Kapton heater',
        cathode_temp_pre_ignite: '+12.8°C'
      },
      symptoms: [
        'Thruster plasma flame-out 6 seconds into cold vacuum startup',
        'Xenon line pulse transient'
      ],
      errorCodes: ['ERR_PROP_DISCHARGE_LOST', 'XENON_LINE_PULSE'],
      investigation: {
        initialHypothesis: 'Grounded in CASE-2026-XENON-01 precedent; isolated feed line temperature gradient.',
        diagnosticSteps: [
          'Compared telemetry against CASE-2026-XENON-01',
          'Monitored dual-zone thermal gradient between cathode valve and anode manifold'
        ],
        testsPerformed: ['Dual-zone pre-heat TVAC qualification run'],
        findings: 'Confirmed xenon condensation in anode feed manifold without active trace heating.',
        rootCause: CONFIRMED_EXPERIENCE_STEP6.confirmedRootCause
      },
      correctiveAction: {
        actionAttempted: CONFIRMED_EXPERIENCE_STEP6.correctiveActionTaken,
        configurationChange: 'ECR-PROP-2026-114: Retrofitted 2W Kapton foil heater strip onto anode manifold',
        result: 'Achieved rapid cold ignition in < 4 seconds across 15 consecutive TVAC runs.',
        solved: true,
        whatWorked: CONFIRMED_EXPERIENCE_STEP6.whatWorked,
        whatFailedFirst: CONFIRMED_EXPERIENCE_STEP6.whatFailed,
        validationPerformed: 'Completed dual-zone TVAC qualification with engineer sign-off.'
      },
      lessonsLearned: {
        primaryLesson: CONFIRMED_EXPERIENCE_STEP6.lessonsLearned,
        checkFirstNextTime: CONFIRMED_EXPERIENCE_STEP6.checkFirstNextTime,
        flawedAssumptions: 'Assumed cathode-only pre-heating was sufficient for higher-power thruster variants.',
        importantWarnings: 'Dual-zone pre-heating required before applying high-voltage pulse.'
      },
      timeline: [
        { step: 'Detection', title: 'Flameout at T+6s', description: 'Observed during cold plateau', timestamp: 'T+00:00:00', status: 'critical' },
        { step: 'Investigation', title: 'Recalled CASE-2026-XENON-01', description: 'Traced to manifold gradient', timestamp: 'T+01:00:00', status: 'info' },
        { step: 'Root cause', title: 'Liquefaction Confirmed', description: CONFIRMED_EXPERIENCE_STEP6.confirmedRootCause, timestamp: 'T+03:00:00', status: 'critical' },
        { step: 'Corrective action', title: 'Dual-Zone Heating Applied', description: CONFIRMED_EXPERIENCE_STEP6.correctiveActionTaken, timestamp: 'T+06:00:00', status: 'completed' },
        { step: 'Validation', title: '15 Starts Verified', description: 'Zero dropouts', timestamp: 'T+10:00:00', status: 'completed' }
      ],
      tags: ['propulsion', 'hall_thruster', 'xenon', 'dual_zone', 'retained_experience', 'flight_learning'],
      retainedDate: new Date().toISOString().split('T')[0],
      hindsightMemoryId: 'mem_case_2026_xenon_02',
      isSimulatedData: true
    };

    const retainRes = await hindsightService.retainMemory(newCase);

    return {
      step: 6,
      title: 'STEP 6: Engineer Confirms & RETAINS Second Case in Hindsight',
      description:
        `Engineers confirmed that high-power thrusters require dual-zone pre-heating and formally retained CASE-2026-XENON-02 into Hindsight bank (${retainRes.source}). Memory ID: ${retainRes.memoryId}.`,
      retainedCase: newCase,
      memoryId: retainRes.memoryId,
      source: retainRes.source,
      bankId: hindsightService.getStatus().bankId
    };
  }

  /**
   * STEP 7, 8 & 9: Multi-Mission Anomaly (SESSION 03 — 3 Recalled Cases & Recurring Pattern)
   */
  public static async runStep7MultiPrecedentAnomaly(): Promise<{
    step: number;
    title: string;
    description: string;
    analysisResult: AnalysisResult;
    recalledExperienceCount: number;
    recalledCaseIds: string[];
    reflectionPattern: any;
    evolutionStages: AgentEvolutionStage[];
  }> {
    // Ensure both Case 1 and Case 2 are retained in memory
    const existing1 = memoryStore.getCaseById(CONFIRMED_EXPERIENCE_STEP3.caseId);
    if (!existing1) {
      await DemoScenarioService.runStep3RetainExperience();
    }
    const existing2 = memoryStore.getCaseById(CONFIRMED_EXPERIENCE_STEP6.caseId);
    if (!existing2) {
      await DemoScenarioService.runStep6RetainSecondExperience();
    }

    const result = await InvestigationService.executeInvestigation(CONSTELLATION_ANOMALY_STEP7);
    const recalledIds = result.retrievedMemoryIds;

    const evolutionStages: AgentEvolutionStage[] = [
      {
        sessionNumber: 'SESSION 01',
        sessionTitle: 'Novel Thruster Ignition Failure (Astro-Probe-9)',
        satellite: 'Astro-Probe-9',
        component: 'Hall Thruster XT-200 Anode',
        memoriesRecalledCount: 0,
        recalledCaseIds: [],
        analysisType: 'First-Principles Aerospace Hypothesis',
        analysisSummary: 'Zero historical precedent in bank. Required general exploratory bench characterization. Confidence: Low (25%).',
        confidenceScore: 25,
        confidenceLevel: 'Low',
        hindsightStatus: 'No Precedent in Bank',
        newKnowledgeRetained: 'Retained CASE-2026-XENON-01 (15-min cathode pre-warm resolved liquefaction)'
      },
      {
        sessionNumber: 'SESSION 02',
        sessionTitle: 'Similar Cold Anomaly on 2nd Spacecraft (DeepSpace-Explorer-2)',
        satellite: 'DeepSpace-Explorer-2',
        component: 'Hall Thruster XT-250 High-Power Anode',
        memoriesRecalledCount: 1,
        recalledCaseIds: ['CASE-2026-XENON-01'],
        analysisType: 'Historical Precedent Comparison & False-Lead Prevention',
        analysisSummary: 'Recalled CASE-2026-XENON-01 (80% similarity). Prevented 36 hours of flow controller cable troubleshooting. Confidence: High (80%).',
        confidenceScore: 80,
        confidenceLevel: 'High',
        hindsightStatus: '1 Relevant Case Recalled',
        newKnowledgeRetained: 'Retained CASE-2026-XENON-02 (Dual-zone heating on manifold and cathode required)'
      },
      {
        sessionNumber: 'SESSION 03',
        sessionTitle: 'Constellation Fleet Deployment (HelioOrbit-Constellation-4)',
        satellite: 'HelioOrbit-Constellation-4',
        component: 'Hall Thruster XT-250 Anode Discharge Core',
        memoriesRecalledCount: recalledIds.length,
        recalledCaseIds: recalledIds,
        analysisType: 'Multi-Precedent Pattern Recognition & Prioritized Diagnostics',
        analysisSummary: `Hindsight recalled ${recalledIds.length} cases (${recalledIds.join(', ')}). Reflected recurring fleet-wide xenon phase condensation mechanism. Groq prioritized immediate dual-zone thermal conditioning before chamber vacuum pull. Confidence: High (${result.confidenceScore}%).`,
        confidenceScore: result.confidenceScore,
        confidenceLevel: result.confidenceLevel,
        hindsightStatus: `${recalledIds.length} Recalled Cases + Reflected Multi-Mission Pattern`,
        newKnowledgeRetained: 'Established fleet-wide thermal SOP preventing multi-satellite launch delay'
      }
    ];

    return {
      step: 7,
      title: 'STEP 7 to 9: Multi-Mission Constellation Anomaly (SESSION 03 — Multi-Case Pattern)',
      description:
        `HelioOrbit-Constellation-4 encounters a third related anomaly. Hindsight recalls ${recalledIds.length} accumulated cases (${recalledIds.join(', ')}). Hindsight REFLECT synthesizes a recurring multi-program pattern, and Groq produces an evidence-corroborated investigation with prioritized dual-zone thermal conditioning.`,
      analysisResult: result,
      recalledExperienceCount: recalledIds.length,
      recalledCaseIds: recalledIds,
      reflectionPattern: result.hindsightReflection,
      evolutionStages
    };
  }

  /**
   * Return dynamic Evolution Summary based on real cases in memory store
   */
  public static getEvolutionSummary(): AgentEvolutionStage[] {
    const allCases = memoryStore.getAllCases();
    const hasCase1 = Boolean(memoryStore.getCaseById(CONFIRMED_EXPERIENCE_STEP3.caseId));
    const hasCase2 = Boolean(memoryStore.getCaseById(CONFIRMED_EXPERIENCE_STEP6.caseId));

    const stages: AgentEvolutionStage[] = [
      {
        sessionNumber: 'SESSION 01',
        sessionTitle: 'Baseline Novel Investigation',
        satellite: 'Astro-Probe-9',
        component: 'Hall Thruster XT-200 Anode',
        memoriesRecalledCount: 0,
        recalledCaseIds: [],
        analysisType: 'First-Principles Hypothesis',
        analysisSummary: 'Zero prior cases in bank. Generic aerospace hypotheses with exploratory testing.',
        confidenceScore: 25,
        confidenceLevel: 'Low',
        hindsightStatus: 'No Precedent in Bank',
        newKnowledgeRetained: 'CASE-2026-XENON-01 (15-min cathode pre-heat cycle)'
      }
    ];

    if (hasCase1) {
      stages.push({
        sessionNumber: 'SESSION 02',
        sessionTitle: 'Cross-Program Precedent Grounding',
        satellite: 'DeepSpace-Explorer-2',
        component: 'Hall Thruster XT-250 High-Power Anode',
        memoriesRecalledCount: 1,
        recalledCaseIds: ['CASE-2026-XENON-01'],
        analysisType: 'Historical Precedent Comparison',
        analysisSummary: 'Recalled CASE-2026-XENON-01 (80% similarity). Prevented repeating disproven cable swap.',
        confidenceScore: 80,
        confidenceLevel: 'High',
        hindsightStatus: '1 Relevant Case Recalled',
        newKnowledgeRetained: 'CASE-2026-XENON-02 (Dual-zone manifold & cathode thermal trace)'
      });
    }

    if (hasCase2) {
      stages.push({
        sessionNumber: 'SESSION 03',
        sessionTitle: 'Fleet Constellation Pattern-Aware Investigation',
        satellite: 'HelioOrbit-Constellation-4',
        component: 'Hall Thruster XT-250 Anode Discharge Core',
        memoriesRecalledCount: 3,
        recalledCaseIds: ['CASE-2026-XENON-01', 'CASE-2026-XENON-02', 'CASE-008'],
        analysisType: 'Multi-Case Pattern Recognition & Prioritized Diagnostics',
        analysisSummary: 'Corroborated across 3 historical cases. Reflected fleet-wide xenon liquefaction mechanism.',
        confidenceScore: 88,
        confidenceLevel: 'High',
        hindsightStatus: '3 Relevant Cases Recalled + Pattern Reflected',
        newKnowledgeRetained: 'Fleet qualification thermal procedure'
      });
    }

    return stages;
  }
}
