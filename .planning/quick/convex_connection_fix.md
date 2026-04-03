# Quick Task: Fix Convex Connection Issues

**ID:** convex_connection_fix
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Fix Convex connection and "Function not found" / "Startup heartbeat failed" errors on Railway.

## Actions
- [x] Update gent/loop.ts to automatically strip trailing slashes from CONVEX_URL.
- [x] Replace pi import from ../convex/_generated/api with nyApi from convex/server to prevent runtime path resolution errors on Railway when the generated folder is not present.
- [x] Push to GitHub for Railway deployment.
