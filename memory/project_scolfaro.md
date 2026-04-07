---
name: Scolfaro Automobili Project
description: Premium car collection dashboard for the Scolfaro family — tech stack, design system decisions, and architectural context
type: project
---

Private family vehicle registry dashboard. Not a sales site — it's a premium control panel.

**Stack:** React 19 + TypeScript + Tailwind CSS v4 + Recharts + Lucide React + React Router v7 + Vite

**Key design decisions:**
- Theme uses `data-theme="dark"|"light"` on `<html>` (NOT Tailwind's `.dark` class)
- All colors via CSS custom properties (`var(--token)`) defined in `src/index.css`
- Fonts: Syne (headings, `.font-display`), DM Sans (body, base), JetBrains Mono (numbers, `.font-data`)
- Dark mode default (yellow accent `#F5C400`), light mode uses royal blue (`#1D4ED8`)
- Custom CSS component classes: `.sa-card`, `.sa-btn-primary`, `.sa-btn-ghost`, `.sa-input`, `.sa-select`, `.sa-chip`, `.sa-badge`, `.sa-table`, `.vehicle-card`, `.empty-state`, etc.
- Charts (Recharts) still use JS color values via `isDark` since SVG can't always read CSS vars

**Why:** Family requested a premium, Bloomberg/Porsche-Digital inspired dark dashboard to manage their car collection with AI-powered FIPE value updates.

**How to apply:** When editing components, use CSS variable tokens (`var(--text-primary)` etc.) not hardcoded hex. Recharts components are the exception — they need JS color values.
