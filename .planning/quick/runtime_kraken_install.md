# Quick Task: Runtime Kraken CLI Installation

**ID:** runtime_kraken_install
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Move Kraken CLI installation from the build phase to the runtime phase using a startup script (start.sh) to ensure the binary is available in the persistent runtime environment.

## Actions
- [x] Create start.sh to install Kraken and source .cargo/bin at startup.
- [x] Update 
ixpacks.toml to execute ash start.sh on startup and set permissions.
- [x] Update package.json to remove build-time Kraken setup and align gent script.
- [x] Push to GitHub for Railway deployment.
