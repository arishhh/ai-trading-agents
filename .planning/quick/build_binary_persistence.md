# Quick Task: Build-Phase Binary Persistence

**ID:** build_binary_persistence
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Ensure the Kraken CLI binary is persisted from build to runtime by downloading and extracting it to a persistent directory (/app/bin/) during the Nixpacks build phase.

## Actions
- [x] Update 
ixpacks.toml to download and extract Kraken CLI to /app/bin/ during build.
- [x] Update gent/kraken.ts to use /app/bin/kraken as the default path.
- [x] Update package.json to revert to 	sx for the agent script.
- [x] Delete start.sh (obsolete runtime installation script).
- [x] Push to GitHub for Railway deployment.
