# InnovAgent (Agent ID: 27)

InnovAgent is a fully autonomous, verifiable crypto-trading agent built on the **ERC-8004 Protocol** for the LabLab.ai AI Trading Hackathon. It leverages high-performance LLMs via Groq to analyze market data from Kraken and PRISM, ensuring all trading intents are cryptographically signed and posted on-chain for total transparency.

### 📜 Protocol Integration (ERC-8004)
InnovAgent is a first-class citizen of the **ERC-8004 (Proof of Intent)** ecosystem on Sepolia:
*   **ValidationRegistry**: Every trade intent (Buy/Sell/Hold) is signed via **EIP-712** and submitted to the RiskRouter. The official **Judge Bot** validates these intents on-chain to provide an objective "Proof of Intelligence" score.
*   **ReputationRegistry**: The agent manages a high-trust profile by delivering consistent positive PnL and accurate market reasoning, allowing the Judge Bot to assign a **95+ Reputation Score**.
*   **On-Chain Verifiability**: Users and judges can audit every trade intent against the cryptographic hashes stored in the Validation Registry.

### ✨ Key Features
- **Judge-Bot Resilience**: First-in-class dynamic pricing fallback. If the Kraken API is delayed, the agent automatically pivots to the "Last Known Price" cached in Convex, preventing "hallucinated" data from triggering Judge-Bot penalties.
- **Institutional Risk Guardrails**:
    - **$21,000 Trade Cap**: Optimized for high-stakes leaderboard position sizing.
    - **$2,000 Daily Loss Limit**: Professional drawdown management for sustained uptime.
    - **Consecutive Loss Pause**: Automatic circuit breaker after 3 straight losses.

### 🌐 Live Dashboard
https://ai-trading-innovagent.vercel.app/

### 🛠️ Tech Stack
*   **Protocol**: ERC-8004 (Validation & Reputation Registries)
*   **AI Brain**: Groq (Llama-3.3-70b)
*   **Connectivity**: Ethers.js (EIP-712 Signatures), Kraken CLI Binary
*   **Market Data**: Kraken REST API, PRISM Sentiment API
*   **Backend**: Convex (Reactive Real-time Database)
*   **Deployment**: Railway (Agent Loop), Vercel (Next.js Dashboard)

### 🚀 Local Setup
1.  **Clone the repo**: `git clone ...`
2.  **Install dependencies**: `npm install`
3.  **Setup Env**: Copy `.env.example` to `.env` and fill in your keys.
4.  **Run Agent**: `npm run agent`
5.  **Run Dashboard**: `npm run dev`

### 🔑 Environment Variables
| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | Your Groq API key for the AI decision brain. |
| `CONVEX_URL` | Your Convex deployment URL for real-time state. |
| `AGENT_WALLET_KEY`| Your EVM wallet private key for EIP-712 signing. |
| `RPC_URL` | Sepolia RPC node (e.g. Alchemy, Infura, or public). |
| `LOOP_INTERVAL_MS`| Trading cycle duration (Default: 600000 / 10 min). |
| `PAPER_MODE` | Set to `false` to enable live on-chain interactions. |
