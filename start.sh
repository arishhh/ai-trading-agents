#!/bin/bash
echo "Installing Kraken CLI..."
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/krakenfx/kraken-cli/releases/latest/download/kraken-cli-installer.sh | sh
export PATH="$HOME/.cargo/bin:$PATH"
echo "Kraken installed at: $(which kraken)"
echo "Starting agent..."
npx tsx agent/loop.ts
