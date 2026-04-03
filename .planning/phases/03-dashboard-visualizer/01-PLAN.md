---
wave: 1
depends_on: Phase 1 & 2
files_modified:
  - dashboard/package.json
  - dashboard/app/layout.tsx
  - dashboard/app/page.tsx
  - dashboard/components/ConvexClientProvider.tsx
autonomous: true
---

# Phase 3: Dashboard Visualizer Plan

## Objective
Build a Next.js 14 dashboard using `convex/react` to interface with the KrakenAI backend running on Railway. Implement the "Obsidian Lens" design system outlined in `03-UI-SPEC.md`.

## Tasks

<task>
<description>Install dependencies (Convex, Lucide React)</description>
<read_first>
- dashboard/package.json
</read_first>
<action>
Navigate into `/dashboard` and run `npm install convex lucide-react`. Then run `npx convex dev` or copy `.env` from root to connect to existing convex instance.
</action>
<acceptance_criteria>
- `package.json` contains `convex` and `lucide-react`.
</acceptance_criteria>
</task>

<task>
<description>Create ConvexClientProvider</description>
<read_first>
- dashboard/app/layout.tsx
</read_first>
<action>
Create `dashboard/components/ConvexClientProvider.tsx` containing standard 'use client' ConvexProvider wrapper. Import it into `dashboard/app/layout.tsx` to wrap `{children}`.
</action>
<acceptance_criteria>
- `ConvexClientProvider.tsx` exports a valid React provider component.
- `layout.tsx` imports and uses the provider.
</acceptance_criteria>
</task>

<task>
<description>Implement Dashboard UI with Glassmorphism</description>
<read_first>
- dashboard/app/page.tsx
- .planning/phases/03-dashboard-visualizer/03-UI-SPEC.md
</read_first>
<action>
Overwrite `dashboard/app/page.tsx` with a dark theme (#0e0e0f) Tailwind layout. Add:
1. Portfolio Top Panel: Neon Green metrics ($ PnL).
2. Live Decision Feed: Frost glass cards `bg-[#131314]/80 backdrop-blur` showing convex decisions using `useQuery(api.decisions.getRecentByTime)`. Wait, we should use strings `"decisions:getRecentByTime"` or import `anyApi` inside the frontend to avoid missing generated modules if they don't compile. Actually, since this is local frontend, we can copy the convex backend from root or use standard string queries.
</action>
<acceptance_criteria>
- `page.tsx` renders real-time decisions from Convex.
</acceptance_criteria>
</task>

## Verification
1. Run `cd dashboard && npm run dev`.
2. Ensure no hydration or typing errors.
3. Validate Glassmorphic neon green aesthetic matches `03-UI-SPEC.md`. 
