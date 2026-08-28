# Technical Architecture & System Design
## The Lenny Growth Assistant — FDE Take-Home Assignment

---

## 1. System Topology & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                 USER BROWSER                                      |
|                                                                                   |
|  +---------------------------+   +---------------------------------------------+  |
|  |     React 18 + Vite       |   |         Sandboxed Iframe Preview            |  |
|  |  - Sidebar & History      |   |  - Tailwind CSS CDN + Chart.js CDN          |  |
|  |  - SSE Streaming Hook     |   |  - sandbox="allow-scripts" (No Same-Origin) |  |
|  |  - Theme & Model Switcher |   |  - Desktop / Tablet / Mobile Viewports      |  |
|  +-------------+-------------+   +---------------------------------------------+  |
+----------------|------------------------------------------------------------------+
                 |
                 | HTTP POST /sessions/{id}/chat (SSE Stream)
                 v
+-----------------------------------------------------------------------------------+
|                        FASTAPI BACKEND SERVICE (Port 8001)                        |
|                                                                                   |
|  +---------------------------+   +---------------------------------------------+  |
|  |      Agent Controller     |   |          Hybrid Retrieval Engine            |  |
|  |  - Skill Intent Router    |   |  - PostgreSQL Metadata ILIKE Search         |  |
|  |  - Grounding Guardrails   |   |  - pgvector 768-dim Cosine Distance (<=>)   |  |
|  |  - Streaming Generators   |   |  - Transcript Chunk Ranker & XML Builder    |  |
|  +-------------+-------------+   +----------------------+----------------------+  |
+----------------|----------------------------------------|-------------------------+
                 |                                        |
                 | SQL Queries (SQLAlchemy)               | Cosine Similarity (<=>)
                 v                                        v
+-----------------------------------------------------------------------------------+
|                      POSTGRESQL 16 + PGVECTOR (Port 5432)                         |
|                                                                                   |
|  - transcripts: id (UUID), episode_number, title, guest, url                      |
|  - transcript_chunks: id (UUID), transcript_id (FK), content, embedding (vector)  |
|  - sessions: id (UUID), title, created_at                                         |
|  - messages: id (UUID), session_id (FK), role, content, created_at                |
|  - artifacts: id (UUID), message_id (FK), type, title, content                    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Ingestion & Retrieval Pipeline

### 2.1 Recursive Ingestion Pipeline (`ingest.py`)
1. Traverses `lennys-podcast-transcripts/episodes/**/*.md` recursively.
2. Extracts episode metadata (guest, title, YouTube URL) from YAML frontmatter and folder names.
3. Splits transcript text into overlapping chunks (~1,000 characters with 150-character overlap) to preserve conversational context.
4. Generates 768-dimensional embeddings using `nomic-embed-text` via Ollama.
5. Inserts metadata and vector embeddings into PostgreSQL with `HNSW / IVFFlat` indexing.

### 2.2 Hybrid Retrieval Engine (`agent.py:search_transcripts`)
To solve the proper-noun entity failure of standard dense vector search:
1. **Lexical Metadata Filtering:** Queries `transcripts` table with `ILIKE %term%` on guest names and titles (e.g. *"Claire Hughes Johnson"*).
2. **Episode-Constrained Vector Distance:** Orders matching chunks by cosine distance against the query embedding.
3. **Global Vector Backfill:** Fills remaining context slots with global top-k nearest neighbors.
4. **XML Source Wrapping:** Emits `<source id="..." title="..." episode="...">` blocks into the prompt.
5. **Direct GitHub Link Generation:** Maps episode titles to exact repository files (`https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/{slug}/transcript.md`).

---

## 3. Real-Time Streaming & Agent Layer

### 3.1 Server-Sent Events (SSE) Protocol
FastAPI streams chunks with `text/event-stream` media type:
* `data: {"type": "meta", "trace": [...], "citations": [...]}\n\n`
* `data: {"type": "token", "content": "..."}\n\n`
* `data: {"type": "artifact", "artifact": {"type": "html", ...}}\n\n`
* `data: {"type": "done"}\n\n`

### 3.2 Skill Intent Routing
The agent analyzes prompt keywords to activate specialized personas:
* **Ship 30 for 30 Skill:** Triggers on *"ship 30", "essay", "article", "atomic essay"*. Injects strict formatting rules for magnetic hook, stakes, numbered pillars, and action takeaways.
* **Artifact Generator Skill:** Triggers on *"html", "dashboard", "wireframe", "ui", "component"*. Enforces rich declarative Tailwind HTML markup.
* **Standard Q&A:** Grounded synthesis with mandatory guest attribution and strict hallucination refusal.

---

## 4. Zero-Trust Security Sandbox

1. **Isolation Boundary:** LLM-generated HTML renders strictly within an `<iframe>` configured with `sandbox="allow-scripts allow-forms allow-modals"`.
2. **Access Prevention:** The critical `allow-same-origin` token is **omitted**. This forces the iframe into an opaque `null` origin, making it impossible to access parent `window.localStorage`, cookies, session tokens, or parent DOM.
3. **Content Security Policy (CSP):**
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https: data:; script-src 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https:; font-src https: data:;">
   ```
   Permits CDN stylesheets, Google Fonts, and Chart.js while isolating the host runtime.
