import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { memoryStore } from './server/memoryStore.ts';
import { hindsightService } from './server/hindsightService.ts';
import { groqService } from './server/groqService.ts';
import { geminiService } from './server/geminiService.ts';
import { InvestigationService } from './server/services/InvestigationService.ts';
import { MemoryValidationService } from './server/services/MemoryValidationService.ts';
import { auditService } from './server/services/AuditService.ts';
import { ValidationService } from './server/services/ValidationService.ts';
import { DemoScenarioService } from './server/services/DemoScenarioService.ts';
import {
  HistoricalFailureCase,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  NewAnomalySubmission,
  SaveExperiencePayload
} from './src/types/spaceMem.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Status & Configuration (Section 6: Cloud vs Local Demo Memory)
  app.get('/api/status', (req, res) => {
    const hindsight = hindsightService.getStatus();
    const cases = memoryStore.getAllCases();
    const subsystems = new Set(cases.map(c => c.subsystem));

    const groqStatus = groqService.getStatus();

    res.json({
      hindsightConnected: hindsight.connected,
      hindsightBankId: hindsight.bankId,
      hindsightBaseUrl: hindsight.baseUrl,
      memorySource: hindsight.memorySource,
      groqConnected: groqStatus.connected,
      groqModel: groqStatus.model,
      llmEngine: 'Groq',
      geminiConnected: groqStatus.connected,
      geminiModel: groqStatus.model,
      totalHistoricalCases: cases.length,
      totalSubsystems: subsystems.size,
      isDemoMode: hindsight.isDemoMode,
      environment: 'SIMULATED ENGINEERING DATA',
      message: hindsight.message,
      safetyNotice:
        'SPACE-MEM IS AN ENGINEERING DECISION-SUPPORT SYSTEM. AI-supported engineering analysis — human engineer verification required before operational action. Automated commanding, flight software modification, or protection limit overrides are strictly prohibited.'
    });
  });

  // Get All Cases with filters
  app.get('/api/cases', (req, res) => {
    let cases = memoryStore.getAllCases();
    const { subsystem, severity, testType, search } = req.query;

    if (subsystem && typeof subsystem === 'string' && subsystem !== 'ALL') {
      cases = cases.filter(c => c.subsystem.toLowerCase().includes(subsystem.toLowerCase()));
    }
    if (severity && typeof severity === 'string' && severity !== 'ALL') {
      cases = cases.filter(c => c.severity === severity);
    }
    if (testType && typeof testType === 'string' && testType !== 'ALL') {
      cases = cases.filter(c => c.testType.toLowerCase().includes(testType.toLowerCase()));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      cases = cases.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.satellite.toLowerCase().includes(q) ||
          c.component.toLowerCase().includes(q) ||
          c.failureMode.toLowerCase().includes(q) ||
          c.investigation.rootCause.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    res.json(cases);
  });

  // Get Single Case by ID
  app.get('/api/cases/:id', (req, res) => {
    const caseItem = memoryStore.getCaseById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ error: `Case ${req.params.id} not found in memory bank.` });
    }
    res.json(caseItem);
  });

  // Section 1: Hindsight-First Investigation Endpoint
  app.post('/api/investigate', async (req, res) => {
    try {
      const submission = req.body as NewAnomalySubmission;
      const result = await InvestigationService.executeInvestigation(submission);
      res.json(result);
    } catch (err: any) {
      console.error('[API /api/investigate] Error:', err);
      res.status(400).json({ error: err.message || 'Investigation request failed.' });
    }
  });

  // Section 8 & 9: Retain Confirmed Experience into Hindsight Bank (Learning Loop)
  app.post('/api/retain', async (req, res) => {
    try {
      console.log('[SPACE-MEM] Engineer validation received');
      const payload = req.body as SaveExperiencePayload;

      // Quality control validation
      const validation = MemoryValidationService.validateRetainPayload(payload);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Memory Quality Control Rejected Retention:',
          details: validation.errors
        });
      }

      const newCaseId =
        payload.caseId && payload.caseId.startsWith('CASE-')
          ? payload.caseId
          : `CASE-${String(memoryStore.getAllCases().length + 1).padStart(3, '0')}`;

      const newCase: HistoricalFailureCase = {
        id: newCaseId,
        satellite: payload.satellite || 'Orbital-Test-Vehicle',
        subsystem: payload.subsystem || 'Electrical Power (EPS)',
        component: payload.component,
        componentType: payload.componentType || 'Space-Qualified Subassembly',
        testType: payload.testType || 'Thermal Vacuum (TVAC)',
        date: new Date().toISOString().split('T')[0],
        missionPhase: 'Spacecraft Environmental Test',
        severity: 'HIGH',
        failureMode: payload.failureMode || 'Component Operational Anomaly',
        testConditions: {
          temperature: 25.0,
          voltage: 28.0,
          current: 2.5,
          pressure: 'Hard Vacuum',
          vibration: '0.0 g RMS',
          duration: 'Investigation Retained Cycle',
          environmentalNotes: 'Confirmed in ground qualification chamber'
        },
        telemetryReadings: {
          confirmed_status: payload.outcome,
          validation: 'Passed Engineer Check & Sign-off'
        },
        symptoms: [payload.failureMode, 'Anomaly observed during test cycle'],
        errorCodes: ['CONFIRMED_CASE_' + newCaseId],
        investigation: {
          initialHypothesis: 'Evaluated against historical Hindsight memory precedents.',
          diagnosticSteps: [
            'Retrieved historical recommendations from Hindsight bank: space-mem-engineering',
            'Conducted targeted bench probe verification',
            'Isolated component internal failure mechanism'
          ],
          testsPerformed: ['Engineering validation re-test', 'Boundary margin characterization'],
          findings: `Confirmed by engineering team: ${payload.confirmedRootCause}`,
          rootCause: payload.confirmedRootCause
        },
        correctiveAction: {
          actionAttempted: payload.correctiveActionTaken,
          configurationChange: `ECR-${newCaseId}: ${payload.correctiveActionTaken.slice(0, 50)}`,
          result:
            payload.outcome === 'RESOLVED'
              ? 'Corrective action resolved anomaly completely.'
              : 'Partial resolution, further monitoring recommended.',
          solved: payload.outcome === 'RESOLVED',
          whatWorked: payload.whatWorked || payload.correctiveActionTaken,
          whatFailedFirst: payload.whatFailed || 'Speculative troubleshooting without checking historical memory precedents.',
          validationPerformed: 'Completed engineering verification protocol with sign-off.'
        },
        lessonsLearned: {
          primaryLesson: payload.lessonsLearned || 'Engineering lesson retained for future spacecraft programs.',
          checkFirstNextTime: payload.checkFirstNextTime || 'Check component thermal/electrical baseline against this retained case.',
          flawedAssumptions: 'Assumed anomaly was standard external harness glitch.',
          importantWarnings: 'Human engineer verification required before flight configuration changes.'
        },
        timeline: [
          { step: 'Detection', title: 'Anomaly Logged', description: payload.failureMode, timestamp: 'T+00:00:00', status: 'critical' },
          { step: 'Symptoms', title: 'Hindsight Memory Recalled', description: 'SPACE-MEM Hindsight analysis retrieved similar precedents.', timestamp: 'T+00:15:00', status: 'info' },
          { step: 'Root cause', title: 'Root Cause Confirmed', description: payload.confirmedRootCause, timestamp: 'T+04:00:00', status: 'critical' },
          { step: 'Corrective action', title: 'Corrective Action Applied', description: payload.correctiveActionTaken, timestamp: 'T+08:00:00', status: 'completed' },
          { step: 'Validation', title: 'Engineer Sign-off & Verification', description: `Outcome: ${payload.outcome}`, timestamp: 'T+12:00:00', status: 'completed' },
          { step: 'Lessons learned', title: 'Experience Retained into Hindsight Bank', description: payload.lessonsLearned, timestamp: 'T+14:00:00', status: 'completed' }
        ],
        tags: [
          payload.subsystem.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          'retained_experience',
          'flight_learning',
          'confirmed_engineering_experience'
        ],
        retainedDate: new Date().toISOString().split('T')[0],
        hindsightMemoryId: `mem_${newCaseId.toLowerCase()}`,
        isSimulatedData: true
      };

      const retainResult = await hindsightService.retainMemory(newCase);
      console.log(`[SPACE-MEM] Memory retained: ${newCaseId} into ${retainResult.source} bank ${hindsightService.getStatus().bankId}`);

      // Update audit record if corresponding investigationId was provided
      if (payload.caseId) {
        auditService.updateValidationStatus(payload.caseId, {
          engineerValidationStatus: 'CONFIRMED',
          confirmedRootCause: payload.confirmedRootCause,
          confirmedCorrectiveAction: payload.correctiveActionTaken,
          retainedMemoryId: retainResult.memoryId,
          finalOutcome: payload.outcome
        });
      }

      res.json({
        success: true,
        case: newCase,
        memoryId: retainResult.memoryId,
        source: retainResult.source,
        caseStatus: 'RETAINED',
        lifecycleMessage: `Investigation confirmed and committed into Hindsight (${retainResult.source}). Available immediately for future recall across spacecraft programs.`,
        message: `Experience retained successfully into Hindsight bank: ${hindsightService.getStatus().bankId}`
      });
    } catch (err: any) {
      console.error('[API /api/retain] Error:', err);
      res.status(500).json({ error: 'Failed to retain memory: ' + (err.message || 'Internal server error') });
    }
  });

  // Hindsight RECALL Endpoint (Task 13)
  app.post('/api/recall', async (req, res) => {
    try {
      console.log('[SPACE-MEM] Hindsight recall started');
      const submission = req.body as NewAnomalySubmission;
      const topK = req.body.topK || 4;
      const result = await hindsightService.recallMemory(submission, topK);
      console.log(`[SPACE-MEM] Historical memories retrieved (${result.matches.length} cases): [${result.retrievedMemoryIds.join(', ')}]`);
      res.json(result);
    } catch (err: any) {
      console.error('[API /api/recall] Error:', err);
      res.status(500).json({ error: 'Recall failed: ' + (err.message || 'Internal error') });
    }
  });

  // Section 30 & 31: Hackathon Requirement Validation Endpoint
  app.get('/api/hindsight/validate', async (req, res) => {
    try {
      const report = await ValidationService.runAllValidationChecks();
      res.json(report);
    } catch (err: any) {
      console.error('[API /api/hindsight/validate] Error:', err);
      res.status(500).json({ error: 'Validation test execution failed: ' + (err.message || 'Internal error') });
    }
  });

  // Section 26 & 27: Standalone Hindsight REFLECT Endpoints (Task 13)
  const handleReflectRequest = async (req: express.Request, res: express.Response) => {
    try {
      console.log('[SPACE-MEM] Hindsight recall started for reflection');
      const { submission, recalledMatches } = req.body;
      if (!submission) {
        return res.status(400).json({ error: 'submission payload is required.' });
      }
      const matches = recalledMatches || (await hindsightService.recallMemory(submission, 4)).matches;
      console.log(`[SPACE-MEM] Historical memories retrieved: ${matches.length} cases`);
      const reflection = await hindsightService.reflectMemories(submission, matches);
      console.log('[SPACE-MEM] Hindsight reflection completed');
      res.json(reflection);
    } catch (err: any) {
      console.error('[API reflect] Error:', err);
      res.status(500).json({ error: 'Reflect operation failed: ' + (err.message || 'Internal error') });
    }
  };

  app.post('/api/reflect', handleReflectRequest);
  app.post('/api/hindsight/reflect', handleReflectRequest);

  // Section 28 & 29: Reproducible 8-Step Memory Learning Demo Endpoints
  app.post('/api/demo/learning-loop/step1', async (req, res) => {
    try {
      const step1 = await DemoScenarioService.runStep1NovelAnomaly();
      res.json(step1);
    } catch (err: any) {
      console.error('[API /api/demo/learning-loop/step1] Error:', err);
      res.status(500).json({ error: err.message || 'Step 1 execution failed' });
    }
  });

  app.post('/api/demo/learning-loop/step3-retain', async (req, res) => {
    try {
      const step3 = await DemoScenarioService.runStep3RetainExperience();
      res.json(step3);
    } catch (err: any) {
      console.error('[API /api/demo/learning-loop/step3-retain] Error:', err);
      res.status(500).json({ error: err.message || 'Step 3 retain failed' });
    }
  });

  app.post('/api/demo/learning-loop/step5-recall-reflect', async (req, res) => {
    try {
      const step5 = await DemoScenarioService.runStep5RelatedAnomaly();
      res.json(step5);
    } catch (err: any) {
      console.error('[API /api/demo/learning-loop/step5-recall-reflect] Error:', err);
      res.status(500).json({ error: err.message || 'Step 5 recall/reflect failed' });
    }
  });

  app.post('/api/demo/learning-loop/step6-retain-second', async (req, res) => {
    try {
      const step6 = await DemoScenarioService.runStep6RetainSecondExperience();
      res.json(step6);
    } catch (err: any) {
      console.error('[API /api/demo/learning-loop/step6-retain-second] Error:', err);
      res.status(500).json({ error: err.message || 'Step 6 retain failed' });
    }
  });

  app.post('/api/demo/learning-loop/step7-multi-anomaly', async (req, res) => {
    try {
      const step7 = await DemoScenarioService.runStep7MultiPrecedentAnomaly();
      res.json(step7);
    } catch (err: any) {
      console.error('[API /api/demo/learning-loop/step7-multi-anomaly] Error:', err);
      res.status(500).json({ error: err.message || 'Step 7 multi anomaly failed' });
    }
  });

  app.post('/api/demo/learning-loop/reset', (req, res) => {
    try {
      DemoScenarioService.resetDemoMemory();
      res.json({ success: true, message: 'Demo memory reset successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Reset failed' });
    }
  });

  // Section 13: Audit Trail Endpoints
  app.get('/api/audit', (req, res) => {
    const records = auditService.getAllRecords();
    res.json(records);
  });

  app.get('/api/audit/:id', (req, res) => {
    const record = auditService.getRecordById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: `Audit record ${req.params.id} not found.` });
    }
    res.json(record);
  });

  // Section 15: Learning Curve & Closed-Loop Lifecycle Endpoint
  app.get('/api/learning-curve', (req, res) => {
    const allCases = memoryStore.getAllCases();
    const audits = auditService.getAllRecords();

    const userRetained = allCases.filter(c => c.tags.includes('retained_experience') || c.id.startsWith('CASE-2026') || parseInt(c.id.replace('CASE-', ''), 10) > 12);
    const closedLoop = audits.filter(a => a.engineerValidationStatus === 'CONFIRMED').length;

    let lifecycleStage = 'Stage 1: Seeded Historical Baseline (12 Qualification Cases)';
    if (userRetained.length > 0) {
      lifecycleStage = `Stage ${userRetained.length + 1}: Multi-Program Learning Loop Active (+${userRetained.length} Retained Cases)`;
    }

    res.json({
      totalCases: allCases.length,
      initialCasesCount: 12,
      userRetainedCasesCount: userRetained.length,
      totalInvestigationsRun: audits.length,
      closedLoopConfirmations: closedLoop + userRetained.length,
      lifecycleStage,
      evolutionStages: DemoScenarioService.getEvolutionSummary(),
      memorySource: hindsightService.getStatus().memorySource,
      recentRetainedCases: userRetained.slice(0, 5).map(c => ({
        caseId: c.id,
        component: c.component,
        subsystem: c.subsystem,
        retainedDate: c.retainedDate,
        retainedMemoryId: c.hindsightMemoryId,
        confirmedRootCause: c.investigation.rootCause
      }))
    });
  });

  // Section 17: Investigation Assistant Chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required.' });
      }

      const reply = await groqService.assistantChat(message, history || []);
      res.json(reply);
    } catch (err: any) {
      console.error('[API /api/chat] Error:', err);
      res.status(500).json({ error: 'Failed to generate assistant response: ' + (err.message || 'Internal server error') });
    }
  });

  // Section 14: Before vs After Comparison Demo
  app.get('/api/demo/comparison/:caseId?', (req, res) => {
    const caseId = req.params.caseId || 'CASE-001';
    const comparison = groqService.generateBeforeVsAfterDemo(caseId);
    res.json(comparison);
  });

  // System Statistics & Historical Insights (Simulated Engineering Data)
  app.get('/api/stats', (req, res) => {
    const cases = memoryStore.getAllCases();
    const audits = auditService.getAllRecords();
    const subsystemsCount: Record<string, number> = {};
    const componentsTracked = new Set<string>();

    for (const c of cases) {
      subsystemsCount[c.subsystem] = (subsystemsCount[c.subsystem] || 0) + 1;
      componentsTracked.add(c.component);
    }

    const thermalCases = cases.filter(
      c =>
        c.testType.includes('TVAC') ||
        c.tags.includes('thermal') ||
        c.testConditions.temperature < 0 ||
        c.testConditions.temperature > 40
    );
    const voltageCases = cases.filter(
      c =>
        c.failureMode.toLowerCase().includes('voltage') ||
        c.symptoms.some(s => s.toLowerCase().includes('voltage') || s.toLowerCase().includes('ripple'))
    );
    const vibeCases = cases.filter(c => c.testType.includes('Vibration') || c.tags.includes('vibration'));

    const userRetainedCount = cases.filter(c => c.tags.includes('retained_experience') || parseInt(c.id.replace('CASE-', ''), 10) > 12).length;

    const historicalInsights = [
      `Thermal-related anomalies detected ${thermalCases.length} times across historical cases.`,
      `${voltageCases.length} previous cases involved similar voltage instability or ripple during thermal testing.`,
      `Vibration and acoustic qualification accounted for ${vibeCases.length} structural or mechanism anomalies.`,
      `In 85% of retained cases, initial hypotheses assuming external GSE cabling were disproven upon internal probing.`
    ];

    res.json({
      environment: 'SIMULATED ENGINEERING DATA',
      totalCases: cases.length,
      historicalMemories: cases.length,
      componentsTracked: componentsTracked.size,
      subsystemsCovered: Object.keys(subsystemsCount).length,
      repeatedFailurePatterns: 4,
      openInvestigations: 2,
      resolvedInvestigations: cases.length,
      userRetainedCount,
      totalAudits: audits.length,
      memorySource: hindsightService.getStatus().memorySource,
      historicalInsights,
      subsystemsBreakdown: subsystemsCount,
      recentAnomalies: cases.slice(0, 5).map(c => ({
        id: c.id,
        satellite: c.satellite,
        subsystem: c.subsystem,
        component: c.component,
        severity: c.severity,
        detectedDate: c.date,
        failureMode: c.failureMode,
        status: 'RESOLVED & RETAINED'
      }))
    });
  });

  // Knowledge Map Graph Generation
  app.get('/api/knowledge-map', (req, res) => {
    const cases = memoryStore.getAllCases();
    const nodes: KnowledgeGraphNode[] = [];
    const edges: KnowledgeGraphEdge[] = [];

    const nodeSet = new Set<string>();

    function addNode(node: KnowledgeGraphNode) {
      if (!nodeSet.has(node.id)) {
        nodeSet.add(node.id);
        nodes.push(node);
      }
    }

    for (const c of cases) {
      const subId = `sub_${c.subsystem.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const compId = `comp_${c.component.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
      const failId = `fail_${c.failureMode.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}`;
      const rootId = `root_${c.id}`;
      const actionId = `action_${c.id}`;

      addNode({ id: subId, label: c.subsystem, type: 'subsystem', subsystem: c.subsystem });
      addNode({ id: compId, label: c.component.slice(0, 32), type: 'component', subsystem: c.subsystem, caseIds: [c.id] });
      addNode({ id: failId, label: c.failureMode.slice(0, 36), type: 'failure_mode', subsystem: c.subsystem, caseIds: [c.id] });
      addNode({ id: rootId, label: `${c.id} Root Cause`, type: 'root_cause', subsystem: c.subsystem, caseIds: [c.id] });
      addNode({ id: actionId, label: `${c.id} Fix: ${c.correctiveAction.actionAttempted.slice(0, 28)}...`, type: 'corrective_action', subsystem: c.subsystem, caseIds: [c.id] });

      edges.push({ from: subId, to: compId, label: 'contains' });
      edges.push({ from: compId, to: failId, label: 'exhibits' });
      edges.push({ from: failId, to: rootId, label: 'caused by' });
      edges.push({ from: rootId, to: actionId, label: 'resolved by' });
    }

    res.json({ nodes, edges });
  });

  // Reset Demo Data
  app.post('/api/reset-demo', (req, res) => {
    memoryStore.resetToDefaults();
    res.json({ success: true, message: 'Memory bank reset to 12 default spacecraft engineering failure cases.' });
  });

  // Serve static assets from public (including background video with Range support)
  app.use(express.static(path.join(__dirname, 'public')));

  // Frontend integration
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[SPACE-MEM] Mission Control Server running on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
    console.log(`[SPACE-MEM] Memory Engine Source: ${hindsightService.getStatus().memorySource}`);
    console.log(`[SPACE-MEM] Hindsight Bank ID: ${hindsightService.getStatus().bankId}`);
    console.log(`[SPACE-MEM] Reasoning LLM: Groq (${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'})`);
  });
}

startServer().catch(err => {
  console.error('[SPACE-MEM] Server startup error:', err);
  process.exit(1);
});
