# Quick Task: Update Groq Model Name

**ID:** groq_model_update
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
The Groq API model llama-3.1-70b-versatile was recently decommissioned and returning 400 Bad Request errors. This task updates the model to the latest supported llama-3.3-70b-versatile.

## Actions
- [x] Update model: 'llama-3.1-70b-versatile' to model: 'llama-3.3-70b-versatile' inside gent/claude.ts.
- [x] Push to GitHub to trigger Railway redeployment.
