import {
  HistoricalFailureCase,
  HistoricalMatchItem,
  HindsightReflectionResult,
  NewAnomalySubmission
} from '../src/types/spaceMem.ts';
import { memoryStore } from './memoryStore.ts';
import {
  HINDSIGHT_BANK_MISSION,
  HINDSIGHT_BANK_DIRECTIVES,
  ReflectionService
} from './services/ReflectionService.ts';

export interface HindsightStatus {
  connected: boolean;
  bankId: string;
  baseUrl: string;
  isDemoMode: boolean;
  message: string;
  memorySource: 'HINDSIGHT CLOUD' | 'LOCAL DEMO MEMORY';
  mission: string;
  directives: string[];
}

export interface RecallResult {
  matches: HistoricalMatchItem[];
  memorySource: 'HINDSIGHT CLOUD' | 'LOCAL DEMO MEMORY';
  retrievedMemoryIds: string[];
}

export class HindsightService {
  private apiKey: string | undefined;
  private baseUrl: string;
  private bankId: string;
  private mission: string;
  private directives: string[];

  constructor() {
    this.apiKey = process.env.HINDSIGHT_API_KEY;
    this.baseUrl = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsightcloud.com';
    this.bankId = process.env.HINDSIGHT_BANK_ID || 'space-mem-engineering';
    this.mission = HINDSIGHT_BANK_MISSION;
    this.directives = HINDSIGHT_BANK_DIRECTIVES;
  }

  public getStatus(): HindsightStatus {
    const isConfigured = Boolean(this.apiKey && this.apiKey.trim().length > 5);
    return {
      connected: isConfigured,
      bankId: this.bankId,
      baseUrl: this.baseUrl,
      isDemoMode: !isConfigured,
      memorySource: isConfigured ? 'HINDSIGHT CLOUD' : 'LOCAL DEMO MEMORY',
      mission: this.mission,
      directives: this.directives,
      message: isConfigured
        ? `Memory Engine: Hindsight Connected (Cloud Bank: ${this.bankId})`
        : `Memory Engine: Demo Mode — Local engineering memory (Simulated Bank: ${this.bankId})`
    };
  }

  public getMission(): string {
    return this.mission;
  }

  public getDirectives(): string[] {
    return this.directives;
  }

