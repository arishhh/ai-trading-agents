"use client";

import { useQuery, useMutation } from "convex/react";
import { Play, Pause, Activity, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const trades = useQuery("decisions:getLatestTrades" as any, { count: 50 });
  const pausedState = useQuery("state:getValue" as any, { key: "paused" });
  const setPausedStatus = useMutation("state:upsertValue" as any);

  const togglePause = async () => {
    const isPaused = pausedState?.value === true;
    await setPausedStatus({ key: "paused", value: !isPaused });
  };

  const isPaused = pausedState?.value === true;
  const latestTrade = trades && trades.length > 0 ? trades[0] : null;

  // Basic stats
  const currentPrice = latestTrade?.price || 0;
  const pnl = latestTrade?.pnlSnapshot || 0;
  
  const winCount = trades ? trades.filter((t: any) => t.pnlSnapshot > 0).length : 0;
  const winRate = trades && trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  if (!mounted) return null;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 bg-[#131314] rounded-xl border border-[#484849]/30 p-2 flex items-center justify-center overflow-hidden">
            <img 
              src="/itnnovator-logo.png" 
              alt="InnovAgent" 
              className="w-full h-full object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-[family-name:var(--font-space-grotesk)] tracking-tight text-white mb-1">
              InnovAgent Terminal
            </h1>
            <p className="text-[#adaaab] font-medium flex items-center gap-2">
              <Activity size={16} className={`${isPaused ? "text-[#ff7351]" : "text-[#00FF41] animate-pulse"}`} />
              System Status: 
              <span className={isPaused ? "text-[#ff7351]" : "text-[#00FF41]"}>
                {isPaused ? "PAUSED" : "ACTIVE"}
              </span>
            </p>
          </div>
        </div>

        <button 
          onClick={togglePause}
          className={`px-6 py-3 rounded-md font-bold font-[family-name:var(--font-space-grotesk)] uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${
            isPaused 
              ? "bg-[#00fc40]/10 text-[#00fc40] border border-[#00fc40]/30 hover:bg-[#00fc40]/20" 
              : "bg-[#b92902]/20 text-[#ff7351] border border-[#ff7351]/30 hover:bg-[#b92902]/40"
          }`}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
          {isPaused ? "Resume Agent" : "Pause Agent"}
        </button>
      </div>

      {/* Top Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#131314] rounded-xl p-6 border-t border-[#484849]/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00fc40]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <p className="text-[#adaaab] text-sm uppercase tracking-widest font-[family-name:var(--font-space-grotesk)] mb-2">Portfolio PnL</p>
          <div className="flex items-baseline gap-2">
            <h2 className={`text-4xl font-bold font-[family-name:var(--font-space-grotesk)] ${pnl >= 0 ? "text-[#00FF41]" : "text-[#ff7351]"}`}>
              {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
            </h2>
          </div>
        </div>

        <div className="bg-[#131314] rounded-xl p-6 border-t border-[#484849]/30 relative overflow-hidden group">
          <p className="text-[#adaaab] text-sm uppercase tracking-widest font-[family-name:var(--font-space-grotesk)] mb-2">Current BTC Price</p>
          <h2 className="text-4xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
            ${currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
          </h2>
        </div>

        <div className="bg-[#131314] rounded-xl p-6 border-t border-[#484849]/30 relative overflow-hidden group">
          <p className="text-[#adaaab] text-sm uppercase tracking-widest font-[family-name:var(--font-space-grotesk)] mb-2">Win Rate (Recent)</p>
          <div className="flex flex-col">
          <h2 className="text-4xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
            {winRate.toFixed(1)}%
          </h2>
          <span className="text-[#adaaab] text-xs font-medium mt-1">Based on last {trades?.length || 0} cycles</span>
          </div>
        </div>
      </div>

      {/* Decision Feed */}
      <div>
        <h3 className="text-[#adaaab] text-sm uppercase tracking-widest font-[family-name:var(--font-space-grotesk)] mb-4 flex items-center gap-2">
          <Clock size={16} /> InnovAgent Neural reasoning
        </h3>
        
        <div className="flex flex-col gap-3">
          {!trades ? (
            <div className="bg-[#131314] rounded-xl p-8 text-center text-[#adaaab] animate-pulse border-t border-[#484849]/30">
              Syncing neural pathways with Convex...
            </div>
          ) : trades.length === 0 ? (
            <div className="bg-[#131314] rounded-xl p-8 text-center text-[#adaaab] border-t border-[#484849]/30">
              No decisions recorded yet. Ensure agent is running.
            </div>
          ) : (
            trades.map((trade: any, i: number) => {
              const isBuy = trade.action === "buy";
              const isSell = trade.action === "sell";
              const isHold = trade.action === "hold";
              const isError = trade.action === "error";

              let actionColor = "text-[#adaaab]";
              let bgeColor = "bg-[#262627]/30";
              let icon = <TrendingUp size={18} />;

              if (isBuy) {
                actionColor = "text-[#00FF41]";
                bgeColor = "bg-[#00fc40]/10 border border-[#00fc40]/20";
                icon = <TrendingUp size={18} />;
              } else if (isSell) {
                actionColor = "text-[#ff7351]";
                bgeColor = "bg-[#b92902]/20 border border-[#ff7351]/20";
                icon = <TrendingDown size={18} />;
              } else if (isError) {
                actionColor = "text-[#ff7351]";
                bgeColor = "bg-[#b92902]/40 border border-[#ff7351]/40";
                icon = <Activity size={18} />;
              } else {
                actionColor = "text-[#81ecff]"; // cyan/tertiary for neutral
                icon = <Activity size={18} />;
              }

              const timeOpts: Intl.DateTimeFormatOptions = { 
                month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' 
              };

              return (
                <div key={trade._id} className="bg-[#131314] rounded-xl p-5 border-t border-[#484849]/30 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-[#1a191b] transition-colors relative group">
                  {/* Source Badge */}
                  {trade.source && (
                    <div className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-tighter text-[#adaaab] bg-[#1a191b] px-2 py-0.5 rounded border border-[#484849]/20 opacity-40 group-hover:opacity-100 transition-opacity">
                      {trade.source}
                    </div>
                  )}
                  
                  {/* Left Column: Action & Price */}
                  <div className="w-full md:w-48 shrink-0 flex flex-col gap-1">
                    <div className={`flex items-center gap-2 font-bold font-[family-name:var(--font-space-grotesk)] uppercase ${actionColor}`}>
                      {icon}
                      {trade.action}
                    </div>
                    {trade.price > 0 && (
                      <span className="text-white font-[family-name:var(--font-space-grotesk)] font-bold text-lg">
                        ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  {/* Middle Column: Reasoning */}
                  <div className="flex-1">
                    <p className="text-[#adaaab] text-sm leading-relaxed whitespace-pre-wrap">
                      {trade.reason || "No reasoning explicitly provided."}
                    </p>
                  </div>

                  {/* Right Column: Meta */}
                  <div className="w-full md:w-32 shrink-0 flex flex-col items-end gap-1 font-[family-name:var(--font-space-grotesk)]">
                    <span className="text-[#ffffff] bg-[#262627] px-2 py-1 flex rounded-md text-xs tracking-wider">
                      CONF: {(trade.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[#565556] text-xs">
                      {new Date(trade.timestamp).toLocaleString(undefined, timeOpts)}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
