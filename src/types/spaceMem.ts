/**
 * Spacecraft Failure Memory & Investigation Assistant Types
 */

export type SubsystemType =
  | 'Electrical Power (EPS)'
  | 'Attitude & Orbit Control (ADCS)'
  | 'Telemetry & Telecommand (TT&C)'
  | 'Thermal Control (TCS)'
  | 'On-Board Computer (OBC)'
  | 'Propulsion (PROP)'
  | 'Optical Payload (PL)'
  | 'Structures & Mechanisms (SMA)';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TestType =
  | 'Thermal Vacuum (TVAC)'
  | 'Vibration & Acoustic Test'
  | 'Hardware-in-the-Loop (HIL)'
  | 'EMI/EMC Qualification'
  | 'On-Orbit Commissioning'
  | 'Thermal Cycling'
  | 'Integrated System Test'
  | 'Pyroshock Qualification';

export type MissionPhase =
  | 'Component Qualification'
  | 'Subsystem Integration'
  | 'Spacecraft Environmental Test'
  | 'Integrated System Test'
  | 'Launch Pad Readiness'
  | 'In-Orbit Commissioning'
  | 'Nominal Mission Ops';

export interface TestConditions {
  temperature: number; // Celsius
  voltage: number; // Volts
  current: number; // Amperes
  pressure: string; // e.g. "1.2e-6 Torr"
  vibration: string; // e.g. "8.4 g RMS"
  duration: string; // e.g. "48 hrs cold soak"
  environmentalNotes?: string;
}

export interface InvestigationTimelineStep {
  step: 'Detection' | 'Symptoms' | 'Investigation' | 'Hypothesis' | 'Testing' | 'Root cause' | 'Corrective action' | 'Validation' | 'Lessons learned';
  title: string;
  description: string;
  timestamp?: string;
  status?: 'completed' | 'critical' | 'alert' | 'info';
}

export interface HistoricalFailureCase {
  id: string; // e.g. "CASE-001"
  satellite: string; // e.g. "AeroSat-4B"
  subsystem: SubsystemType;
  component: string;
  componentType: string;
  testType: TestType;
  date: string;
  missionPhase: MissionPhase;
  severity: SeverityLevel;
  failureMode: string;
  
  testConditions: TestConditions;
  telemetryReadings: Record<string, string | number>;
  symptoms: string[];
  errorCodes: string[];

  investigation: {
    initialHypothesis: string;
    diagnosticSteps: string[];
    testsPerformed: string[];
    findings: string;
    rootCause: string;
  };

  correctiveAction: {
    actionAttempted: string;
    configurationChange: string;
    result: string;
    solved: boolean;
    whatWorked: string;
    whatFailedFirst: string;
    validationPerformed: string;
  };

  lessonsLearned: {
    primaryLesson: string;
    checkFirstNextTime: string;
    flawedAssumptions: string;
    importantWarnings: string;
  };

  timeline: InvestigationTimelineStep[];
  tags: string[];
  retainedDate: string;
  hindsightMemoryId?: string;
  isSimulatedData: boolean;
}

export interface NewAnomalySubmission {
  caseId?: string;
  satellite: string;
  component: string;
  subsystem: SubsystemType;
  testType: TestType;
  failureTime: string;
  severity: SeverityLevel;
  
  // Telemetry & Conditions
  temperature: number;
  voltage: number;
  current: number;
  pressure: string;
  vibration: string;
  duration?: string;
  
  telemetryObservations: string;
  errorCodes: string;
  symptoms: string;
  engineerNotes?: string;
  uploadedReportName?: string;
}

export interface HistoricalMatchItem {
  caseId: string;
  satellite: string;
  subsystem: string;
  component: string;
  similarityScore: number; // 0.0 - 1.0 (calculated)
  matchingFactors: string[];
  previousSymptoms: string[];
  previousRootCause: string;
  previousCorrectiveAction: string;
  previousOutcome: string;
  previousWhatFailed: string;
  primaryLesson: string;
  relevanceExplanation: string;
}

