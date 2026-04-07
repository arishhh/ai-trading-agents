"use client";

import { useQuery, useMutation } from "convex/react";
import { Play, Pause, Activity, TrendingUp, TrendingDown, Clock, ShieldAlert, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import KrakenChart from "@/components/KrakenChart";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const trades = useQuery("decisions:getLatestTrades" as any, { count: 30 });
  const pausedState = useQuery("state:getValue" as any, { key: "paused" });
  const todayLossesState = useQuery("state:getValue" as any, { key: "todayLosses" });
  const setPausedStatus = useMutation("state:upsertValue" as any);

  const togglePause = async () => {
    const isPaused = pausedState?.value === true;
    await setPausedStatus({ key: "paused", value: !isPaused });
  };

  const isPaused = pausedState?.value === true;
  const latestTrade = trades && trades.length > 0 ? trades[0] : null;
  const todayLosses = todayLossesState?.value || 0;

  // Basic stats
  const currentPrice = latestTrade?.price || 0;
  const unrealizedPnL = latestTrade?.pnlSnapshot || 0;
  
  // Starting balance assumption for paper trading
  const startingBalance = 10000;
  const totalEquity = startingBalance + unrealizedPnL;
  
  const winCount = trades ? trades.filter((t: any) => t.pnlSnapshot > 0).length : 0;
  const winRate = trades && trades.length > 0 ? (winCount / trades.length) * 100 : 0;

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
            <p className="text-[#adaaab] font-medium flex items-center gap-2 text-sm tracking-widest uppercase">
              <Activity size={14} className={`${isPaused ? "text-[#ff7351]" : "text-[#00FF41] animate-pulse"}`} />
              Agent Status: 
              <span className={isPaused ? "text-[#ff7351]" : "text-[#00FF41]"}>
                {isPaused ? "PAUSED" : "OPERATIONAL"}
              </span>
            </p>
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

      {/* Top Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#131314] rounded-2xl p-6 border border-[#262627] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={48} />
          </div>
          <p className="text-[#adaaab] text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Total Account Equity</p>
          <h2 className="text-3xl font-black font-[family-name:var(--font-space-grotesk)] text-white">
            ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${unrealizedPnL >= 0 ? "text-[#00FF41]" : "text-[#ff7351]"}`}>
            {unrealizedPnL >= 0 ? "+" : "-"}${Math.abs(unrealizedPnL).toFixed(2)} All-time PnL
          </div>
        </div>

        <div className="bg-[#131314] rounded-2xl p-6 border border-[#262627] relative overflow-hidden group">
          <p className="text-[#adaaab] text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Market Price (Kraken)</p>
          <h2 className="text-3xl font-black font-[family-name:var(--font-space-grotesk)] text-white">
            ${currentPrice > 0 ? currentPrice.toLocaleString() : "---"}
          </h2>
          <div className="text-[10px] text-[#adaaab] font-bold mt-2 uppercase tracking-tighter">BTC / USD Spot Feed</div>
        </div>

        <div className="bg-[#131314] rounded-2xl p-6 border border-[#262627] relative overflow-hidden group">
          <p className="text-[#adaaab] text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Daily Risk Guardrail</p>
          <div className="flex justify-between items-end mb-2">
            <h2 className={`text-3xl font-black font-[family-name:var(--font-space-grotesk)] ${todayLosses > 400 ? "text-[#ff7351]" : "text-white"}`}>
              ${todayLosses.toFixed(2)}
            </h2>
            <span className="text-[#565556] text-[10px] font-bold mb-1">/ $500.00</span>
          </div>
          <div className="w-full h-1.5 bg-[#1a191b] rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ${todayLosses > 400 ? "bg-[#ff7351]" : "bg-[#00fc40]"}`}
              style={{ width: `${Math.min((todayLosses / 500) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-[#131314] rounded-2xl p-6 border border-[#262627] relative overflow-hidden group">
          <p className="text-[#adaaab] text-[10px] uppercase tracking-[0.2em] font-bold mb-3">Agent Efficiency</p>
          <h2 className="text-3xl font-black font-[family-name:var(--font-space-grotesk)] text-white">
            {winRate.toFixed(1)}%
          </h2>
          <div className="text-[10px] text-[#adaaab] font-bold mt-2 uppercase tracking-tighter">Win Rate (Last 30 Trades)</div>
        </div>
      </div>

      {/* Market Chart Section */}
      <div className="mb-10 rounded-2xl overflow-hidden border border-[#262627] bg-[#131314] p-1">
        <div className="p-4 border-b border-[#262627] flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[#adaaab] flex items-center gap-2">
                <TrendingUp size={14} className="text-[#00fc40]" /> Kraken Real-time Liquidity
            </h3>
            <span className="text-[10px] font-bold text-[#00fc40] bg-[#00fc40]/10 px-2 py-0.5 rounded border border-[#00fc40]/20 animate-pulse">LIVE FEED</span>
        </div>
        <KrakenChart />
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
                    <div key={trade._id} className="bg-[#131314] rounded-2xl p-6 border border-[#262627] flex flex-col md:flex-row gap-6 items-start hover:border-[#484849]/50 transition-all duration-300 relative group">
                    {/* Confidence Sidebar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl overflow-hidden">
                        <div 
                            className={`w-full h-full opacity-30 ${isBuy ? "bg-[#00FF41]" : isSell ? "bg-[#ff7351]" : "bg-[#adaaab]"}`}
                            style={{ height: `${(trade.confidence || 0.5) * 100}%` }}
                        />
                    </div>

                    <div className="w-full md:w-40 shrink-0 flex flex-col gap-1">
                        <div className={`flex items-center gap-2 font-black font-[family-name:var(--font-space-grotesk)] uppercase tracking-tighter text-xl ${actionColor}`}>
                        {icon}
                        {trade.action}
                        </div>
                        <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">
                            EXEC Price
                        </span>
                        <span className="text-white font-mono font-bold text-lg">
                            ${trade.price?.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex-1">
                        <p className="text-[#adaaab] text-sm leading-relaxed italic border-l-2 border-[#262627] pl-4 py-1">
                          &quot;{trade.reason || "Analyzing market conditions..."}&quot;
                        </p>
                        
                        {/* Confidence Meter Inline */}
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest shrink-0">AI Confidence</span>
                            <div className="flex-1 h-1 bg-[#1a191b] rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${trade.confidence > 0.8 ? "bg-[#00fc40]" : "bg-[#adaaab]"}`}
                                    style={{ width: `${(trade.confidence || 0) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-white/40 w-8">{(trade.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <div className="w-full md:w-32 shrink-0 flex flex-col items-end justify-between font-[family-name:var(--font-space-grotesk)]">
                        <div className="flex flex-col items-end">
                            <div className="text-[9px] uppercase font-black tracking-tighter text-[#adaaab] mb-1">Timestamp</div>
                            <div className="text-[#565556] text-[10px] font-bold whitespace-nowrap">
                                {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        {trade.source && (
                            <div className="text-[8px] uppercase font-black tracking-widest text-[#00fc40]/40 px-2 py-0.5 border border-[#00fc40]/10 rounded-full mt-4">
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
                    <div className="text-2xl font-black font-[family-name:var(--font-space-grotesk)]">10:00<span className="text-xs text-[#adaaab] ml-1">MIN</span></div>
                    <p className="text-[#adaaab] text-[11px] mt-2 italic">
                        The agent evaluates global sentiment and order books every 600 seconds.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
