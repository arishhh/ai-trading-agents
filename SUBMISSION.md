# InnovAgent

**Short Description**:
An autonomous AI agent that performs risk-aware crypto trading on Kraken using real-time market sentiment and technical analysis. Built with a reactive backend for instant dashboard updates and low-latency Groq LLM reasoning.

**Long Description**:
InnovAgent is an end-to-end autonomous agent that manages a crypto portfolio with institutional-grade logic. Every 10 minutes, the agent fetches live BTC/USD ticker and OHLC data from Kraken, along with RSI and volatility signals from the PRISM API. This high-density market context is processed by a Groq-powered 70B LLM brain, which generates a trade decision paired with a detailed "Internal Monologue" reasoning log.

The system is built on a "Reactive First" architecture. Using Convex, the agent's decisions are instantly pushed to a premium Next.js dashboard, allowing users to watch the AI's "thought process" in real-time without refreshing. The agent operates as a continuous background loop, making it a true 24/7 financial function that handles data ingestion, analysis, and execution autonomously.

Safety is at the core of the design. The agent features a multi-layered risk management approach, including a built-in "Circuit Breaker" to pause trading after consecutive losses, a $200 per-trade hard cap, and a local Paper Trading simulator that allows for live-market strategy testing without risking real capital.

**Tech Tags**:
Node.js, TypeScript, Next.js, Groq, KrakenCLI, PRISM, Convex, Railway, Vercel

**Links**:
*   **GitHub**: https://github.com/arishhh/ai-trading-agents
*   **Vercel (Live Demo)**: https://ai-trading-innovagent.vercel.app/
*   **Demo Video**: https://www.youtube.com/watch?v=1wMBDjxESQg
