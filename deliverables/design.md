# Design System & UI/UX Architecture
## The Lenny Growth Assistant — FDE Take-Home Assignment

---

## 1. UI/UX Principles & Aesthetic Standard

The application follows the **Linear / Stripe / Claude 3.7 design standard**:
1. **Clarity & High Information Density:** Clean margins, intuitive split-screen view, and clear typographic hierarchy.
2. **Native Dual-Engine Theming:** Tailored dark mode (`slate-950` with glassmorphic accents) and high-contrast light mode (`slate-50` with `slate-900` typography).
3. **Zero Visual Noise:** No redundant buttons, clean collapsible icon bars, and smooth micro-interactions.
4. **Immediate Feedback:** Real-time token streaming via SSE, animated status pulses, and live citation drawers.

---

## 2. Color Tokens & Typography

### Typography
* **Primary Sans:** `Plus Jakarta Sans` (Google Fonts) for geometric readability and modern product feel.
* **Monospace:** `JetBrains Mono` for code blocks, prompt badges, and raw transcript excerpts.

### Color Palette Tokens
| Token | Dark Mode Value | Light Mode Value | Purpose |
|---|---|---|---|
| **Background Root** | `bg-slate-950` (`#020617`) | `bg-slate-50` (`#f8fafc`) | Main viewport background |
| **Card / Surface** | `bg-slate-900/90` (`#0f172a`) | `bg-white` (`#ffffff`) | Chat bubbles, modals, and prompt cards |
| **Borders** | `border-slate-800` | `border-slate-200/80` | Clean structural dividing lines |
| **Brand Primary** | `indigo-600` / `violet-500` | `indigo-600` / `violet-500` | Gradients, primary action buttons, focus rings |
| **Success / Status** | `emerald-500` | `emerald-600` | Online indicator, copied state, pricing pill |
| **Text Primary** | `text-slate-100` | `text-slate-900` | Headings, user queries, assistant answers |
| **Text Muted** | `text-slate-400` | `text-slate-600` | Timestamps, citations, descriptions |

---

## 3. Information Architecture & Key Layout Components

### 3.1 Collapsible Sidebar (`Sidebar.tsx`)
- **Brand Header:** Icon avatar with glowing gradient and subtitle.
- **New Conversation:** Prominent primary action button (`PlusCircle`).
- **Live Search Filter:** Client-side real-time filtering of session titles.
- **Recent History List:** Active session highlight, message counter pill, and hover-triggered delete button (`Trash2`).
- **Footer Theme Controller:** Dual-pill toggle for instant switching between **Light** and **Dark** modes with persistent storage.

### 3.2 Main Chat Workspace (`Chat.tsx`)
- **Greeting State:** Modern glowing Sparkles card with 4 categorized starter prompt pills (*Tactical User Acquisition*, *Ship 30 Essay*, *Interactive Dashboard*, *Scaling Operating Cadence*).
- **Message Cards:** User messages styled in royal indigo gradients; Assistant messages styled in crisp bordered cards with markdown rendering.
- **Citation Drawer:** Pill-shaped citation badges showing episode number and guest name. Clicking opens a modal with raw transcript text and direct link to GitHub markdown file.
- **Execution Trace Drawer:** Expandable dropdown showing pipeline steps (`expand` $\rightarrow$ `retrieve` $\rightarrow$ `grade` $\rightarrow$ `generate`).

### 3.3 Claude-Style Artifact Viewer (`ArtifactViewer.tsx`)
- **Split-Screen Panel:** Occupies 50% width when artifacts are active; collapsible via close button.
- **Tabbed View:** Toggle between **Live Interactive Preview** and **Source Code Inspection** (`Code2` tab).
- **Device Frame Switcher:** One-click simulation of **Desktop**, **Tablet (768px)**, and **Mobile (390px)**.
- **Action Toolbar:** Hot sandbox refresh (`RotateCw`), copy raw code (`Copy`), and download file (`Download`).

---

## 4. Accessibility & Security
- **Keyboard Navigation:** Full support for `Enter` to submit, `Shift+Enter` for multiline input, and `Escape` to dismiss modals.
- **Contrast Ratios:** All text combinations exceed WCAG 2.1 AA contrast requirements (> 4.5:1).
- **Iframe Sandbox Isolation:** All untrusted HTML is executed inside an iframe with `sandbox="allow-scripts"` (strictly avoiding `allow-same-origin`), completely preventing XSS vectors.
