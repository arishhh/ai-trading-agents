# Context: Phase 3 - Dashboard Visualizer

## Goal
Build a high-fidelity, real-time terminal dashboard to monitor the AI agent's performance and control its state.

## Requirements
- [DASH-01]: Real-time update of PnL and trade feed using `useQuery` from Convex.
- [DASH-02]: Dark terminal aesthetic with monospace typography and shadcn/ui.
- [DASH-03]: Interactive pause/resume controls that update the Convex `state` table.

## Implementation Details
1. **Next.js 14**: Initialize the dashboard using `create-next-app` with Tailwind and TypeScript.
2. **Convex Client**: Setup the Convex provider and `useQuery`/`useMutation` hooks.
3. **UI Components**: Use `shadcn/ui` for terminal-style cards, tables, and buttons.
4. **Layout**: A single-page dashboard with a PnL chart, recent trades table, AI reasoning log, and control panel.

## Verification Plan
- Verify real-time updates when the agent runs a cycle.
- Verify pause/resume buttons correctly update the agent's behavior.
