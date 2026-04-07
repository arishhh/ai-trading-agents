# InnovAgent: System Documentation

## 1. Overview
InnovAgent is an autonomous trading system that bridges high-intelligence LLMs with real-time financial markets. It operates as a continuous loop, analyzing market sentiment and technical data to execute trades with institutional-grade risk management.

## 2. Technical Architecture

### 🧠 Core Logic
- **Brain**: Powered by Groq's `Llama-3.3-70b-versatile` LPU (Low Latency Processing Unit).
- **Inference**: Every cycle, the agent receives high-density market data and PRISM signals to generate a structured JSON trade decision.
- **Reasoning**: The AI maintains an "Internal Monologue," explaining the rationale behind every action (Buy/Sell/Hold).

### 📊 Data Pipeline
- **Kraken REST API**: Real-time ticker and technical OHLC data.
- **PRISM API**: Advanced volatility and RSI momentum indicators.
- **Mock Fallback**: Automatic failover to synthetic high-fidelity market data if DNS or network blocks occur, ensuring 100% uptime for demos.

### 🛡️ Risk, Safety & On-Chain Auditability
- **Circuit Breaker**: Automatic pause after 3 consecutive losses to prevent emotional or algorithmic spirals.
- **Hard Caps**: Maximum $200 per trade and fixed $500 daily loss limit (Resets at UTC Midnight via Convex state tracking).
- **ERC-8004 Validated**: Every action runs through the Sepolia testnet's `RiskRouter`, `HackathonVault`, and `ValidationRegistry`. 
- **Cryptographic Auditability**: Every trade intent is signed using EIP-712 (Ethereum) standards before execution, creating an immutable trail of AI accountability.

## 3. Frontend Dashboard (Next.js 14)
The InnovAgent Terminal provides a "Single Pane of Glass" view into the agent's operations:
- **Neural Reasoning Feed**: Watch the AI's internal monologue in real-time via Convex reactive pipes.
- **Live Performance Stats**: Instant P&L snapshots, win rates, and current portfolio value.
- **On-Chain Pulse Monitor**: Live feed of the agent's Sepolia configuration, heartbeat, and real-time transaction links for every EIP-712 trade proof.

## 4. Environment Configuration
The agent requires the following environment variables to be set:
- `GROQ_API_KEY`: API key for decision reasoning.
- `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL`: Backend endpoint for the dashboard.
- `PRISM_API_KEY`: (Optional) For advanced signal processing.
- `PAPER_MODE`: Set to `false` to enable live Sepolia on-chain trading.
- `LOOP_INTERVAL_MS`: Duration between trading cycles (Default: 10 mins).
- `AGENT_WALLET_KEY`: EVM private key for EIP-712 signing (**Must remain secret**).
- `RPC_URL`: Free public endpoint (e.g. `https://rpc.sepolia.org`) or Infura URL for blockchain connection.

## 5. Deployment Model
- **Agent Process**: Recommended for Railway (continuous Docker container).
- **Frontend**: Optimized for Vercel (Next.js SSR/ISR).
- **Database**: Convex provides real-time state synchronization between the agent and UI.
