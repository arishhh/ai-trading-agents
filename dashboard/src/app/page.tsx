'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [typedText, setTypedText] = useState('');
  const fullText = "InnovAgent";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-[#00FF88] selection:text-black">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-[#00FF88] font-bold text-xl tracking-tighter">
            INNOVAGENT<span className="animate-pulse">_</span>
          </div>
          <div className="flex gap-8">
            <Link href="/dashboard" className="text-sm hover:text-[#00FF88] transition-colors">DASHBOARD</Link>
            <a href="https://github.com/arishhh/ai-trading-agents" target="_blank" className="text-sm hover:text-[#00FF88] transition-colors text-white/60">GITHUB</a>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center overflow-hidden">
        {/* Animated Background: Grid & Gradient */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FF88]/5 rounded-full blur-[120px] z-0"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
            {typedText}<span className="text-[#00FF88] animate-[blink_1s_infinite]">|</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-12">
            The first fully autonomous AI crypto trading agent with verifiable on-chain identity.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/dashboard" className="px-10 py-4 bg-[#00FF88] text-black font-bold rounded-sm hover:bg-[#00DD77] transition-all hover:scale-[1.02] active:scale-[0.98]">
              VIEW LIVE DASHBOARD
            </Link>
            <a href="https://github.com/arishhh/ai-trading-agents" target="_blank" className="px-10 py-4 border border-white/20 text-white font-bold rounded-sm hover:bg-white/5 transition-all">
              VIEW ON GITHUB
            </a>
          </div>
        </div>

        {/* Ticker at Bottom */}
        <div className="absolute bottom-0 w-full overflow-hidden border-t border-white/5 bg-black py-4 font-mono">
          <div className="flex whitespace-nowrap animate-[ticker_30s_linear_infinite]">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-xs uppercase tracking-widest text-white/40 mr-12 shrink-0">
                BTC/USD <span className="text-white">$68,420</span> <span className="text-white/20">HOLD</span> <span className="text-[#00FF88]">80% CONFIDENCE</span> | 
                BTC/USD <span className="text-white">$68,891</span> <span className="text-[#00FF88]">BUY</span> <span className="text-[#00FF88]">85% CONFIDENCE</span> | 
                BTC/USD <span className="text-white">$69,103</span> <span className="text-white/20">HOLD</span> <span className="text-[#00FF88]">72% CONFIDENCE</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: LIVE STATS */}
      <section className="bg-black py-20 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Approved Trades", val: "80+" },
            { label: "Autonomous Operation", val: "24/7" },
            { label: "Decision Cycle", val: "10 min" },
            { label: "Leaderboard Rank", val: "#27" }
          ].map((stat, i) => (
            <div key={i} className="border border-white/5 bg-white/[0.02] p-8 text-center rounded-sm group hover:border-[#00FF88]/30 transition-colors">
              <div className="text-4xl md:text-5xl font-black text-[#00FF88] mb-2">{stat.val}</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="bg-black py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl font-black mb-4">THE INNOVAGENT BRAIN</h2>
          <div className="w-20 h-1 bg-[#00FF88] mx-auto"></div>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          {/* Market Intake */}
          <div className="text-center group p-8 bg-white/[0.01] border border-white/5 hover:-translate-y-2 transition-transform h-full flex flex-col items-center">
            <div className="w-16 h-16 border-2 border-[#00FF88] rounded-full flex items-center justify-center mb-8">
              <div className="flex items-end gap-1">
                <div className="w-1 h-3 bg-[#00FF88]"></div>
                <div className="w-1 h-6 bg-[#00FF88]"></div>
                <div className="w-1 h-4 bg-[#00FF88]"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">Market Intake</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Every 10 minutes InnovAgent fetches live BTC price and OHLC candle data from Kraken CLI and RSI volatility signals from PRISM API.
            </p>
          </div>
          {/* Neural Decision */}
          <div className="text-center group p-8 bg-white/[0.01] border border-white/5 hover:-translate-y-2 transition-transform h-full flex flex-col items-center">
            <div className="w-16 h-16 border-2 border-[#7C3AED] rounded-full flex items-center justify-center mb-8">
              <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-[#7C3AED] animate-spin-slow flex items-center justify-center">
                <div className="w-2 h-2 bg-[#7C3AED] rounded-full"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">Neural Decision</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Groq&apos;s 70B parameter AI model analyzes the full market context and generates a buy sell or hold decision with complete reasoning in plain English.
            </p>
          </div>
          {/* On-Chain Proof */}
          <div className="text-center group p-8 bg-white/[0.01] border border-white/5 hover:-translate-y-2 transition-transform h-full flex flex-col items-center">
            <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center mb-8">
              <div className="w-6 h-6 border-2 border-white/30 rotate-45 flex items-center justify-center">
                <div className="w-3 h-3 border border-white/30"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">On-Chain Proof</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Every decision is cryptographically signed with EIP-712 and posted to the Sepolia blockchain as a verifiable attestation via ERC-8004.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: LIVE REASONING FEED */}
      <section className="bg-[#050505] py-32 px-6">
        <div className="max-w-7xl mx-auto mb-20">
          <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Neural Reasoning Stream</h2>
          <p className="text-[#00FF88] text-xs uppercase tracking-[0.3em] font-bold">Every decision explained. Zero black box.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          {[
            { action: "HOLD", color: "white/20", price: "68,420.50", conf: "72%", reason: "RSI at 58, within acceptable range. Only 8 of last 20 candles closed green. Insufficient trend confirmation for entry.", hash: "0x7f3a...9b2c", time: "2 mins ago" },
            { action: "BUY", color: "#00FF88", price: "67,891.20", conf: "87%", reason: "Neural Sync triggered after 30 minute idle period. RSI stabilizing at 52. 12 of 20 candles bullish. Strong uptrend confirmation. Entering $950 position.", hash: "0x4e8b...3d71", time: "18 mins ago" },
            { action: "HOLD", color: "white/20", price: "68,103.70", conf: "65%", reason: "Position already open at $67,891. Current PnL +0.31%. Monitoring for take profit at +0.5% or stop loss at -1.0%.", hash: "0x9c2f...8a14", time: "24 mins ago" },
            { action: "SELL", color: "#FF4444", price: "68,230.10", conf: "91%", reason: "Take profit target reached. Position opened at $67,891 now at +0.5% gain. Executing sell. Realized PnL: +$4.75", hash: "0x1d5e...6f39", time: "31 mins ago" }
          ].map((card, i) => (
            <div key={i} className="bg-black border border-white/10 p-6 rounded-sm relative overflow-hidden group hover:border-[#00FF88]/40 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <span className={`px-2 py-1 text-[10px] font-bold tracking-tighter rounded-xs`} style={{ backgroundColor: card.color === "white/20" ? "#222" : card.color, color: card.color === "white/20" ? "white" : "black" }}>{card.action}</span>
                  <span className="text-lg font-bold">${card.price}</span>
                </div>
                <span className="text-[10px] text-white/30 uppercase">{card.time}</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6 font-mono h-20 line-clamp-4">
                {card.reason}
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-white/30">
                  <span>CONFIDENCE</span>
                  <span className="text-[#00FF88]">{card.conf}</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#00FF88] h-full" style={{ width: card.conf }}></div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 truncate uppercase">
                <span>ON-CHAIN: <span className="text-white/60">{card.hash}</span></span>
                <span className="text-[#7C3AED] hover:underline cursor-pointer">Verify →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: TECH STACK */}
      <section className="bg-black py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-3xl font-black mb-12">BUILT WITH</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Kraken CLI", "PRISM API", "Groq 70B", "Convex", "Next.js 14", "Railway", "Vercel", "Ethers.js", "ERC-8004", "EIP-712", "Sepolia Testnet", "TypeScript"].map((tech, i) => (
              <div key={i} className="px-6 py-2 border border-white/10 rounded-full flex items-center gap-3 hover:border-[#00FF88] transition-colors cursor-default bg-white/[0.02]">
                <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-[#00FF88]' : 'bg-[#7C3AED]'}`}></div>
                <span className="text-sm font-bold opacity-80">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: RISK MANAGEMENT */}
      <section className="bg-black py-32 px-6">
        <div className="max-w-4xl mx-auto border-2 border-[#00FF88]/20 bg-white/[0.01] p-10 relative">
          <div className="absolute top-0 right-0 p-4 font-bold text-[10px] text-[#00FF88]/40 uppercase tracking-widest">System_Shield_v2.0</div>
          <h2 className="text-3xl font-black mb-12 uppercase tracking-tighter">Institutional Grade Risk Controls</h2>
          <div className="grid gap-6">
            {[
              "$950 maximum position size per trade",
              "$500 daily loss limit with automatic shutdown",
              "Circuit breaker pauses after 3 consecutive losses",
              "60 minute time exit prevents dead positions",
              "Neural Sync forces AI review every 30 minutes"
            ].map((rule, i) => (
              <div key={i} className="flex gap-4 items-center">
                <span className="text-[#00FF88] font-bold">✓</span>
                <span className="text-white/70 text-sm tracking-wide">{rule}</span>
              </div>
            ))}
          </div>
          <p className="mt-12 text-[10px] text-white/30 uppercase border-t border-white/5 pt-6">
            All risk logic runs client-side before any on-chain submission
          </p>
        </div>
      </section>

      {/* SECTION 7: ON-CHAIN IDENTITY */}
      <section className="bg-black py-32 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-black mb-8 uppercase tracking-tighter leading-none">Verifiable On-Chain Identity</h2>
            <p className="text-white/50 text-base leading-relaxed mb-10">
              InnovAgent is registered on the ERC-8004 Identity Registry as Agent #27. Every trade intent is signed with EIP-712 typed data signatures, creating an immutable audit trail of every autonomous decision.
            </p>
            <a href="https://sepolia.etherscan.io/address/0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1" target="_blank" className="text-[#00FF88] border-b border-[#00FF88] pb-1 hover:text-[#00DD77] transition-colors font-bold uppercase tracking-widest text-sm">Verify on Etherscan →</a>
          </div>
          <div className="bg-white/[0.01] border border-white/10 p-8 rounded-sm font-mono text-sm leading-loose">
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-white/40">AGENT_ID</span>
              <span className="text-[#00FF88]">#27</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-white/40">NETWORK</span>
              <span className="text-white/80">SEPOLIA TESTNET</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-white/40">REGISTRY</span>
              <span className="text-white/80">AGENTREGISTRY</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-white/40">OPERATOR</span>
              <span className="text-[#7C3AED]">0xCAdF...159b</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">STATUS</span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"></span>
                <span className="text-[#00FF88]">ACTIVE</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: TEAM */}
      <section className="bg-black py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Built By</h2>
          <p className="text-white/30 text-sm mt-2">Built in 10 days for the lablab.ai AI Trading Agents Hackathon 2026</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            { name: "Arish Ali", role: "Lead Developer, Innovator", initial: "AA" },
            { name: "M. Saim Raza", role: "Team Member", initial: "SR" },
            { name: "Sanjay Andani", role: "Team Member", initial: "SA" }
          ].map((member, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black text-[#00FF88] mb-6">
                {member.initial}
              </div>
              <h3 className="text-lg font-bold">{member.name}</h3>
              <p className="text-white/40 text-xs text-center mt-2">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: FOOTER */}
      <footer className="bg-black pt-32 pb-10 px-6 border-t border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00FF88]/30"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div>
            <div className="text-3xl font-black tracking-tighter text-[#00FF88] mb-4">INNOVAGENT<span className="animate-pulse">_</span></div>
            <div className="flex gap-8 text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              <a href="https://github.com/arishhh/ai-trading-agents" className="hover:text-[#00FF88] transition-colors">GITHUB</a>
              <Link href="/dashboard" className="hover:text-[#00FF88] transition-colors text-white">LIVE DASHBOARD</Link>
              <a href="https://sepolia.etherscan.io/address/0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1" className="hover:text-[#00FF88] transition-colors">ETHERSCAN</a>
            </div>
          </div>
          <div className="text-white/20 text-[10px] uppercase font-bold tracking-widest">
            Built for lablab.ai x Surge Hackathon 2026
          </div>
        </div>
      </footer>

    </div>
  );
}
