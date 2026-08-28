# 🎥 Camera-Enabled Submission Video Transcript (2:30 Minutes)
## The Lenny Growth Assistant — Forward Deployed Engineer Submission

---

### 📋 Video Overview Checklist (Against Assessment Rubric)
- [x] **Camera & Face Enabled** (Picture-in-picture / webcam introduction)
- [x] **Problem Statement Explained** (Unstructured podcast audio -> actionable PM intelligence)
- [x] **Product Walkthrough** (Grounded Q&A, Citations, Ship 30 Engine, Claude Artifacts, Library)
- [x] **Local Ollama Demonstrated** (Llama 3.2 1B running 100% on device with SSE streaming)
- [x] **Technical Trade-Off Covered** (Context Budget vs Semantic Recall for local 1B models)

---

### 🎬 Complete Spoken Video Transcript

```
================================================================================
⏱️ 0:00 – 0:30 | PILLAR 1: ON-CAMERA INTRO & PROBLEM STATEMENT
================================================================================
🎥 VISUAL: Camera/Webcam full screen or top corner, showing http://localhost:3000

🗣️ SPOKEN (Look directly into the camera):
"Hi everyone! My name is [Your Name], and I'm presenting The Lenny Growth Assistant, 
an AI platform built for Product Managers, Growth Leads, and Founders.

The core problem is that over 300 episodes of Lenny's Podcast contain world-class 
tactical frameworks, but searching through hundreds of hours of audio and transcripts 
is slow, ungrounded, and manual. 

We built a forward-deployed system that ingests over 11,700 transcript chunks into 
PostgreSQL with pgvector, grounding every answer with verifiable citations, generating 
Ship 30 essays, and rendering live interactive HTML wireframes natively."

================================================================================
⏱️ 0:30 – 1:05 | PILLAR 2: LOCAL OLLAMA DEMO & GROUNDED CITATIONS
================================================================================
🎥 VISUAL: Screen share on Chat interface. Click Prompt 1 ("Stripe Operating Principles").

🗣️ SPOKEN:
"First, let's demonstrate 100% local inference using Ollama running Llama 3.2 1B.

I'll click our first prompt: 'What are Claire Hughes Johnson's core operating principles 
from scaling Stripe?'

Notice the sub-second Server-Sent Events token stream running entirely on-device with 
zero cloud API costs. 

Our retrieval pipeline uses hybrid metadata filtering plus 768-dimensional dense vector 
search. Clicking the citation pill reveals the exact transcript snippet, and clicking 
'View Full Transcript on GitHub' links directly to the official markdown source repository."

================================================================================
⏱️ 1:05 – 1:40 | PILLAR 3: SHIP 30 WRITING ENGINE & CLAUDE ARTIFACTS
================================================================================
🎥 VISUAL: Click Prompt 2 ("Ship 30 for 30 Essay"), then click Prompt 3 ("Interactive Growth Dashboard").

🗣️ SPOKEN:
"Next, our agentic skill router includes a specialized Ship 30 for 30 content engine 
that turns podcast insights into atomic essays with hooks, pillars, and takeaways. 

While generating, the non-blocking message composer lets users queue follow-ups 
asynchronously.

Now, let's generate a visual artifact by clicking 'Interactive Growth Dashboard'. 
Our Claude-style split-pane Artifact Viewer automatically opens on the right. 

Inside an isolated sandbox iframe with Tailwind and Chart.js, the dashboard renders 
populated KPI metric cards, a live interactive 6-month growth trajectory chart, and a 
working 'Export Report' button that downloads executive CSV data. We can test responsiveness 
across Desktop, Tablet, and Mobile viewports."

================================================================================
⏱️ 1:40 – 2:10 | PILLAR 4: DEDICATED ARTIFACTS LIBRARY
================================================================================
🎥 VISUAL: Click the "Artifacts" tab in the top navigation bar to show the Library view.

🗣️ SPOKEN:
"Every artifact is automatically persisted into PostgreSQL. Clicking our dedicated 
'Artifacts' tab opens a centralized library where operators can search, filter by 
HTML or Markdown, rename, download, and reopen any previously generated prototype 
across all conversation sessions."

================================================================================
⏱️ 2:10 – 2:30 | PILLAR 5: CRITICAL TECHNICAL TRADE-OFF & WRAP-UP
================================================================================
🎥 VISUAL: Show Settings modal with Ollama/Cloud options, then conclude on camera.

🗣️ SPOKEN:
"One key technical trade-off was Context Budget vs Semantic Recall for local 1B models. 
Feeding 15 full chunks saturated the 4k context window and caused generation lag. 
We engineered a hybrid two-tier retrieval pass—pruning to top-6 dense chunks combined 
with metadata entity routing. This reduced prompt token overhead by 60% and achieved 
sub-second time-to-first-token locally without losing accuracy.

The full stack runs with a single `docker-compose up` command, backed by 10 passing 
automated integration tests. Thank you for watching!"
================================================================================
```

