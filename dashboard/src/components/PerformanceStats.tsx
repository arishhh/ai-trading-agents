"use client";

import { useQuery } from "convex/react";
import { TrendingUp, TrendingDown, Target, BarChart2, ShieldAlert } from "lucide-react";

export default function PerformanceStats() {
  const stats = useQuery("decisions:getPerformanceStats" as any);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#131314] rounded-2xl p-6 border border-[#262627] h-32" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Trades",
      value: stats.count,
      sub: "Last 500 cycles",
      icon: <Target className="text-[#00fc40]" />,
    },
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      sub: "Based on PnL",
      icon: <BarChart2 className="text-[#00fc40]" />,
    },
    {
      label: "Net Profit",
      value: `$${Math.abs(stats.totalPnl).toLocaleString()}`,
      sub: `${stats.totalPnlPct >= 0 ? "+" : "-"}${Math.abs(stats.totalPnlPct).toFixed(2)}% ROI`,
      icon: stats.totalPnlPct >= 0 ? <TrendingUp className="text-[#00fc40]" /> : <TrendingDown className="text-[#ff7351]" />,
      color: stats.totalPnlPct >= 0 ? "text-[#00fc40]" : "text-[#ff7351]",
    },
    {
      label: "Max Drawdown",
      value: `${stats.maxDrawdown.toFixed(2)}%`,
      sub: "Peak-to-Trough",
      icon: <ShieldAlert className="text-[#ff7351]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-[#131314] rounded-2xl p-6 border border-[#262627] relative overflow-hidden group hover:border-[#484849]/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[#adaaab] text-[10px] uppercase tracking-[0.2em] font-bold">{kpi.label}</p>
            <div className="p-2 bg-black/20 rounded-lg">{kpi.icon}</div>
          </div>
          <h2 className={`text-3xl font-black font-[family-name:var(--font-space-grotesk)] ${kpi.color || "text-white"}`}>
            {kpi.value}
          </h2>
          <p className="text-[10px] text-[#565556] font-bold mt-2 uppercase tracking-widest">{kpi.sub}</p>
        </div>
      ))}
    </div>
  );
}
