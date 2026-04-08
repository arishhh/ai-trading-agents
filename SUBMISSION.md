# InnovAgent

**Short Description**: An autonomous AI agent that performs risk-aware crypto
trading on Kraken using real-time market sentiment and technical analysis. Built
with a reactive backend for instant dashboard updates and low-latency Groq LLM
reasoning.

**Long Description**: InnovAgent is an end-to-end autonomous agent that manages
a crypto portfolio with institutional-grade scaling ($20,000 trade sizing), acting as a Cross-Domain
Oracle Agent. Its "Brain" operates on the Ethereum Sepolia network via the
ERC-8004 standard, while its "Eyes" monitor the Bitcoin market off-chain. Every
10 minutes, the agent fetches live BTC/USD ticker data from Kraken and
volatility signals from the PRISM API.

InnovAgent is built for real-world resilience: it features a unique **Judge-Bot 
Resilience Engine** that catches API timeouts and automatically pivots to 
the "Last Known Price" cached in its Convex backend. This prevents the 
"hallucinated data penalties" common in AI agents, ensuring its on-chain 
reputation and validation scores remain pristine.

The system is fully integrated on-chain: it registers on the `AgentRegistry` and
automatically claims sandbox capital from the `HackathonVault`. It features a
custom blockchain event-recovery engine that parses raw `AgentRegistered` logs
directly in Javascript to bypass RPC block iteration limits and contract typing
mismatches. Furthermore, it cryptographically signs every trade intent (EIP-712) 
with its logic and reasoning. This ensures that every AI decision is auditable, 
immutable, and verifiable by the official Judge Bot on the Sepolia testnet.

The agent's status can be tracked via our custom "Reactive First" Next.js
dashboard powered by Convex, which displays real-time AI reasoning logs, an
"On-Chain Pulse" with direct Etherscan links, and a live Heartbeat indicator. We
are actively ranked on the lablab.ai x Surge leaderboard with live Judge Bot 
validations scoring our performance!

**Tech Tags**: Node.js, TypeScript, Next.js, Groq, KrakenCLI, PRISM, Convex,
Ethers.js, Sepolia, ERC-8004

**Links**:

- **GitHub**: https://github.com/arishhh/ai-trading-agents
- **Vercel (Live Demo)**: https://ai-trading-innovagent.vercel.app/
- **Demo Video**: https://www.youtube.com/watch?v=FirEF_Kf9xI
