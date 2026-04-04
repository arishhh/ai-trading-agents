# Quick Task: Railway Binary Persistence Fix

**ID:** railway_binary_persistence
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Ensure the Kraken binary persists from the build phase to the runtime environment on Railway by installing it to /usr/local/bin instead of /root/.cargo/bin.

## Actions
- [x] Update package.json setup:kraken script to copy binary to /usr/local/bin.
- [x] Update gent/kraken.ts to use /usr/local/bin/kraken as the default path.
- [x] Update 
ixpacks.toml to handle binary installation during the build phase.
- [x] Push to GitHub for Railway deployment.
