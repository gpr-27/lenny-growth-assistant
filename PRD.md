# Product Requirements Document (PRD)
## The Lenny Growth Assistant

---

## 1. Forward Deployment Discovery Brief

### 1.1 User and Problem Statement
- **Target User:** Product Managers (PMs), Growth Engineers, Founders, and Product Marketing Managers.
- **The Core Problem:** Lenny’s Podcast contains hundreds of hours of gold-standard product and growth frameworks from world-class operators (Brian Chesky, Sean Ellis, Elena Verna, Shreyas Doshi). However, finding specific answers is painful:
  1. Traditional search engines fail to extract precise guest quotes and context.
  2. Generic LLMs hallucinate frameworks or give generic advice detached from proven operator playbooks.
  3. Knowledge workers waste hours turning raw insights into shareable documents or UI mockups.
- **The Solution:** An internal AI assistant that strictly retrieves facts from podcast transcripts, generates structured Ship 30 for 30 essays, and renders interactive HTML/Markdown artifacts side-by-side in the product.

### 1.2 Success Metrics
1. **Factual Grounding Rate:** 100% of answers cite specific guests/episodes; 0% hallucinated frameworks.
2. **Time to Actionable Artifact:** < 10 seconds to generate a formatted Ship 30 framework or HTML wireframe.
3. **Local Self-Containment:** 100% of the demo executes on local Ollama + PostgreSQL without mandatory paid cloud services.

### 1.3 Assumptions
- Evaluator has a modern machine capable of running Docker and Ollama with an 8B model (`llama3.1`).
- Session IDs are stored locally in the browser to maintain independent conversational context without requiring friction-heavy user authentication.
- Transcripts are loaded from the static repository and indexed into vector chunks during initial setup.

### 1.4 Scope Choices
- **Included:**
  - PostgreSQL + pgvector RAG pipeline with cosine similarity search.
  - Multi-model toggle (Local Ollama vs Cloud Claude 3.5 Sonnet).
  - Dedicated Ship 30 for 30 essay generation skill (~1,250 words, hook, pillars, action takeaway).
  - Claude-style Artifact Viewer with responsive device switchers and strict iframe sandboxing.
  - Session creation, deletion, search, and message history persistence.
- **Intentionally Excluded:**
  - Multi-tenant enterprise authentication (unnecessary evaluator overhead).
  - Paid cloud vector databases (Pinecone/Qdrant Cloud) in favor of self-contained local pgvector.

### 1.5 Risks and Mitigations
| Risk | Severity | Mitigation Strategy |
|---|---|---|
| Malicious HTML injection (XSS) | **Critical** | Sandboxed `<iframe>` with `sandbox="allow-scripts"` (strictly no `allow-same-origin`) plus a Content Security Policy blocking external scripts. |
| Local LLM hallucination | **High** | Injected XML context tags with strict system instructions: *"If information is missing, explicitly reply 'I cannot find information about this in Lenny's transcripts.'"* |
| Ollama timeout / unavailability | **Medium** | Structured error handling with friendly fallback messages instructing the evaluator how to start Ollama. |

---

## 2. Product Features & User Journeys

### User Journey 1: Grounded Q&A
1. User enters: *"How did Airbnb acquire its first 1,000 users?"*
2. System retrieves relevant transcript chunks using pgvector cosine similarity.
3. System responds with exact operator insights from Brian Chesky and displays clickable citation badges.

### User Journey 2: Ship 30 for 30 Essay Generation
1. User enters: *"Turn the key retention metrics and PM lessons into a Ship 30 for 30 essay."*
2. System activates the **Ship 30 for 30 skill**.
3. Outputs an atomic, skimmable essay with:
   - Magnetic hook
   - Tension / stakes
   - 3-5 bolded framework pillars
   - 1 concrete action step
   - Grounded citations

### User Journey 3: Interactive Artifact Generation & Viewer
1. User enters: *"Generate an interactive HTML growth dashboard wireframe with metric cards."*
2. System detects HTML generation, strips raw code from chat, and renders the live interactive design in the right-hand Artifact Viewer panel.
3. User toggles between **Desktop**, **Tablet**, and **Mobile** viewports, inspects the raw code, or downloads the file.

---

## 3. Acceptance Criteria
- [x] Full-stack application runs with `docker-compose up`.
- [x] Answers cite specific podcast guests and episodes.
- [x] Model switcher smoothly toggles between Local Ollama and Cloud Claude.
- [x] Generated HTML artifacts are rendered securely in an isolated iframe.
- [x] Sessions and chat history persist across page refreshes in PostgreSQL.
- [x] Automated test suite passes with 100% green status.
