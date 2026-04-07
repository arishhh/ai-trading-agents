# Quick Task: Fix Vercel Build Errors

The build on Vercel was failing due to unescaped quotes in `dashboard/src/app/page.tsx`, which triggered the `react/no-unescaped-entities` ESLint error.

## Steps
- [x] Identify build error in `dashboard` via `npm run build`
- [x] Fix unescaped entities in `dashboard/src/app/page.tsx`
- [x] Verify fix with `npm run lint`
- [x] Verify fix with `npm run build`
- [x] Confirm logs are accessible via query names: both `getRecent` and `getLatestTrades` are exported in `convex/decisions.ts`.

## Outcome
The build now succeeds locally, and pushing these changes should resolve the Vercel deployment error.
The "logs aren't loading" issue was most likely caused by the failed build preventing the updated dashboard (with the new decision stream) from being deployed.
