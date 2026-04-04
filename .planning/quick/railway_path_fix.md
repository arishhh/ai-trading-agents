# Quick Task: Railway Path and Environment Fix

**ID:** railway_path_fix
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Resolve issues where the Kraken binary was not found in the runtime PATH and ensure the Cargo environment is sourced for build and start phases on Railway.

## Actions
- [x] Update gent/kraken.ts to use explicit binary path.
- [x] Update 
ixpacks.toml to source .cargo/env in build and start commands.
- [x] Add 
pm ci to build phase.
- [x] Push to GitHub for Railway deployment.
