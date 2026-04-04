# KrakenAI: Autonomous Trading Intelligence
## System Overview & Technical Documentation

KrakenAI is a fully autonomous crypto-trading system designed for high-frequency market analysis and risk-aware execution. It combines cutting-edge LLM reasoning (via Groq) with a reactive backend (Convex) and a premium real-time dashboard (Next.js).

---

## 🧠 1. The Trading Agent (The Brain)
The Agent is the core logic engine that runs in a continuous loop, analyzing the market and making decisions every 5 minutes.

### How it Works:
1.  **Data Ingestion**: The agent fetches the latest BTC/USD ticker price and the last 10 hourly candles (OHLC) from the Kraken REST API.
2.  **Trend Analysis**: It calculates simple price action trends. If the last 6 out of 10 candles are bullish, it signals a potential BUY.
3.  **AI Reasoning**: The agent passes the raw market data to **Groq (llama-3.1-8b-instant)**. The AI analyzes the volatility, trend strength, and confidence levels to provide a final decision: **BUY**, **SELL**, or **HOLD**.
4.  **Paper Execution**: In `PAPER_MODE`, the agent simulates trades using a local `paper-state.json` file. It tracks your starting balance ($10,000), current holdings, and total trade count without risking real capital.
5.  **Reactive Logging**: Every decision, including the AI's "Internal Monologue" (reasoning), is pushed to the Convex backend in real-time.

---

## 🖥️ 2. The Frontend Dashboard
The dashboard provides a "Mission Control" view of the agent's performance and current state.

### Key Features:
*   **System Status Toggle**: A large, interactive button to **PAUSE** or **RESUME** the agent remotely. This state is synced across the system via Convex.
*   **Live Metrics Panel**:
    *   **Portfolio PnL**: Real-time tracking of simulated profits or losses.
    *   **Current BTC Price**: Live feed of the asset price currently being traded.
    *   **Win Rate (Recent)**: Calculates the percentage of profitable cycles based on recent history.
*   **Autonomous Reasoning Log**: A high-fidelity feed of the agent's latest actions. Each entry includes:
    *   **Action Taken**: (Buy/Sell/Hold/Error) with color-coded status indicators.
    *   **Execution Price**: The exact price at which the action was logged.
    *   **Reasoning**: The detailed "Internal Monologue" explaining *why* the AI made that specific choice.
    *   **Confidence level**: A percentage showing how sure the AI was about its decision.
    *   **Timestamp**: Precise logging of when the cycle occurred.

---

## ⚙️ 3. Tech Stack & Architecture

### Backend: Convex
*   **Real-time Synchronization**: Uses WebSocket connections to push agent decisions to the dashboard instantly without page refreshes.
*   **State Management**: Stores the "Paused" state and trade history in a serverless database.

### Frontend: Next.js 14 (App Router)
*   **Tailwind CSS & Lucide Icons**: A sleek, terminal-native dark mode UI designed for a premium "trader" look.
*   **Client-side Mutations**: Directly interacts with Convex to control the agent loop.

### AI Engine: Groq SDK
*   **Ultra-Low Latency**: Uses Groq's LPU inference to get trading decisions in milliseconds.
*   **resiliency**: Implements exponential backoff to handle rate limits and service interruptions gracefully.

---

## 🛠️ 4. User Interaction
The user interacts with the system in three primary ways:

1.  **Observation**: Watching the *Reasoning Log* to understand the AI's market outlook in real-time.
2.  **Intervention**: Using the *Pause/Resume* button if market conditions become too volatile or if the strategy needs adjustment.
3.  **Configuration**: Modifying the `.env` file to change the `LOOP_INTERVAL_MS` (cycle speed) or toggle `PAPER_MODE`.

---

## 🚀 5. Deployment & Scalability
*   **Local Dev**: Runs using `npm run dev` (Concurrent mode for Agent + Dashboard).
*   **Production**: Designed to be deployed on **Railway** (Agent) and **Vercel** (Dashboard), communicating through the shared **Convex** cloud instance.
