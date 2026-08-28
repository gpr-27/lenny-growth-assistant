# Product Requirements Document (PRD)
## The Lenny Growth Assistant — FDE Take-Home Assignment

---

## 1. Forward Deployment Discovery Brief

### 1.1 User Persona & Problem Statement
- **Target User:** Product Managers (PMs), Growth Leads, Founders, and Product Marketing Managers.
- **The Core Problem:** Lenny’s Podcast contains 300+ hours of gold-standard product, growth, and leadership playbooks from world-class operators (Brian Chesky, Claire Hughes Johnson, Elena Verna, Shreyas Doshi, Sean Ellis). However, extracting and operationalizing this knowledge is broken:
  1. Traditional search engines fail to surface nuanced guest frameworks and timestamps.
  2. Generic LLMs hallucinate non-existent tactics or provide generic advice detached from real operator experience.
  3. Turning raw ideas into executive essays or UI dashboard wireframes takes hours of manual synthesis.
- **The Solution:** **The Lenny Growth Assistant** — an internal AI assistant that strictly retrieves facts from podcast transcripts using Hybrid Lexical + Vector search, generates publication-grade Ship 30 essays, and renders live, interactive HTML dashboards in an enterprise-grade split pane.

---

### 1.2 Success Metrics & KPIs
1. **Factual Grounding Rate:** 100% of answers cite specific guests and episodes; 0% hallucinated quotes.
2. **First Token Latency:** < 1 second using Server-Sent Events (SSE) streaming on local Ollama models.
3. **Artifact Generation & Render Rate:** 100% of generated HTML dashboards render cleanly in the sandbox viewer with 0 script crash errors.
4. **Local Self-Containment:** 100% of the core demo runs on local Ollama + PostgreSQL without mandatory paid API keys.

---

### 1.3 Scope Choices & Technical Trade-Offs

| Decision | Chosen Approach | Alternative Considered | Rationale |
|---|---|---|---|
| **Vector Engine** | PostgreSQL 16 + `pgvector` | Pinecone / Qdrant Cloud | Eliminates external SaaS dependencies, guarantees zero cost, and runs entirely in Docker. |
| **Retrieval Strategy** | Hybrid Lexical (ILIKE) + `pgvector` Cosine Distance | Pure Vector Distance | Solves entity search failure for proper nouns (e.g. guest names like Claire Hughes Johnson). |
| **Streaming Protocol** | Server-Sent Events (SSE) | WebSocket / Polling | Lightweight, native browser `ReadableStream` support, auto-reconnect, and stateless HTTP endpoints. |
| **Security Sandbox** | `iframe` with `sandbox="allow-scripts"` & Strict CSP | Raw `dangerouslySetInnerHTML` | Total isolation: prevents parent cookie exfiltration, DOM hijacking, and XSS vulnerabilities. |
| **Local Model** | Ollama `llama3.2:1b` (with fallback to 8B/70B/Claude) | Cloud-Only GPT-4 | Ensures evaluators on consumer hardware experience instant responses with zero token costs. |

---

## 2. Core User Flows & Journeys

### User Flow 1: Grounded Q&A with Verified Citations
1. User queries: *"What are Claire Hughes Johnson's core operating principles from scaling Stripe?"*
2. System executes Hybrid Retrieval: matches episode metadata, extracts top chunks by cosine distance, and streams the answer via SSE.
3. Assistant cites Claire Hughes Johnson with exact episode badges.
4. User clicks citation badge $\rightarrow$ reads raw transcript excerpt $\rightarrow$ clicks **"View Full Transcript on GitHub ↗"** to inspect the source file.

### User Flow 2: Ship 30 for 30 Content Engine
1. User queries: *"Turn the key retention metrics and PM lessons into a Ship 30 essay."*
2. Agent detects essay intent and synthesizes an atomic ~1,250-word essay with a magnetic hook, tension/stakes, 3-5 bolded framework pillars, and an action step.
3. Right-hand Artifact Viewer automatically opens with the formatted markdown essay.

### User Flow 3: Live Interactive HTML Dashboard
1. User queries: *"Generate an interactive HTML growth dashboard wireframe with metric cards."*
2. Agent formats declarative HTML with Tailwind CSS and Chart.js.
3. Artifact Viewer renders the interactive dashboard inside the zero-trust iframe sandbox.
4. User tests responsiveness across **Desktop**, **Tablet (768px)**, and **Mobile (390px)** frames.

---

## 3. Acceptance & Verification Criteria
- [x] One-command Docker startup (`docker-compose up --build -d`).
- [x] Real-time SSE token streaming for all LLM providers.
- [x] Hybrid lexical and dense vector search over 303 episodes / 11,709 chunks.
- [x] Untrusted HTML sandboxing with zero XSS vulnerabilities.
- [x] Dual-engine Light and Dark mode with instant toggle.
- [x] Direct GitHub markdown citation linking.
- [x] Automated Pytest suite passing 100%.
