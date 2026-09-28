# SPACE-MEM — Spacecraft Failure Memory & Investigation Assistant

> **“Every spacecraft failure becomes experience for the next spacecraft.”**

---

## 1. Problem & Challenge

Spacecraft environmental qualification and on-orbit operations are unforgiving. When a satellite component or subsystem encounters an anomaly (e.g., bus voltage collapse during a thermal-vacuum cold soak, reaction wheel tachometer jitter after random vibration, or packet loss during an RF burst), test and reliability engineers often have to start investigations from zero.

Engineering notes and past post-mortems are scattered across historical reports, slide decks, or siloed in the minds of veteran engineers. As a result:
- Teams frequently repeat previously attempted, disproven troubleshooting paths (e.g., spending 36 hours replacing external chamber cabling when the real cause was sub-zero MOSFET gate driver oscillation).
- Critical lessons learned in previous qualification programs are lost.
- New failure modes are evaluated without grounding in the spacecraft subsystem's prior behavioral history.

---

## 2. Target Architecture

SPACE-MEM couples **Hindsight** as the persistent engineering memory layer with **Groq LLM** as the ultra-fast reasoning and synthesis engine:

- **Hindsight:** Persistent spacecraft engineering memory (retaining ground-truth failure records, validated root causes, what worked vs. what failed, and reflection directives).
- **Groq LLM:** High-performance reasoning and generation LLM (`openai/gpt-oss-120b`), synthesizing root causes and actionable recommendations grounded strictly in recalled Hindsight memories.
- **SPACE-MEM:** Autonomous spacecraft failure investigation agent coordinating the closed-loop investigation lifecycle.

```
                      ┌────────────────────────────────────────┐
                      │            SPACE-MEM UI                │
                      │     React 19 / Mission Control         │
                      └───────────────────┬────────────────────┘
                                          │ POST /api/investigate
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          EXPRESS BACKEND               │
                      │       (server.ts / Node.js)            │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          HINDSIGHT MEMORY              │
                      │  ├── RETAIN: Store failure knowledge   │
                      │  ├── RECALL: Retrieve past precedents  │
                      │  └── REFLECT: Multi-memory patterns    │
                      └───────────────────┬────────────────────┘
                                          │ Recalled Memories & Context
                                          ▼
                      ┌────────────────────────────────────────┐
                      │              GROQ LLM                  │
                      │       (openai/gpt-oss-120b)            │
                      │   - Root Cause Analysis & Hypotheses   │
                      │   - Investigation Recommendations      │
                      └───────────────────┬────────────────────┘
                                          │ Investigation Report
                                          ▼
                      ┌────────────────────────────────────────┐
                      │        ENGINEER VALIDATION             │
                      │  (Human-in-the-Loop Sign-off & ECO)    │
                      └───────────────────┬────────────────────┘
                                          │ Confirmed Experience
                                          ▼
                      ┌────────────────────────────────────────┐
                      │            HINDSIGHT RETAIN            │
                      │  (Available for future satellite test) │
                      └────────────────────────────────────────┘
```

---

## 3. Investigation Workflow: Hindsight-First

The investigation flow guarantees that Groq **never bypasses Hindsight**:

```
INPUT SPACECRAFT FAILURE
         ↓
  HINDSIGHT RECALL
         ↓
RELEVANT HISTORICAL FAILURES
         ↓
 HINDSIGHT REFLECT
         ↓
HISTORICAL PATTERNS / LESSONS
         ↓
     GROQ LLM
         ↓
 ROOT CAUSE ANALYSIS
         ↓
  RECOMMENDATIONS
         ↓
ENGINEER VALIDATION
         ↓
 HINDSIGHT RETAIN
```

1. **INPUT:** Engineer submits telemetry observations, error codes, and chamber conditions (e.g. -45°C TVAC cold soak).
2. **HINDSIGHT RECALL:** Multi-signal semantic search retrieves similar historical failure cases from the `space-mem-engineering` bank.
3. **HINDSIGHT REFLECT:** Cross-case reflection analyzes recurring physical failure mechanisms across memories, constrained by Hindsight Bank Mission & Directives.
4. **GROQ LLM:** Powered by Groq's `openai/gpt-oss-120b`, synthesizing root causes, distinguishing historical evidence from hypotheses, and generating safe, bench-tested verification procedures.
5. **ENGINEER VALIDATION:** Qualified aerospace engineers review recommendations, conduct physical bench checks, and confirm actual root causes.
6. **HINDSIGHT RETAIN:** Confirmed findings are retained back into Hindsight for the benefit of future spacecraft programs.

---

## 4. Multi-Turn Learning Loop Demo

SPACE-MEM showcases how Hindsight memory transforms investigation capability across consecutive missions:

- **Interaction 1 (Novel Anomaly):** 
  An Astro-Probe-9 Hall Thruster experiences a cold ignition dropout at -45°C TVAC. Hindsight discovers zero prior precedent. The engineer diagnoses xenon choke liquefaction, solves it with a 15-minute cathode pre-heat cycle, and **RETAINS** this confirmed experience into Hindsight.
- **Interaction 2 (Related Anomaly):**
  A next-generation DeepSpace-Explorer-2 thruster encounters a similar cold vacuum startup flameout. SPACE-MEM immediately **RECALLS** the previous investigation, Groq receives the historical memory, reflects on the recurring xenon pre-heat mechanism, and delivers an exact, validated solution—saving an estimated 36+ test chamber hours.

---

## 5. Environment Variables & Setup

Configure the following variables in `.env` (or via server secrets):

```bash
# Groq Reasoning LLM (Backend-only, never exposed to client)
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="openai/gpt-oss-120b"

# Hindsight Cloud Memory Engine (Optional - Demo mode works automatically if unset)
HINDSIGHT_API_KEY=""
HINDSIGHT_BASE_URL="https://api.hindsightcloud.com"
HINDSIGHT_BANK_ID="space-mem-engineering"

# Server Port
PORT=3000
```

> **Security Note:** `GROQ_API_KEY` is strictly encapsulated on the server-side. It is never bundled into client Vite code or sent to the browser.

---

## 6. API Endpoints

- `GET /api/status`: System status reporting Hindsight connection and Groq model configuration.
- `GET /api/cases`: Retrieve historical failure cases with subsystem and severity filters.
- `GET /api/cases/:id`: Detailed historical case dossier.
- `POST /api/investigate`: Complete Hindsight-First Groq investigation.
- `POST /api/recall`: Hindsight RECALL endpoint retrieving similar historical cases.
- `POST /api/reflect` / `POST /api/hindsight/reflect`: Hindsight REFLECT multi-case reasoning.
- `POST /api/retain`: Retain engineer-validated findings into Hindsight memory bank.
- `POST /api/chat`: Grounded investigation assistant powered by Groq and Hindsight memory.
- `GET /api/demo/comparison/:caseId?`: Before vs. After comparison demonstrating the value of Hindsight memory.
- `POST /api/demo/learning-loop/*`: Interactive 8-step learning loop demonstration.

---

## 7. Safety Notice & Human-in-the-Loop Gating

**SPACE-MEM IS AN ENGINEERING DECISION-SUPPORT SYSTEM.**

- AI-generated analyses, hypotheses, and recommended steps must be reviewed and validated by qualified human aerospace engineers before any operational decision, hardware modification, or flight procedure update is executed.
- SPACE-MEM **never** automatically transmits commands or modifies the flight configuration of any satellite or spacecraft.
- All pre-seeded failure cases are realistic, simulated aerospace engineering records created for demonstration and evaluation purposes.
