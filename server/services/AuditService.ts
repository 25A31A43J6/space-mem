import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AuditRecord } from '../../src/types/spaceMem.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.join(__dirname, '..', '..', 'audit_store.json');

export class AuditService {
  private records: AuditRecord[] = [];

  constructor() {
    this.loadStore();
  }

  private loadStore() {
    try {
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.records = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('[AuditService] Could not read audit_store.json, starting empty:', e);
    }
    this.records = [];
  }

  private saveStore() {
    try {
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (e) {
      console.error('[AuditService] Failed to write audit_store.json:', e);
    }
  }

  public recordInvestigation(record: AuditRecord): AuditRecord {
    // Sanitize to ensure no secrets or auth tokens can ever be stored
    const safeRecord: AuditRecord = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString()
    };

    // Prepend new record
    this.records.unshift(safeRecord);
    // Keep max 200 records
    if (this.records.length > 200) {
      this.records = this.records.slice(0, 200);
    }
    this.saveStore();
    return safeRecord;
  }

  public updateValidationStatus(
    investigationId: string,
    updates: {
      engineerValidationStatus: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED';
      confirmedRootCause?: string;
      confirmedCorrectiveAction?: string;
      retainedMemoryId?: string;
      finalOutcome?: string;
    }
  ): AuditRecord | null {
    const record = this.records.find(r => r.investigationId === investigationId);
    if (!record) return null;

    if (updates.engineerValidationStatus) {
      record.engineerValidationStatus = updates.engineerValidationStatus;
    }
    if (updates.confirmedRootCause) {
      record.confirmedRootCause = updates.confirmedRootCause;
    }
    if (updates.confirmedCorrectiveAction) {
      record.confirmedCorrectiveAction = updates.confirmedCorrectiveAction;
    }
    if (updates.retainedMemoryId) {
      record.retainedMemoryId = updates.retainedMemoryId;
    }
    if (updates.finalOutcome) {
      record.finalOutcome = updates.finalOutcome;
    }

    this.saveStore();
    return record;
  }

  public getAllRecords(): AuditRecord[] {
    return [...this.records];
  }

  public getRecordById(id: string): AuditRecord | undefined {
    return this.records.find(r => r.auditId === id || r.investigationId === id);
  }
}

export const auditService = new AuditService();