  /**
   * RETAIN: Store confirmed engineering failure experience into Hindsight memory bank
   */
  public async retainMemory(caseData: HistoricalFailureCase): Promise<{
    success: boolean;
    memoryId: string;
    source: 'HINDSIGHT CLOUD' | 'LOCAL DEMO MEMORY';
  }> {
    // 1. Save to local store for instant deterministic in-session recall
    const saved = memoryStore.retainCase(caseData);

    // 2. If Hindsight API key is configured, push to Hindsight Cloud bank
    if (this.apiKey && this.apiKey.trim().length > 5) {
      try {
        const payload = {
          bank_id: this.bankId,
          memory: `Case ID: ${caseData.id}. Spacecraft: ${caseData.satellite}. Subsystem: ${caseData.subsystem}. Component: ${caseData.component} (${caseData.componentType}). Test Type: ${caseData.testType}. Date: ${caseData.date}. Severity: ${caseData.severity}. Failure Mode: ${caseData.failureMode}. Test Conditions: Temp=${caseData.testConditions.temperature}°C, Volts=${caseData.testConditions.voltage}V, Current=${caseData.testConditions.current}A, Pressure=${caseData.testConditions.pressure}, Vibe=${caseData.testConditions.vibration}. Symptoms: ${caseData.symptoms.join('; ')}. Error Codes: ${caseData.errorCodes.join(', ')}. Confirmed Root Cause: ${caseData.investigation.rootCause}. Validated Corrective Action: ${caseData.correctiveAction.actionAttempted}. Outcome: ${caseData.correctiveAction.result}. What Worked: ${caseData.correctiveAction.whatWorked}. What Failed First: ${caseData.correctiveAction.whatFailedFirst}. Lessons Learned: ${caseData.lessonsLearned.primaryLesson}. Warning: ${caseData.lessonsLearned.importantWarnings}`,
          tags: [
            ...caseData.tags,
            caseData.subsystem.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            caseData.testType.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            'retained_experience',
            'confirmed_engineering_experience'
          ],
          metadata: {
            caseId: caseData.id,
            satellite: caseData.satellite,
            subsystem: caseData.subsystem,
            component: caseData.component,
            componentType: caseData.componentType,
            testType: caseData.testType,
            failureMode: caseData.failureMode,
            temperature: caseData.testConditions.temperature,
            voltage: caseData.testConditions.voltage,
            date: caseData.date,
            retainedDate: caseData.retainedDate,
            isSimulatedData: caseData.isSimulatedData
          }
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${this.baseUrl}/v1/banks/${this.bankId}/memories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const json = (await res.json()) as { id?: string };
          const cloudMemoryId = json.id || `cloud_${caseData.id}`;
          console.log(`[Hindsight Cloud] Successfully retained experience into cloud bank: ${this.bankId}, id: ${cloudMemoryId}`);
          return {
            success: true,
            memoryId: cloudMemoryId,
            source: 'HINDSIGHT CLOUD'
          };
        } else {
          console.warn(`[Hindsight Cloud] Retain returned status ${res.status}. Stored in local store.`);
        }
      } catch (err: any) {
        console.warn('[Hindsight Cloud] Network error during retain (safely stored locally):', err.message || err);
      }
    }

    return {
      success: true,
      memoryId: saved.hindsightMemoryId || `mem_${saved.id.toLowerCase()}`,
      source: 'LOCAL DEMO MEMORY'
    };
  }

  /**
   * RECALL: Multi-signal historical memory retrieval with cloud integration & local demo fallback
   * Section 7: If Hindsight Cloud returns memories, actually parse and use them!
   */
  public async recallMemory(submission: NewAnomalySubmission, topK = 4): Promise<RecallResult> {
    // 1. Try Hindsight Cloud if configured
    if (this.apiKey && this.apiKey.trim().length > 5) {
      try {
        const queryText = `Subsystem: ${submission.subsystem}. Component: ${submission.component}. Test: ${submission.testType}. Temp: ${submission.temperature}°C. Volts: ${submission.voltage}V. Symptoms: ${submission.symptoms}. Error Codes: ${submission.errorCodes}. Telemetry: ${submission.telemetryObservations}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${this.baseUrl}/v1/banks/${this.bankId}/recall`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            query: queryText,
            top_k: topK,
            tags: [submission.subsystem.toLowerCase().replace(/[^a-z0-9]/g, '_')]
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const cloudData = (await res.json()) as {
            matches?: Array<{
              id?: string;
              memory?: string;
              score?: number;
              similarity?: number;
              metadata?: any;
            }>;
          };

          if (cloudData.matches && cloudData.matches.length > 0) {
            console.log(`[Hindsight Cloud] Recall returned ${cloudData.matches.length} cloud memories.`);
            const cloudMatches: HistoricalMatchItem[] = [];

            for (const item of cloudData.matches) {
              const meta = item.metadata || {};
              const score = typeof item.score === 'number' ? item.score : typeof item.similarity === 'number' ? item.similarity : 0.85;
              const caseId = meta.caseId || (item.id && item.id.startsWith('CASE-') ? item.id : 'CASE-CLOUD');

              // Check if case exists in local store to enrich with full dossier
              const existing = memoryStore.getCaseById(caseId);

              if (existing) {
                cloudMatches.push({
                  caseId: existing.id,
                  satellite: existing.satellite,
                  subsystem: existing.subsystem,
                  component: existing.component,
                  similarityScore: Math.min(0.96, Math.max(0.20, Number(score.toFixed(2)))),
                  matchingFactors: [
                    'Cloud semantic similarity match',
                    `Matched subsystem: ${existing.subsystem}`,
                    `Thermal qualification overlap (${existing.testConditions.temperature}°C)`
                  ],
                  previousSymptoms: existing.symptoms,
                  previousRootCause: existing.investigation.rootCause,
                  previousCorrectiveAction: existing.correctiveAction.actionAttempted,
                  previousOutcome: existing.correctiveAction.result,
                  previousWhatFailed: existing.correctiveAction.whatFailedFirst,
                  primaryLesson: existing.lessonsLearned.primaryLesson,
                  relevanceExplanation: `Retrieved via Hindsight Cloud. Historical case ${existing.id} on ${existing.satellite} encountered matching anomalies under ${existing.testType}.`
                });
              } else {
                // Parse cloud memory text if no local match
                const memText = item.memory || '';
                cloudMatches.push({
                  caseId: caseId,
                  satellite: meta.satellite || 'Satellite-Program',
                  subsystem: meta.subsystem || submission.subsystem,
                  component: meta.component || submission.component,
                  similarityScore: Math.min(0.96, Math.max(0.20, Number(score.toFixed(2)))),
                  matchingFactors: ['Cloud semantic similarity match via Hindsight'],
                  previousSymptoms: [submission.symptoms],
                  previousRootCause: meta.rootCause || memText.slice(0, 120) || 'Historical component anomaly recorded in cloud bank',
                  previousCorrectiveAction: meta.correctiveAction || 'Investigate telemetry nodes and test boundary margins',
                  previousOutcome: 'RESOLVED',
                  previousWhatFailed: meta.whatFailedFirst || 'External harness swapping without internal probe',
                  primaryLesson: meta.primaryLesson || 'Verify circuit stability at operating temperature boundaries.',
                  relevanceExplanation: `Retrieved from Hindsight Cloud bank: ${this.bankId}`
                });
              }
            }

            if (cloudMatches.length > 0) {
              return {
                matches: cloudMatches.slice(0, topK),
                memorySource: 'HINDSIGHT CLOUD',
                retrievedMemoryIds: cloudMatches.map(m => m.caseId)
              };
            }
          }
        }
      } catch (err: any) {
        console.warn('[Hindsight Cloud] Recall error or timeout (falling back to Local Demo Memory):', err.message || err);
      }
    }