export interface RecommendedInvestigationStep {
  stepNumber: number;
  actionTitle: string;
  rationale: string;
  historicalPrecedentCaseId?: string;
  cautionNotice: string;
  verificationProcedure: string;
}

export interface AnalysisResult {
  investigationId: string;
  auditId: string;
  generatedAt: string;
  currentAnomaly: {
    satellite: string;
    component: string;
    subsystem: SubsystemType;
    failureMode: string;
    severity: SeverityLevel;
    detectedSymptoms: string[];
    telemetryDelta: string;
    errorCodes: string[];
  };
  currentCase: NewAnomalySubmission;
  memorySource: 'HINDSIGHT CLOUD' | 'LOCAL DEMO MEMORY';
  hindsightConnected: boolean;
  memoryBankId: string;
  memoryCount: number;
  retrievedMemoryIds: string[];
  retrievedMemories: HistoricalMatchItem[];
  evidenceSummary: string;
  historicalEvidence: string[];
  currentCaseObservations: string[];
  aiHypotheses: string[];
  recommendedVerificationSteps: RecommendedInvestigationStep[];
  conflictingEvidence?: {
    detected: boolean;
    conflicts: Array<{
      caseId: string;
      observation: string;
      conclusion: string;
      outcome: string;
    }>;
    statement: string;
  };
  confidenceLevel: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
  confidenceJustification: string;
  engineerValidationRequired: boolean;
  safetyNotice: string;
  
  // "What Happened Last Time?"
  whatHappenedLastTime: {
    summary: string;
    previousCaseId: string;
    previousSatellite: string;
    previousRootCause: string;
    previousCorrectiveAction: string;
    previousOutcome: string;
    previousWhatFailedFirst: string;
    keyLessonLearned: string;
  };

  historicalMatches: HistoricalMatchItem[];
  
  recommendations: RecommendedInvestigationStep[];
  
  confidence: {
    level: 'High' | 'Medium' | 'Low';
    score: number; // 0 - 100
    evidenceCount: number;
    justification: string;
  };

  evidenceUsed: Array<{
    caseId: string;
    memoryType: string;
    relevantHistoricalInfo: string;
    date: string;
    retainedDate: string;
    memorySource?: string;
    subsystem?: string;
    testType?: string;
  }>;

  disclaimer: string;
  memoryEngineStatus: string;
  hindsightReflection?: HindsightReflectionResult;
  likelyRootCauses?: string[];
  patterns?: string[];
  uncertainties?: string[];
  memoryUsedSummary?: MemoryUsedSummary;
}

export interface MemoryUsedSummary {
  historicalCasesRecalledCount: number;
  historicalIncidentsRecalled: string[];
  memoryInfluencedAnalysis?: boolean;
  relevantLessons?: string[];
  patternsIdentified?: string[];
  explanation?: string;
  relevantMemories: Array<{
    caseId: string;
    satellite: string;
    subsystem: string;
    component: string;
    failureMode: string;
    similarityScore: number;
    keyLesson: string;
    whatWorked: string;
    whatFailedFirst: string;
  }>;
  reflectedPatterns: string[];
  newKnowledgeLearned: string;
  memoryImpact: 'INFLUENCED' | 'NEW_KNOWLEDGE_BASELINE';
  memoryImpactStatement: string;
  engineUsed: string;
}

export interface HindsightReflectionResult {
  hasPattern: boolean;
  patternStatement: string; // If insufficient: "Insufficient historical evidence to establish a reliable pattern."
  recurringFailureMechanism?: string;
  connectionsIdentified?: Array<{
    caseId: string;
    connection: string;
    subsystem: string;
  }>;
  reflectedPatternObservation?: string;
  lessonsLearnedSynthesis?: string;
  supportingCaseIds: string[];
  bankMission: string;
  bankDirectives: string[];
  reflectionCategories: {
    historicalEvidence: string[];
    reflectedPattern: string[];
    aiHypothesis: string[];
    engineerValidation: string[];
  };
  reflectionSource: 'HINDSIGHT CLOUD REFLECT' | 'LOCAL REASONING ENGINE';
}

