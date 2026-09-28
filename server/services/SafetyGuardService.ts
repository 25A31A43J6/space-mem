import { RecommendedInvestigationStep } from '../../src/types/spaceMem.ts';

export class SafetyGuardService {
  public static readonly MANDATORY_SAFETY_NOTICE =
    'AI-supported engineering analysis — human engineer verification required before operational action. Automated commanding, flight software modification, or protection limit overrides are strictly prohibited.';

  /**
   * Enforces safety notice and human verification on every recommended investigation step
   */
  public static auditAndGuardRecommendations(
    steps: RecommendedInvestigationStep[]
  ): RecommendedInvestigationStep[] {
    return steps.map((step, idx) => {
      let caution = step.cautionNotice || '';
      if (!caution.includes('HUMAN ENGINEER VERIFICATION REQUIRED')) {
        caution = `AI-SUPPORTED RECOMMENDATION — HUMAN ENGINEER VERIFICATION REQUIRED. ${caution}`.trim();
      }

      // Check for prohibited autonomous actions
      const prohibitedKeywords = [
        'upload flight software',
        'disable watchdog',
        'bypass protection',
        'override uvlo',
        'transmit direct command',
        'declare flight ready autonomously'
      ];

      for (const kw of prohibitedKeywords) {
        if (step.actionTitle.toLowerCase().includes(kw)) {
          caution += ` [SAFETY RESTRICTION: Autonomous execution prohibited. Requires Formal Engineering Review Board approval.]`;
        }
      }

      return {
        ...step,
        stepNumber: idx + 1,
        cautionNotice: caution,
        verificationProcedure: step.verificationProcedure || 'Standard ground qualification and bench verification protocol.'
      };
    });
  }

  /**
   * Scans text to ensure no dangerous autonomous spacecraft commanding language
   */
  public static sanitizeAssistantResponse(text: string): string {
    // If the text erroneously promises autonomous commanding, append safety reminder
    if (/send\s+command\s+to\s+spacecraft/i.test(text) || /directly\s+reflash/i.test(text)) {
      return `${text}\n\n[SAFETY NOTICE] ${this.MANDATORY_SAFETY_NOTICE}`;
    }
    return text;
  }
}
