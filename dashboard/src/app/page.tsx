"use client";

import { useQuery, useMutation } from "convex/react";
import { Play, Pause, Activity, TrendingUp, TrendingDown, Clock, ShieldAlert, Wallet, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import KrakenChart from "@/components/KrakenChart";
import PerformanceStats from "@/components/PerformanceStats";
import EquityChart from "@/components/EquityChart";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const trades = useQuery("decisions:getLatestTrades" as any, { count: 30 });
  const pausedState = useQuery("state:getValue" as any, { key: "paused" });
  const todayLossesState = useQuery("state:getValue" as any, { key: "todayLosses" });
  const agentIdState = useQuery("state:getValue" as any, { key: "erc8004AgentId" });
  const setPausedStatus = useMutation("state:upsertValue" as any);

  const togglePause = async () => {
    const isPaused = pausedState?.value === true;
    await setPausedStatus({ key: "paused", value: !isPaused });
  };

  const isPaused = pausedState?.value === true;
  const latestTrade = trades && trades.length > 0 ? trades[0] : null;
  const todayLosses = todayLossesState?.value || 0;
  const agentId = agentIdState?.value;

  // Basic stats
  const currentPrice = latestTrade?.price || 0;
  const unrealizedPnL = latestTrade?.pnlSnapshot || 0;
  
  // Starting balance matching the 100k ERC-8004 HackathonVault allocation
  const startingBalance = 100000;
  const totalEquity = latestTrade?.totalEquity || (100000 + unrealizedPnL);
  
  // Display PnL is absolute relative to the $100k start. 
  // Force to exactly 0 in neutral state to avoid math ghosts.
  const displayPnL = unrealizedPnL === 0 ? 0 : totalEquity - startingBalance;
  
  const winCount = trades ? trades.filter((t: any) => t.pnlSnapshot > 0).length : 0;
  const winRate = trades && trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  const [timeLeft, setTimeLeft] = useState<string>("06:00");
  const intervalMs = 360000; // 6 minutes matches new 10 trades/hr rule

  useEffect(() => {
    if (!latestTrade) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const lastTradeTime = latestTrade.timestamp;
      const nextTradeTime = lastTradeTime + intervalMs;
      const remaining = nextTradeTime - now;

      if (remaining <= 0) {
        setTimeLeft("00:00");
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [latestTrade]);

  const [showChart, setShowChart] = useState(true);

  const heartbeatState = useQuery("state:getValue" as any, { key: "heartbeat" });
  const heartbeat = heartbeatState?.value || 0;

  const getHeartbeatStatus = () => {
    if (!heartbeat) return { label: "OFFLINE", color: "text-red-500", dot: "bg-red-500" };
    const diff = (Date.now() - heartbeat) / 60000;
    if (diff < 15) return { label: "LIVE", color: "text-[#00FF41]", dot: "bg-[#00FF41]" };
    if (diff < 30) return { label: "DELAYED", color: "text-yellow-500", dot: "bg-yellow-500" };
    return { label: "OFFLINE", color: "text-red-500", dot: "bg-red-500" };
  };
  const status = getHeartbeatStatus();

  if (!mounted) return null;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 font-sans bg-[#0a0a0a] min-h-screen text-white">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 shrink-0 bg-[#131314] rounded-2xl border border-[#484849]/30 p-2 flex items-center justify-center overflow-hidden shadow-2xl shadow-[#00fc40]/5">
            <img 
              src="/itnnovator-logo.png" 
              alt="InnovAgent" 
              className="w-full h-full object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black font-[family-name:var(--font-space-grotesk)] tracking-tighter text-white mb-1 uppercase">
              InnovAgent<span className="text-[#00fc40]">.</span>Terminal
            </h1>
            <div className="flex flex-col md:flex-row gap-2 md:gap-6 mt-1">
              <p className="text-[#adaaab] font-medium flex items-center gap-2 text-xs tracking-widest uppercase">
                <Activity size={12} className={`${isPaused ? "text-[#ff7351]" : "text-[#00FF41] animate-pulse"}`} />
                Agent: 
                <span className={isPaused ? "text-[#ff7351]" : "text-[#00FF41]"}>
                  {isPaused ? "PAUSED" : "OPERATIONAL"}
                </span>
              </p>
              <p className="text-[#adaaab] font-medium flex items-center gap-2 text-xs tracking-widest uppercase">
                <div className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.label === 'LIVE' ? 'animate-pulse' : ''}`} />
                Heartbeat: 
                <span className={status.color}>
                  {status.label}
                </span>
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={togglePause}
          className={`px-8 py-3 rounded-xl font-black font-[family-name:var(--font-space-grotesk)] uppercase tracking-widest flex items-center gap-3 transition-all duration-500 scale-100 active:scale-95 ${
            isPaused 
              ? "bg-[#00fc40]/10 text-[#00fc40] border border-[#00fc40]/30 shadow-[0_0_20px_rgba(0,252,64,0.1)] hover:bg-[#00fc40]/20" 
              : "bg-[#b92902]/20 text-[#ff7351] border border-[#ff7351]/30 hover:bg-[#b92902]/40"
          }`}
        >
          {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
          {isPaused ? "Initiate Cycle" : "Emergency Halt"}
        </button>
      </div>

      {/* Top Performance Analytics Panel */}
      <div className="mb-8">
        <PerformanceStats />
      </div>

      {/* Visual Intelligence: Market & Equity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        <div className="rounded-2xl overflow-hidden border border-[#262627] bg-[#131314] p-1 h-fit">
          <div className="p-4 border-b border-[#262627] flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#adaaab] flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#00fc40]" /> Kraken Real-time Liquidity
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-[#00fc40] bg-[#00fc40]/10 px-2 py-0.5 rounded border border-[#00fc40]/20 animate-pulse">LIVE FEED</span>
              </div>
          </div>
          <div className="h-[400px]">
            <KrakenChart />
          </div>
        </div>

        <div className="h-[455px]">
          <EquityChart />
        </div>
      </div>

      {/* Decision Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
            <h3 className="text-[#adaaab] text-xs uppercase tracking-[0.3em] font-black mb-6 flex items-center gap-2">
            <Clock size={16} className="text-[#00fc40]" /> Neural Decision Stream
            </h3>
            
            <div className="flex flex-col gap-4">
            {!trades ? (
                <div className="bg-[#131314] rounded-2xl p-12 text-center text-[#adaaab] animate-pulse border border-[#262627]">
                <Activity size={32} className="mx-auto mb-4 opacity-20" />
                Synchronizing with Convex Reactive Core...
                </div>
            ) : trades.length === 0 ? (
                <div className="bg-[#131314] rounded-2xl p-12 text-center text-[#adaaab] border border-[#262627]">
                No operational logs detected.
                </div>
            ) : (
                trades.map((trade: any) => {
                const isBuy = trade.action === "buy";
                const isSell = trade.action === "sell";
                const isError = trade.action === "error";

                let actionColor = "text-[#adaaab]";
                let icon = <Activity size={18} />;

                if (isBuy) {
                    actionColor = "text-[#00FF41]";
                    icon = <TrendingUp size={18} strokeWidth={3} />;
                } else if (isSell) {
                    actionColor = "text-[#ff7351]";
                    icon = <TrendingDown size={18} strokeWidth={3} />;
                } else if (isError) {
                    actionColor = "text-[#ff7351]";
                }

                return (
                    <div key={trade._id} className="bg-[#131314] rounded-2xl p-4 md:p-6 border border-[#262627] flex flex-col md:flex-row gap-4 md:gap-6 items-start hover:border-[#484849]/50 transition-all duration-300 relative group">
                    {/* Confidence Sidebar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl overflow-hidden">
                        <div 
                            className={`w-full h-full opacity-30 ${isBuy ? "bg-[#00FF41]" : isSell ? "bg-[#ff7351]" : "bg-[#adaaab]"}`}
                            style={{ height: `${(trade.confidence || 0.5) * 100}%` }}
                        />
                    </div>

                    <div className="w-full md:w-40 shrink-0 flex flex-col gap-1">
                        <div className={`flex items-center gap-2 font-black font-[family-name:var(--font-space-grotesk)] uppercase tracking-tighter text-lg md:text-xl ${actionColor}`}>
                        {icon}
                        {trade.action}
                        </div>
                        <span className="text-white/40 text-[9px] md:text-[10px] font-black tracking-widest uppercase">
                            EXEC Price
                        </span>
                        <span className="text-white font-mono font-bold text-base md:text-lg">
                            ${trade.price?.toLocaleString()}
                        </span>

                        {/* Cryptographic Proof Tag */}
                        {trade.eip712Signature && (
                          <div className="mt-1 md:mt-2 text-[8px] font-mono text-[#00fc40]/60 bg-[#00fc40]/5 px-2 py-0.5 md:py-1 rounded border border-[#00fc40]/10 flex items-center gap-1 w-fit group-hover:border-[#00fc40]/30 transition-colors">
                            <ShieldCheck size={10} className="shrink-0" />
                            <span className="hidden md:inline uppercase opacity-40 mr-1">Proof:</span>
                            {trade.eip712Signature.slice(0, 8)}...{trade.eip712Signature.slice(-4)}
                          </div>
                        )}
                        
                        {/* On-Chain Transaction Links */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {trade.intentTx && (
                            <a 
                              href={`https://sepolia.etherscan.io/tx/${trade.intentTx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[8px] font-black text-[#00fc40] hover:text-white transition-colors bg-[#00fc40]/5 px-2 py-0.5 rounded border border-[#00fc40]/20 flex items-center gap-1 uppercase tracking-tighter"
                            >
                              Intent TX
                            </a>
                          )}
                          {trade.checkpointTx && (
                            <a 
                              href={`https://sepolia.etherscan.io/tx/${trade.checkpointTx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[8px] font-black text-white/40 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 uppercase tracking-tighter"
                            >
                              Checkpt
                            </a>
                          )}
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <p className="text-[#adaaab] text-xs md:text-sm leading-relaxed italic border-l-2 border-[#262627] pl-4 py-1">
                          &quot;{trade.reason || "Analyzing market conditions..."}&quot;
                        </p>
                        
                        {/* Confidence Meter Inline */}
                        <div className="mt-3 md:mt-4 flex items-center gap-3">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest shrink-0">AI Confidence</span>
                            <div className="flex-1 h-1 bg-[#1a191b] rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${trade.confidence > 0.8 ? "bg-[#00fc40]" : "bg-[#adaaab]"}`}
                                    style={{ width: `${(trade.confidence || 0) * 100}%` }}
                                />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-bold text-white/40 w-8">{(trade.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <div className="w-full md:w-32 shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between font-[family-name:var(--font-space-grotesk)] mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-[#262627]">
                        <div className="flex flex-col items-start md:items-end">
                            <div className="text-[8px] uppercase font-black tracking-tighter text-[#adaaab] mb-0.5">Timestamp</div>
                            <div className="text-[#565556] text-[9px] md:text-[10px] font-bold whitespace-nowrap">
                                {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        {trade.source && (
                            <div className="text-[7px] md:text-[8px] uppercase font-black tracking-widest text-[#00fc40]/40 px-2 py-0.5 border border-[#00fc40]/10 rounded-full">
                                {trade.source}
                            </div>
                        )}
                    </div>
                  </div>
                );
                })
            )}
            </div>
        </div>

        {/* Info Sidebar */}
        <div className="hidden lg:block">
            <h3 className="text-[#adaaab] text-xs uppercase tracking-[0.3em] font-black mb-6">Security Protocol</h3>
            <div className="bg-[#131314] rounded-2xl p-6 border border-[#262627] space-y-6">
                <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ShieldAlert size={14} className="text-[#00fc40]" /> Account Protection
                    </h4>
                    <p className="text-[#adaaab] text-[11px] leading-relaxed">
                        Every trade intent is cryptographically signed using EIP-712 standards and verified against strict risk guardrails before exchange submission.
                    </p>
                </div>
                <div className="pt-4 border-t border-[#262627]">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Cycle Frequency</h4>
                    <div className="text-2xl font-black font-[family-name:var(--font-space-grotesk)]">
                      {timeLeft}<span className="text-xs text-[#adaaab] ml-1">MIN</span>
                    </div>
                    <p className="text-[#adaaab] text-[11px] mt-2 italic">
                        The agent evaluates global sentiment and order books every 360 seconds.
                    </p>
                </div>

                <div className="pt-4 border-t border-[#262627]">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#00fc40]" /> On-Chain Pulse
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-[8px] uppercase font-black tracking-widest text-[#adaaab] mb-1">Agent Registry ID</div>
                      <div className="text-xl font-black font-[family-name:var(--font-space-grotesk)] text-white">
                        {agentId ? `#${agentId}` : "UNREGISTERED"}
                      </div>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-[8px] uppercase font-black tracking-widest text-[#adaaab] mb-1">Network Status</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${agentId ? "bg-[#00fc40] animate-pulse" : "bg-white/20"}`} />
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-white">Sepolia Testnet (11155111)</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
