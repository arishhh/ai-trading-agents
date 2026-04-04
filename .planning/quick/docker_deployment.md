# Quick Task: Docker Deployment Migration

**ID:** docker_deployment
**Status:** [x] Completed
**Date:** 2026-04-03

## Description
Migrate Railway deployment from Nixpacks to a custom Dockerfile to ensure the Kraken CLI binary is correctly installed and available in the runtime environment.

## Actions
- [x] Create Dockerfile with LF line endings and Kraken installation.
- [x] Update gent/kraken.ts to use /root/.cargo/bin/kraken as the default path.
- [x] Delete 
ixpacks.toml to avoid build system conflicts.
- [x] Push to GitHub for Railway Docker deployment.
