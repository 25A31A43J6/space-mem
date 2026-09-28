import {
  AnalysisResult,
  AssistantMessage,
  HistoricalFailureCase,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  NewAnomalySubmission,
  SaveExperiencePayload,
  SystemStatus
} from './types/spaceMem.ts';

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchAllCases(params?: {
  subsystem?: string;
  severity?: string;
  testType?: string;
  search?: string;
}): Promise<HistoricalFailureCase[]> {
  const query = new URLSearchParams();
  if (params?.subsystem) query.set('subsystem', params.subsystem);
  if (params?.severity) query.set('severity', params.severity);
  if (params?.testType) query.set('testType', params.testType);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`/api/cases?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function fetchCaseById(id: string): Promise<HistoricalFailureCase> {
  const res = await fetch(`/api/cases/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${id}`);
  return res.json();
}

export async function submitInvestigation(submission: NewAnomalySubmission): Promise<AnalysisResult> {
  const res = await fetch('/api/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Investigation analysis failed');
  }
  return res.json();
}

export async function retainExperience(payload: SaveExperiencePayload): Promise<{
  success: boolean;
  case: HistoricalFailureCase;
  memoryId: string;
  source: string;
  message: string;
  caseStatus: string;
  lifecycleMessage?: string;
}> {
  const res = await fetch('/api/retain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const details = Array.isArray(err.details) ? `\n• ${err.details.join('\n• ')}` : '';
    throw new Error((err.error || 'Failed to retain experience') + details);
  }
  return res.json();
}

export async function fetchAuditRecords(): Promise<any[]> {
  const res = await fetch('/api/audit');
  if (!res.ok) throw new Error('Failed to fetch audit records');
  return res.json();
}

export async function fetchLearningCurve(): Promise<any> {
  const res = await fetch('/api/learning-curve');
  if (!res.ok) throw new Error('Failed to fetch learning curve data');
  return res.json();
}

export async function sendAssistantMessage(message: string, history: AssistantMessage[]): Promise<AssistantMessage> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Chat failed');
  }
  return res.json();
}

export async function fetchStats(): Promise<any> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchKnowledgeMap(): Promise<{ nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] }> {
  const res = await fetch('/api/knowledge-map');
  if (!res.ok) throw new Error('Failed to fetch knowledge map');
  return res.json();
}

export async function fetchComparisonDemo(caseId?: string): Promise<any> {
  const res = await fetch(`/api/demo/comparison/${caseId || 'CASE-001'}`);
  if (!res.ok) throw new Error('Failed to fetch comparison demo');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch('/api/reset-demo', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo data');
}

export async function validateHackathonRequirements(): Promise<any> {
  const res = await fetch('/api/hindsight/validate');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to run validation tests');
  }
  return res.json();
}

export async function executeReflect(
  submission: NewAnomalySubmission,
  recalledMatches?: any[]
): Promise<any> {
  const res = await fetch('/api/hindsight/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission, recalledMatches })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Reflect execution failed');
  }
  return res.json();
}

export async function runDemoStep1(): Promise<any> {
  const res = await fetch('/api/demo/learning-loop/step1', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Step 1 execution failed');
  }
  return res.json();
}

export async function runDemoStep3Retain(): Promise<any> {
  const res = await fetch('/api/demo/learning-loop/step3-retain', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Step 3 retain failed');
  }
  return res.json();
}

export async function runDemoStep5RecallReflect(): Promise<any> {
  const res = await fetch('/api/demo/learning-loop/step5-recall-reflect', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Step 5 recall/reflect failed');
  }
  return res.json();
}

export async function runDemoStep6RetainSecond(): Promise<any> {
  const res = await fetch('/api/demo/learning-loop/step6-retain-second', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Step 6 retain failed');
  }
  return res.json();
}

export async function runDemoStep7MultiAnomaly(): Promise<any> {
  const res = await fetch('/api/demo/learning-loop/step7-multi-anomaly', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Step 7 multi anomaly failed');
  }
  return res.json();
}

export async function resetDemoScenario(): Promise<any> {
  const res = await fetch('/api/demo/learning-loop/reset', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Reset failed');
  }
  return res.json();
}

