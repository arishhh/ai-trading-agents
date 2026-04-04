FROM node:20-slim

RUN apt-get update && apt-get install -y curl wget tar && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN curl --proto '=https' --tlsv1.2 -LsSf https://github.com/krakenfx/kraken-cli/releases/latest/download/kraken-cli-installer.sh | sh

ENV PATH="/root/.cargo/bin:${PATH}"

RUN kraken --version

COPY package*.json ./
RUN npm ci

COPY . .

ARG CONVEX_DEPLOY_KEY
RUN npx convex deploy

CMD ["npx", "tsx", "agent/loop.ts"]