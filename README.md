# InnovAgent (Agent ID: 27)

InnovAgent is a fully autonomous, verifiable crypto-trading agent built on the **ERC-8004 Protocol** for the LabLab.ai AI Trading Hackathon. It leverages high-performance LLMs via Groq to analyze market data from Kraken and PRISM, ensuring all trading intents are cryptographically signed and posted on-chain for total transparency.

### 📜 Protocol Integration (ERC-8004)
InnovAgent is a first-class citizen of the **ERC-8004 (Proof of Intent)** ecosystem on Sepolia:
*   **ValidationRegistry**: Every trade decision (Buy/Sell/Hold) is signed via **EIP-712** and posted as a permanent attestation. This ensures "Proof of Intelligence"—we don't just trade; we prove why we traded.
*   **ReputationRegistry**: The agent participates in peer-to-peer signaling, providing feedback to the global validator to maintain a high-trust network and a **95+ Validation Score**.
*   **On-Chain Verifiability**: Users can audit every AI reasoning log against the transaction hashes stored in the Validation Registry.

### ✨ Key Features
- **Smart Volatility Guard**: Automatically detects flat markets to skip redundant AI calls, preserving API quota while maintaining a consistent heartbeat on the leaderboard.
- **Explainable AI (XAI)**: No "blackbox" trading. Every action includes a natural language reason derived from real-time RSI, trend, and volatility signals.
- **Institutional Risk Guardrails**:
    - **$200 Trade Cap**: Hard limit on per-trade volume.
    - **$500 Daily Loss Limit**: Automated circuit breaker to prevent liquidation.
    - **Consecutive Loss Pause**: Automatic system halt after 3 failed trades for manual review.

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
