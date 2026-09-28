import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HistoricalFailureCase, HistoricalMatchItem, NewAnomalySubmission, SubsystemType } from '../src/types/spaceMem.ts';
import { DEFAULT_FAILURE_CASES } from '../src/data/defaultCases.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data_store.json');

class MemoryStore {
  private cases: HistoricalFailureCase[] = [];
  public bankId: string = process.env.HINDSIGHT_BANK_ID || 'space-mem-engineering';

  constructor() {
    this.loadStore();
  }

  private loadStore() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cases = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[MemoryStore] Could not read data_store.json, initializing from defaults:', e);
    }
    // Initialize with default historical cases
    this.cases = [...DEFAULT_FAILURE_CASES];
    this.saveStore();
  }

  private saveStore() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.cases, null, 2), 'utf-8');
    } catch (e) {
      console.error('[MemoryStore] Failed to write data_store.json:', e);
    }
  }

  public getAllCases(): HistoricalFailureCase[] {
    return [...this.cases];
  }

  public getCaseById(id: string): HistoricalFailureCase | undefined {
    return this.cases.find(c => c.id.toLowerCase() === id.toLowerCase());
  }

  public retainCase(newCase: HistoricalFailureCase): HistoricalFailureCase {
    const existingIndex = this.cases.findIndex(c => c.id.toLowerCase() === newCase.id.toLowerCase());
    if (existingIndex >= 0) {
      this.cases[existingIndex] = newCase;
    } else {
      this.cases.unshift(newCase);
    }
    this.saveStore();
    return newCase;
  }

  public resetToDefaults(): void {
    this.cases = [...DEFAULT_FAILURE_CASES];
    this.saveStore();
  }

  /**
   * RECALL: Retrieve similar historical failures based on symptoms, component, subsystem, and conditions
   */
  public recallSimilar(submission: NewAnomalySubmission, topK = 4): HistoricalMatchItem[] {
    const querySubsystem = (submission.subsystem || '').toLowerCase();
    const queryComponent = (submission.component || '').toLowerCase();
    const queryTestType = (submission.testType || '').toLowerCase();
    const queryErrorCodes = (submission.errorCodes || '').toLowerCase();
    const querySymptoms = (submission.symptoms || '').toLowerCase();
    const queryTemp = typeof submission.temperature === 'number' ? submission.temperature : 25;
    const queryVolts = typeof submission.voltage === 'number' ? submission.voltage : 28;

    const scored = this.cases.map(historical => {
      let score = 0;
      const matchingFactors: string[] = [];

      // 1. Subsystem match (high weight)
      if (historical.subsystem.toLowerCase() === querySubsystem) {
        score += 0.30;
        matchingFactors.push(`Identical subsystem: ${historical.subsystem}`);
      } else if (
        (querySubsystem.includes('power') && historical.subsystem.includes('Power')) ||
        (querySubsystem.includes('adcs') && historical.subsystem.includes('ADCS')) ||
        (querySubsystem.includes('thermal') && historical.subsystem.includes('Thermal'))
      ) {
        score += 0.20;
        matchingFactors.push(`Related subsystem domain: ${historical.subsystem}`);
      }

      // 2. Component match / keyword overlap
      const histComp = historical.component.toLowerCase();
      const histCompType = historical.componentType.toLowerCase();
      const compWords = queryComponent.split(/\s+/).filter(w => w.length > 2);
      let compMatches = 0;
      for (const w of compWords) {
        if (histComp.includes(w) || histCompType.includes(w)) {
          compMatches++;
        }
      }
      if (compMatches > 0) {
        const compBoost = Math.min(0.25, compMatches * 0.10);
        score += compBoost;
        matchingFactors.push(`Component keyword overlap: ${compMatches} terms matched in ${historical.component}`);
      }

      // 3. Test Type match
      if (historical.testType.toLowerCase() === queryTestType) {
        score += 0.15;
        matchingFactors.push(`Identical test environment: ${historical.testType}`);
      }

      // 4. Symptoms & Error Codes text overlap
      const symptomWords = `${querySymptoms} ${queryErrorCodes}`.toLowerCase().split(/[\s,;.-]+/).filter(w => w.length > 3);
      const histText = `${historical.symptoms.join(' ')} ${historical.errorCodes.join(' ')} ${historical.failureMode} ${historical.investigation.findings}`.toLowerCase();
      
      let matchedTerms = 0;
      const termHits: string[] = [];
      const criticalKeywords = ['voltage', 'ripple', 'instability', 'uvlo', 'jitter', 'thermal', 'soak', 'vibration', 'leak', 'reset', 'watchdog', 'bit slip', 'rf', 'drop', 'ground'];
      
      for (const kw of criticalKeywords) {
        if (symptomWords.includes(kw) && histText.includes(kw)) {
          matchedTerms++;
          termHits.push(kw);
        }
      }

      if (matchedTerms > 0) {
        const symBoost = Math.min(0.20, matchedTerms * 0.05);
        score += symBoost;
        matchingFactors.push(`Matching telemetry/symptom signatures: [${termHits.slice(0, 3).join(', ')}]`);
      }

      // 5. Environmental condition similarity (temperature proximity)
      const histTemp = historical.testConditions.temperature;
      if (typeof histTemp === 'number') {
        const tempDiff = Math.abs(queryTemp - histTemp);
        if (tempDiff <= 15) {
          score += 0.10;
          matchingFactors.push(`Similar thermal condition: ${histTemp}°C (current: ${queryTemp}°C)`);
        } else if ((queryTemp < 0 && histTemp < 0) || (queryTemp > 40 && histTemp > 40)) {
          score += 0.05;
          matchingFactors.push(`Same thermal boundary domain (${queryTemp < 0 ? 'Cryogenic / Cold Soak' : 'Hot Boundary'})`);
        }
      }

      // Clamp score between 0.15 and 0.96 (never fabricate 100%)
      const finalScore = Math.min(0.96, Math.max(0.15, Number(score.toFixed(2))));

      return {
        caseItem: historical,
        score: finalScore,
        matchingFactors: matchingFactors.length > 0 ? matchingFactors : ['General aerospace qualification regime overlap']
      };
    });

    // Sort by descending score
    scored.sort((a, b) => b.score - a.score);

    // Return topK as HistoricalMatchItem
    return scored.slice(0, topK).map(({ caseItem, score, matchingFactors }) => ({
      caseId: caseItem.id,
      satellite: caseItem.satellite,
      subsystem: caseItem.subsystem,
      component: caseItem.component,
      similarityScore: score,
      matchingFactors,
      previousSymptoms: caseItem.symptoms,
      previousRootCause: caseItem.investigation.rootCause,
      previousCorrectiveAction: caseItem.correctiveAction.actionAttempted,
      previousOutcome: caseItem.correctiveAction.result,
      previousWhatFailed: caseItem.correctiveAction.whatFailedFirst,
      primaryLesson: caseItem.lessonsLearned.primaryLesson,
      relevanceExplanation: `Historical case ${caseItem.id} on ${caseItem.satellite} experienced similar behavior under ${caseItem.testType} (${caseItem.testConditions.temperature}°C). Investigation demonstrated that ${caseItem.investigation.rootCause.slice(0, 100)}...`
    }));
  }
}

export const memoryStore = new MemoryStore();
