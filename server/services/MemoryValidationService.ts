import { NewAnomalySubmission, SaveExperiencePayload } from '../../src/types/spaceMem.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class MemoryValidationService {
  /**
   * Sanitizes input text to prevent prompt injection and remove control characters
   */
  public static sanitizeText(input: string | undefined | null): string {
    if (!input) return '';
    return input
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<[^>]*>/g, '') // strip HTML tags
      .trim();
  }

  /**
   * Validates incoming anomaly submission before investigation
   */
  public static validateAnomalySubmission(submission: NewAnomalySubmission): ValidationResult {
    const errors: string[] = [];

    if (!submission) {
      return { valid: false, errors: ['Submission body cannot be empty.'] };
    }

    const component = this.sanitizeText(submission.component);
    const subsystem = this.sanitizeText(submission.subsystem);
    const symptoms = this.sanitizeText(submission.symptoms);

    if (!component || component.length < 2) {
      errors.push('Component name is required (minimum 2 characters).');
    }

    if (!subsystem) {
      errors.push('Subsystem identification is required.');
    }

    if (!symptoms || symptoms.length < 5) {
      errors.push('Observed anomaly symptoms description is required (minimum 5 characters).');
    }

    if (typeof submission.temperature !== 'number' || isNaN(submission.temperature)) {
      errors.push('Valid telemetry temperature (°C) is required.');
    } else if (submission.temperature < -273.15 || submission.temperature > 500) {
      errors.push('Telemetry temperature is outside realistic aerospace limits (-273.15°C to 500°C).');
    }

    if (typeof submission.voltage !== 'number' || isNaN(submission.voltage)) {
      errors.push('Valid telemetry voltage (V) is required.');
    } else if (submission.voltage < -100 || submission.voltage > 1000) {
      errors.push('Telemetry voltage is outside realistic bounds (-100V to 1000V).');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Section 8 & 9: Memory Quality Control
   * Only retain an investigation when the engineer explicitly confirms that the case contains useful engineering knowledge.
   * Required confirmation fields:
   * - confirmed root cause
   * - confirmed corrective action
   * - outcome
   * - what worked
   * - what failed
   * - lessons learned
   * - engineer validation / confirmation
   */
  public static validateRetainPayload(payload: SaveExperiencePayload): ValidationResult {
    const errors: string[] = [];

    if (!payload) {
      return { valid: false, errors: ['Retain payload cannot be empty.'] };
    }

    const rootCause = this.sanitizeText(payload.confirmedRootCause);
    const correctiveAction = this.sanitizeText(payload.correctiveActionTaken);
    const whatWorked = this.sanitizeText(payload.whatWorked);
    const whatFailed = this.sanitizeText(payload.whatFailed);
    const lessonsLearned = this.sanitizeText(payload.lessonsLearned);
    const component = this.sanitizeText(payload.component);

    if (!component || component.length < 2) {
      errors.push('Target component must be specified.');
    }

    if (!rootCause || rootCause.length < 10) {
      errors.push('Confirmed root cause is required and must detail the verified physical/electrical failure mechanism (min 10 characters). An unverified hypothesis cannot be retained into engineering memory.');
    }

    if (!correctiveAction || correctiveAction.length < 10) {
      errors.push('Validated corrective action is required (min 10 characters). Must detail the approved hardware rework, parameter tune, or procedure.');
    }

    if (!payload.outcome || !['RESOLVED', 'PARTIALLY_RESOLVED', 'UNDER_EVALUATION'].includes(payload.outcome)) {
      errors.push('Valid engineering outcome status is required (RESOLVED, PARTIALLY_RESOLVED, or UNDER_EVALUATION).');
    }

    if (!whatWorked || whatWorked.length < 5) {
      errors.push('Field "What Worked" is required for closed-loop learning.');
    }

    if (!whatFailed || whatFailed.length < 5) {
      errors.push('Field "What Failed First" is required to prevent future engineers from repeating false troubleshooting leads.');
    }

    if (!lessonsLearned || lessonsLearned.length < 10) {
      errors.push('Lessons learned statement is required (min 10 characters).');
    }

    // Engineer verification gate
    if (payload.engineerValidated !== true && payload.caseStatus !== 'CONFIRMED') {
      errors.push('Engineer validation sign-off is required. Only CONFIRMED cases with engineer sign-off can become durable engineering memory.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