export interface ValidationCheckItem {
  id: string;
  title: string;
  status: 'PASS' | 'FAIL';
  details: string;
  latencyMs: number;
}

export interface HackathonValidationReport {
  overallStatus: 'PASS' | 'FAIL';
  checks: ValidationCheckItem[];
  totalPassed: number;
  totalFailed: number;
  timestamp: string;
  bankId: string;
  missionConfigured: boolean;
  directivesConfigured: boolean;
}

export interface SaveExperiencePayload {
  caseId: string;
  satellite: string;
  subsystem: SubsystemType;
  component: string;
  componentType: string;
  testType: TestType;
  failureMode: string;
  confirmedRootCause: string;
  correctiveActionTaken: string;
  outcome: 'RESOLVED' | 'PARTIALLY_RESOLVED' | 'UNDER_EVALUATION';
  whatWorked: string;
  whatFailed: string;
  lessonsLearned: string;
  checkFirstNextTime: string;
  engineerName?: string;
  caseStatus?: 'DRAFT' | 'INVESTIGATING' | 'ENGINEER_REVIEW' | 'CONFIRMED' | 'RETAINED';
  engineerValidated?: boolean;
  engineerSignOffDate?: string;
  verificationNotes?: string;
}

export interface AuditRecord {
  auditId: string;
  investigationId: string;
  timestamp: string;
  currentCase: {
    caseId?: string;
    satellite: string;
    component: string;
    subsystem: string;
    testType: string;
    severity: string;
    temperature: number;
    voltage: number;
    current: number;
    pressure: string;
    vibration: string;
    errorCodes: string;
    symptoms: string;
  };
  retrievedMemoryIds: string[];
  memorySource: 'HINDSIGHT CLOUD' | 'LOCAL DEMO MEMORY';
  similarityScores: Record<string, number>;
  evidenceCategories: {
    currentCaseObservations: string[];
    historicalEvidence: string[];
    aiHypotheses: string[];
    engineerValidationRequired: string[];
  };
  aiHypotheses: string[];
  recommendations: string[];
  engineerValidationStatus: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';
  confirmedRootCause?: string;
  confirmedCorrectiveAction?: string;
  retainedMemoryId?: string;
  finalOutcome?: string;
}

export interface AgentEvolutionStage {
  sessionNumber: string; // e.g. "SESSION 01"
  sessionTitle: string;
  satellite: string;
  component: string;
  memoriesRecalledCount: number;
  recalledCaseIds: string[];
  analysisType: string;
  analysisSummary: string;
  confidenceScore: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  hindsightStatus: string;
  newKnowledgeRetained?: string;
  timestamp?: string;
}

export interface LearningCurveData {
  totalCases: number;
  initialCasesCount: number;
  userRetainedCasesCount: number;
  totalInvestigationsRun: number;
  closedLoopConfirmations: number;
  lifecycleStage: string;
  evolutionStages: AgentEvolutionStage[];
  recentRetainedCases: Array<{
    caseId: string;
    component: string;
    subsystem: string;
    retainedDate: string;
    retainedMemoryId?: string;
    confirmedRootCause: string;
  }>;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  historicalEvidenceUsed?: string[];
  hasInsufficientEvidence?: boolean;
  sections?: {
    historicalEvidence?: string;
    currentCase?: string;
    aiHypothesis?: string;
    engineerValidationRequired?: string;
  };
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'subsystem' | 'component' | 'failure_mode' | 'symptom' | 'root_cause' | 'corrective_action' | 'outcome';
  subsystem?: string;
  caseIds?: string[];
}

export interface KnowledgeGraphEdge {
  from: string;
  to: string;
  label?: string;
}

export interface SystemStatus {
  hindsightConnected: boolean;
  hindsightBankId: string;
  hindsightBaseUrl: string;
  groqConnected?: boolean;
  groqModel?: string;
  llmEngine?: string;
  geminiConnected?: boolean;
  geminiModel?: string;
  totalHistoricalCases: number;
  totalSubsystems: number;
  isDemoMode: boolean;
  environment: 'SIMULATED_ENGINEERING_DATA';
}
