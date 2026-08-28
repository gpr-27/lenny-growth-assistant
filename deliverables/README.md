# 📦 Submission Deliverables Index
## Forward Deployed Engineer Assignment — The Lenny Growth Assistant

This directory contains all mandatory deliverables outlined in Section 6 & 8 of the assignment brief:

---

### 📂 Table of Deliverables

| # | Deliverable | Location & Direct File Link | Description |
|---|---|---|---|
| **1** | **Public Repository** | [Root Project](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant) | Clean full-stack codebase with 0 committed secrets. |
| **2** | **README.md** | [README.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/README.md) | Architecture overview, prerequisites, one-command deployment, test commands, and evaluation alignment. |
| **3** | **PRD** | [PRD.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/deliverables/PRD.md) | User persona, problem framing, success metrics, trade-offs, and user journeys. |
| **4** | **design.md** | [design.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/deliverables/design.md) | UI/UX design rationale, typography, color tokens, layout, and accessibility. |
| **5** | **architecture.md** | [architecture.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/deliverables/architecture.md) | System topology, database schema, hybrid retrieval, SSE streaming, and security sandbox. |
| **6** | **Agent Transcripts** | [agent-transcripts/README.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/agent-transcripts/README.md) | Engineering problem-solving log, failed attempts, and self-corrections across all 8 iterations. |
| **7** | **Automated & Manual Tests** | [tests/](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/tests) & [manual_test_plan.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/deliverables/manual_test_plan.md) | Automated Pytest suite (9/9 passing) plus click-by-click manual UI test plan. |
| **8** | **Demo Video Script** | [demo_video_script.md](file:///Users/gpr/Documents/ASSIGN/lenny-growth-assistant/deliverables/demo_video_script.md) | 2–3 minute video recording outline covering product demo, local Ollama execution, and trade-offs. |

---

### 🚀 Quick Start Instructions for Evaluator

1. **Start all services:**
   ```bash
   docker-compose up --build -d
   ```
2. **Access the application:**
   👉 **`http://localhost:3000`**
3. **Run automated test suite:**
   ```bash
   docker-compose exec backend pytest -v
   ```
