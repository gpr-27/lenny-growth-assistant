# Agent Transcripts & Problem-Solving Trajectory
## The Lenny Growth Assistant — Forward Deployed Engineer Assignment

---

## 1. Overview & Engineering Methodology
This document chronicles the AI coding agent's step-by-step problem-solving trajectory, technical trade-offs, encountered failures, and self-corrections while building and deploying **The Lenny Growth Assistant**.

---

## 2. Iteration Log & Self-Corrections

### Iteration 1: PostgreSQL Driver Selection for ARM64 macOS vs Linux Docker
- **Initial Plan:** Use standard `psycopg2-binary`.
- **Encountered Issue:** On host macOS machines without local PostgreSQL development headers (`pg_config`), `psycopg2-binary` failed to build from source.
- **Correction:** 
  1. Updated backend to utilize the modern `psycopg[binary]` (v3) dialect.
  2. Modified `database.py` connection URL to explicitly use `postgresql+psycopg://`.
  3. Ensured `psycopg2-binary` is installed inside the Linux Debian container where wheels are pre-compiled.

---

### Iteration 2: Alpine Linux vs Debian for Vite & Native Rolldown Bindings
- **Initial Plan:** Lightweight `node:20-alpine` Docker base image.
- **Encountered Issue:** Modern Vite (v5/v6) bundling engines (rolldown/esbuild) require specific `musl` native bindings on ARM64 Alpine that failed to resolve when mounting host directories.
- **Correction:** 
  1. Switched `frontend/Dockerfile` to `FROM node:20-slim` (glibc-based Debian).
  2. Isolated `frontend/node_modules` inside the container.
  3. Pinned stable versions for `react-markdown`, `remark-gfm`, and `@tailwindcss/typography`.

---

### Iteration 3: Host Port Collision Resolution (5173 & 8000)
- **Initial Plan:** Bind Frontend to `5173:5173` and Backend to `8000:8000`.
- **Encountered Issue:** An existing local Node process occupied port `5173` and an SSH tunnel process occupied port `8000`.
- **Correction:** 
  1. Remapped frontend in `docker-compose.yml` to `3000:5173`.
  2. Remapped backend to `8001:8000`.
  3. Updated `VITE_API_URL=http://localhost:8001` and ensured container interoperability via Docker internal DNS network (`http://backend:8000`).

---

### Iteration 4: Entity Retrieval Failure on Proper Nouns (Dense Vector Distance)
- **Initial Plan:** Standard dense cosine similarity vector search (`embedding <=> query_embedding`) with `nomic-embed-text`.
- **Encountered Failure:** Querying *"What are Claire Hughes Johnson's core operating principles?"* retrieved unrelated guests (*Julia Schottenstein, Melissa Perri, Brian Balfour*) because conversational speech has high dense cosine similarity across generic PM topics.
- **Root Cause:** Dense vector embeddings alone lack lexical precision for specific guest names and episode titles.
- **Correction:** Implemented **Hybrid Lexical & Vector Retrieval** in `backend/agent.py`:
  1. First query PostgreSQL relational metadata (`Transcript.title` and `Transcript.guest`) via ILIKE filters.
  2. Order matching episode chunks by cosine similarity.
  3. Backfill remaining slots with global vector search.
  4. Verified query for *"Claire Hughes Johnson"* now returns 100% accurate chunks from her Stripe scaling episode.

---

### Iteration 5: Blank Dashboard Artifact Rendering & CSP Sandbox
- **Initial Plan:** Restrictive sandbox `script-src 'none'` to guarantee zero-risk XSS prevention.
- **Encountered Failure:** Prompting the LLM to *"Generate an interactive HTML growth dashboard wireframe with metric cards"* resulted in an empty body with only `<h1>Growth Dashboard</h1>` because the LLM generated an empty `<table id="growth-dashboard">` relying on client-side JS loops that were blocked by CSP.
- **Correction:**
  1. Updated sandbox CSP in `ArtifactViewer.tsx` to permit inline scripts (`'unsafe-inline'`), Chart.js CDN, and Tailwind CSS CDN.
  2. Kept `sandbox="allow-scripts"` while strictly omitting `allow-same-origin` (ensuring the iframe runs in a unique null origin with zero access to parent cookies, DOM, or localStorage).
  3. Improved system prompt instructions in `backend/agent.py` to enforce writing rich declarative Tailwind HTML directly into elements.

---

### Iteration 6: Model Latency & Real-Time Token Streaming
- **Initial Plan:** Synchronous request/response HTTP JSON payload.
- **Encountered Failure:** Local LLM inference on consumer laptops took 8–15 seconds to return the complete response, causing poor user experience.
- **Correction:** Converted the entire stack to **Server-Sent Events (SSE) Streaming**:
  1. Converted `backend/agent.py` to async generator functions (`call_ollama_stream`, `call_anthropic_stream`, `call_openai_stream`).
  2. Converted `/sessions/{session_id}/chat` endpoint to return `StreamingResponse(event_stream(), media_type="text/event-stream")`.
  3. Updated `frontend/src/hooks/useChat.ts` to stream tokens in real time using `ReadableStream` and `TextDecoder`.

---

### Iteration 7: Light & Dark Theme Dual-Engine
- **Initial Plan:** Default dark theme with CSS class toggle.
- **Encountered Issue:** Hardcoded background colors on `index.html` `<body>` and `App.tsx` container prevented light mode from displaying properly.
- **Correction:**
  1. Removed static background classes from `index.html`.
  2. Dynamically bound `document.documentElement` and `document.body` to React theme state with `localStorage` persistence.
  3. Added interactive Sun/Moon switcher in both the sidebar and top header.

---

### Iteration 8: Citation Grounding & Direct GitHub Link Mapping
- **Initial Plan:** Generic links pointing to `lennysnewsletter.com/podcast`.
- **Encountered Issue:** Clicking citation chips opened a generic homepage without showing the exact episode transcript.
- **Correction:**
  1. Updated `search_transcripts` in `backend/agent.py` to dynamically construct GitHub URLs: `https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/{slug}/transcript.md`.
  2. Upgraded citation modal with a **"View Full Transcript on GitHub ↗"** button.

---

## 3. Automated Test Suite Verification

```bash
docker-compose exec backend pytest -v
```

```text
============================= test session starts ==============================
platform linux -- Python 3.11.15, pytest-8.1.1 -- /usr/local/bin/python3.11
rootdir: /app, configfile: pytest.ini

tests/test_agent.py::test_extract_html_artifact PASSED                   [ 11%]
tests/test_agent.py::test_extract_markdown_artifact PASSED               [ 22%]
tests/test_agent.py::test_no_artifacts_fallback PASSED                   [ 33%]
tests/test_agent.py::test_github_citation_link_generation PASSED         [ 44%]
tests/test_api.py::test_health_endpoints PASSED                          [ 55%]
tests/test_api.py::test_session_crud_api PASSED                          [ 66%]
tests/test_database.py::test_session_lifecycle PASSED                    [ 77%]
tests/test_database.py::test_transcript_schema PASSED                    [ 88%]
tests/test_security.py::test_iframe_sandbox_policy PASSED                [100%]

======================== 9 passed, 2 warnings in 0.59s =========================
```
