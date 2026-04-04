# InnovAgent

InnovAgent is a fully autonomous crypto-trading agent designed for high-frequency market analysis and risk-aware execution. It leverages the ultra-low latency of Groq's LLMs to analyze Kraken market data, PRISM sentiment signals, and historical trends to make 24/7 trading decisions. With a reactive Convex backend and a premium Next.js dashboard, users can monitor every trade, AI reasoning log, and portfolio metric in real-time.

### 🌐 Live Dashboard
[Your Vercel URL Here]

### 🛠️ Tech Stack
*   **Core**: Node.js, TypeScript
*   **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons
*   **AI Brain**: Groq (Llama-3.3-70b-versatile)
*   **Data API**: Kraken REST API, PRISM API
*   **Backend & DB**: Convex (Reactive Real-time)
*   **Deployment**: Railway (Agent Loop), Vercel (Dashboard)

### 🚀 Local Setup
1.  **Clone the repo**: `git clone ...`
2.  **Install dependencies**: `npm install`
3.  **Setup Env**: Copy `.env.example` to `.env` and fill in your keys (see below).
4.  **Run Agent**: `npm run agent`
5.  **Run Dashboard**: `npm run dev` (from root)

### 🔑 Environment Variables
| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | Your Groq API key for the AI decision brain. |
| `CONVEX_URL` | Your Convex deployment URL. |
| `NEXT_PUBLIC_CONVEX_URL` | Same as above, for the dashboard. |
| `PRISM_API_KEY` | (Optional) API key for PRISM market signals. |
| `PAPER_MODE` | Set to `true` to use the local paper trading simulator. |
| `LOOP_INTERVAL_MS` | Trading cycle duration (Default: 600000 / 10 min). |
