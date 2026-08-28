# UI/UX Design System & Rationale
## The Lenny Growth Assistant

---

## 1. Design Philosophy & UX Principles

1. **Clarity & Cognitive Ease:** AI responses are dense with insights. The interface uses modern typography, generous whitespace, and structured Markdown formatting (headings, bullet points, selective bolding) so users can skim frameworks in seconds.
2. **Side-by-Side Spatial Model (Claude-Style Dual Pane):** Users shouldn't lose their conversation when inspecting generated artifacts. The interface dynamically divides into a 50/50 split workspace: the conversation thread on the left, and the live interactive artifact on the right.
3. **Transparent Grounding:** Every piece of advice displays a clickable citation pill (e.g., `[Brian Chesky (Ep 12)]`) linking to the exact podcast episode.
4. **Immediate Actionability (Zero-Prompt Friction):** The landing state features curated prompt suggestions for growth loops, Ship 30 essays, and interactive wireframes.

---

## 2. Information Architecture & Key Screen States

```
+-----------------------------------------------------------------------------------------------+
| TOP BAR: The Lenny Growth Assistant | Corpus: 300+ Episodes | [Ollama (Local)] [Claude (Cloud)]|
+-------------------+-------------------------------------------+-------------------------------+
| SIDEBAR           | CHAT WORKSPACE (Left Pane)                | ARTIFACT VIEWER (Right Pane)  |
|                   |                                           |                               |
| [+ New Chat]      | Welcome Cards / Message History           | Header: [Preview] [Code]      |
|                   | - User prompts                            | Viewport: [Desktop][Tab][Mob] |
| [Search chats...] | - Assistant answers (ReactMarkdown)       | Actions: [Copy] [Download][X] |
|                   | - Citation Badges                         |                               |
| Recent History    | - Interactive Artifact Launch Cards       | Sandboxed Render Area:        |
| - Airbnb Growth   |                                           | - Live Tailwind HTML UI or    |
| - Retention Loops | Input Composer:                           | - Formatted Markdown Essay    |
| - Ship 30 Essay   | [ Ask about PM frameworks...       ( > ) ]|                               |
+-------------------+-------------------------------------------+-------------------------------+
```

---

## 3. Interaction States

### 3.1 Empty / Discovery State
- Shows the branded Lenny Growth Assistant icon with gradient accents.
- Displays 4 prompt suggestions categorized by goal (Growth Tactics, Ship 30 Essay, HTML Artifact, Product Strategy).
- Clicking any suggestion populates and sends the query instantly.

### 3.2 Loading & Streaming State
- Animated pulse indicator with contextual status: *"Synthesizing grounded transcript knowledge..."*
- Input composer is disabled during active inference to prevent race conditions.

### 3.3 Artifact Generation State
- When an artifact is detected in the response, an interactive card is rendered below the chat bubble.
- Clicking the card automatically slides open the right-hand preview panel.

### 3.4 Responsive Viewport Preview
- The Artifact Viewer provides **Desktop**, **Tablet (768px)**, and **Mobile (375px)** toggles to evaluate responsive layout behavior of generated HTML.

---

## 4. Accessibility (a11y) & Keyboard Navigation

- **Color Contrast:** Strict adherence to WCAG AA contrast standards using Slate neutrals (`slate-900`, `slate-600`, `slate-50`) paired with vibrant accent blues (`blue-600`).
- **Focus Rings:** Distinct focus indicators (`focus:ring-4 focus:ring-blue-500/10`) on all interactive inputs and buttons.
- **Keyboard Shortcuts:**
  - `Enter`: Submit chat prompt.
  - `Escape`: Close active Artifact Viewer panel.
  - `Tab`: Sequential keyboard navigation across sidebar, messages, and artifact viewer controls.
- **Screen Reader Support:** Semantic HTML5 landmarks (`<header>`, `<main>`, `<aside>`, `<form>`) with descriptive `aria-labels` and `titles`.
