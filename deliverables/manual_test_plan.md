# 🧪 Manual QA Test Plan
## The Lenny Growth Assistant — UI & Interaction Test Suite

---

### Test 1: Grounded Q&A with Entity Retrieval
- **Action:** In the chat input, submit: `"What are Claire Hughes Johnson's core operating principles from scaling Stripe?"`
- **Expected Result:**
  1. Instant SSE streaming tokens appear in real-time.
  2. The assistant cites Claire Hughes Johnson and Stripe scaling principles.
  3. A citation badge for `Claire Hughes Johnson (Episode)` appears at the bottom.
  4. Clicking the citation badge opens the transcript excerpt modal.
  5. Clicking **"View Full Transcript on GitHub ↗"** opens the exact `claire-hughes-johnson/transcript.md` file in GitHub.

---

### Test 2: Ship 30 for 30 Content Skill
- **Action:** Click the prompt card: *"Turn the key retention metrics and PM lessons from Lenny's guests into a Ship 30 essay."*
- **Expected Result:**
  1. The response generates a formatted ~1,250-word atomic essay.
  2. Structure includes **Magnetic Hook**, **The Stakes**, **3-5 Core Framework Pillars** (with bold guest quotes), and an **Action Step**.
  3. In the split pane on the right, the **Artifact Viewer** opens automatically in Markdown preview mode with copy and download buttons.

---

### Test 3: Live Interactive HTML Dashboard & Sandbox Isolation
- **Action:** Click the prompt card: *"Generate an interactive HTML growth dashboard wireframe with metric cards."*
- **Expected Result:**
  1. The assistant generates a complete HTML dashboard styled with Tailwind CSS.
  2. The split-screen Artifact Viewer opens with a live interactive dashboard preview.
  3. Metric cards, retention curves, and counters render with high-contrast typography.
  4. Toggle between **Desktop**, **Tablet (768px)**, and **Mobile (390px)** frames to verify responsiveness.
  5. Click the **Refresh Sandbox** (`RotateCw`) button to verify hot reload without page refresh.

---

### Test 4: Light & Dark Mode Engine
- **Action:** Click the **Light** button in the sidebar footer, then click the **Moon** icon in the top header.
- **Expected Result:**
  1. Light Mode switches the workspace to `bg-slate-50` with high-contrast text (`slate-900`).
  2. Dark Mode switches the workspace to `bg-slate-950` with crisp text (`slate-100`).
  3. Reloading the browser preserves the active theme without flickering (`localStorage` synchronization).

---

### Test 5: Dynamic LLM Model Switcher & Settings Modal
- **Action:** Click the Settings gear icon in the top navbar.
- **Expected Result:**
  1. The Settings Modal opens cleanly with no overflowing dropdown elements.
  2. Switch between **Ollama (Llama 3.2 1B)**, **Anthropic Claude 3.5/3.7**, and **OpenAI GPT-4o**.
  3. Enter custom model IDs if needed, save, and verify the model indicator pill in the top header updates dynamically.
