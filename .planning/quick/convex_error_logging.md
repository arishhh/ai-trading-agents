# Quick Task: Convex Error Logging and Startup Robustness

**ID:** convex_error_logging
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Improve the agent's startup sequence and error handling. Specifically, wrap Convex mutations in try-catch blocks to prevent process crashes and log specific error messages from the Convex HTTP client.

## Actions
- [x] Wrap startup heartbeat mutation in try-catch.
- [x] Catch errors in the main loop interval to prevent the entire process from exiting.
- [x] Add helpful log messages for "Function not found" errors (common when functions aren't deployed).
- [x] Push to GitHub for Railway deployment.
