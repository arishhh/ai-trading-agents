# Use a lightweight Node image
FROM node:20-slim

WORKDIR /app

# Standard system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install project dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Ensure Convex is deployed in production
ARG CONVEX_DEPLOY_KEY
RUN npx convex deploy

# Start the Trading Agent Loop
# (We no longer need the Kraken CLI binary!)
CMD ["npx", "tsx", "agent/loop.ts"]