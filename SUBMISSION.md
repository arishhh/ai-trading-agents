# InnovAgent

**Short Description**:
An autonomous AI agent that performs risk-aware crypto trading on Kraken using real-time market sentiment and technical analysis. Built with a reactive backend for instant dashboard updates and low-latency Groq LLM reasoning.

**Long Description**:
InnovAgent is an end-to-end autonomous agent that manages a crypto portfolio with institutional-grade logic, acting as a Cross-Domain Oracle Agent. Its "Brain" operates on the Ethereum Sepolia network via the ERC-8004 standard, while its "Eyes" monitor the Bitcoin market off-chain. Every 10 minutes, the agent fetches live BTC/USD ticker data from Kraken and volatility signals from the PRISM API. This market context is processed by a Groq-powered 70B LLM, which generates a trade decision paired with a detailed "Internal Monologue".

The system is fully integrated on-chain: it registers on the `AgentRegistry`, automatically claims sandbox capital from the `HackathonVault`, and cryptographically signs every trade decision (EIP-712) before submitting it to the `RiskRouter` and `ValidationRegistry`. This guarantees that every AI decision is auditable, immutable, and verifiable on the Sepolia testnet. 

The agent's status can be tracked via our custom "Reactive First" Next.js dashboard powered by Convex, which displays real-time AI reasoning logs, an "On-Chain Pulse" with direct Etherscan links, and a live Heartbeat indicator. We are actively ranked on the lablab.ai x Surge leaderboard!

**Tech Tags**:
Node.js, TypeScript, Next.js, Groq, KrakenCLI, PRISM, Convex, Ethers.js, Sepolia, ERC-8004

**Links**:
*   **GitHub**: https://github.com/arishhh/ai-trading-agents
*   **Vercel (Live Demo)**: https://ai-trading-innovagent.vercel.app/
*   **Demo Video**: https://www.youtube.com/watch?v=1wMBDjxESQg
