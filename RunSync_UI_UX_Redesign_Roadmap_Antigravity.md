# RunSync 2.0 — World-Class UI/UX Redesign Roadmap for Antigravity

**Goal:** Redesign the complete RunSync product UI—from authentication through dashboard and storage—into a distinctive, premium, highly usable experience inspired by the visual craft of https://www.mapadoastro.com.br/ and https://nesilnoble.com/. Preserve every existing feature and integration.

## Non-negotiable constraints
1. Do not modify the Codespace worker repository, FastAPI code, worker API contract, GitHub Actions workflow, start_service.sh, .devcontainer, or worker startup scripts.
2. Preserve all existing features and user flows. Do not delete a feature because the new layout makes it inconvenient.
3. Keep existing API routes and payload contracts compatible. Do not invent worker endpoints or assume pause/resume is supported unless the current implementation confirms it.
4. Do not use fake metrics, fake files, fake progress, fake online states, fake capacity, or fabricated success messages.
5. Never weaken authentication, authorization, validation, or access controls to make UI work easier.
6. Keep secrets out of browser bundles and NEXT_PUBLIC_* variables.
7. Do not claim an action succeeded until the real API confirms it.
8. Inspect installed dependencies and conventions before adding packages.
9. Build and test after each phase; report actual results, not assumptions.
10. Do not push to git and github; stay strictly local.

## Design direction
Aim for a refined, premium technical operations product: confident, precise, calm, distinctive, information-dense but never cramped. Avoid generic SaaS-template aesthetics, excessive glassmorphism, neon borders, giant gradients on every card, pointless animations, and nested-card overload.

Start from the existing dark theme and refine it into a coherent system:
- Deep ink/graphite surfaces with restrained blue/neutral undertones.
- One primary accent and a small, consistent semantic palette.
- Strong typography hierarchy, generous but efficient spacing, fine separators, deliberate surface contrast.
- One consistent icon family, button scale, radius scale, form system, chart language, and focus treatment.
- Use gradients, texture, glows, and motion selectively.
- Respect prefers-reduced-motion; avoid perpetual pulses or fake activity.
- Prioritize legibility, accessible contrast, fast interaction, and honest system states.

Design tokens:
- Background: #080b12 (deep rich cosmic ink)
- Surfaces: #0d121c / #111927 / #172133 (subtle, dimensional surface elevation)
- Borders: #1e293b / #182234 / subtle 1px crisp separators
- Primary text: #f3f6fc (crisp, high contrast)
- Secondary text: #a2aec2 (clear, legible muted hierarchy)
- Accent: #8daaff / #3b82f6 (deliberate technical blue/indigo glow)
- Semantic states: success #49d6a0, warning #f4bd68, danger #ff777f, info #38bdf8

## Recommended execution order
1. Phase 0 — Reconnaissance and safety baseline
2. Phase 1 — Reference study and visual concept
3. Phase 2 — Shared design system & design tokens
4. Phase 3 — Authentication UI (refined split layout, responsive, auth states preserved)
5. Phase 4 — App shell and navigation (responsive sidebar, mobile drawer, layout rhythm)
6. Phase 5 — Dashboard operations cockpit (welcome, status, hierarchy, real telemetry)
7. Phase 6 — Extraction composer and actions (clean inputs, mode toggle, validation, states)
8. Phase 7 — Storage browser (breadcrumbs, nested folders, responsive cards, search, downloads)
9. Phase 8 — Analytics & charts (speed curves, hourly bandwidth, real metrics)
10. Phase 9 — Feedback & micro-interactions (toasts, modals, confirmations)
11. Phase 10 — Responsive implementation & verification
12. Phase 11 — Accessibility & performance
13. Phase 12 — Regression testing & production build verification