    // 2. High-precision multi-signal aerospace recall from Local Demo Memory
    const localMatches = memoryStore.recallSimilar(submission, topK);
    return {
      matches: localMatches,
      memorySource: 'LOCAL DEMO MEMORY',
      retrievedMemoryIds: localMatches.map(m => m.caseId)
    };
  }

  /**
   * REFLECT: Reason over multiple relevant memories and identify patterns, relationships,
   * recurring failure mechanisms, lessons learned, and possible connections.
   * Section 26: Hindsight Reflect must be a real operation.
   * Section 27: Constrained by Hindsight Bank Mission & Directives.
   */
  public async reflectMemories(
    submission: NewAnomalySubmission,
    recalledMatches: HistoricalMatchItem[]
  ): Promise<HindsightReflectionResult> {
    let cloudReflectData: any = null;

    // 1. If Hindsight Cloud is active, call cloud reflect endpoint
    if (this.apiKey && this.apiKey.trim().length > 5) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${this.baseUrl}/v1/banks/${this.bankId}/reflect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            query: `Identify recurring failure mechanisms and connections for ${submission.component} under ${submission.testType}.`,
            memory_ids: recalledMatches.map(m => m.caseId),
            mission: this.mission,
            directives: this.directives
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          cloudReflectData = await res.json();
          console.log('[Hindsight Cloud] Reflect response successfully received.');
        }
      } catch (err: any) {
        console.warn('[Hindsight Cloud] Reflect error or timeout, utilizing internal reflection engine:', err.message || err);
      }
    }

    // 2. Execute deep pattern and connection reasoning constrained by bank mission & directives
    return ReflectionService.executeReflection(submission, recalledMatches, cloudReflectData);
  }
}

export const hindsightService = new HindsightService();
