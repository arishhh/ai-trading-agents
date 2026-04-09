"use client";

import { useQuery } from "convex/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AreaChart as ChartIcon } from "lucide-react";

export default function EquityChart() {
  const history = useQuery("decisions:getEquityHistory" as any);

  if (!history) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#131314] rounded-2xl border border-[#262627] animate-pulse">
        <div className="text-[#adaaab] text-xs uppercase tracking-widest font-black">Loading Equity Data...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatDate = (timestamp: number) => 
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full h-full bg-[#131314] rounded-2xl border border-[#262627] p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-[#adaaab] flex items-center gap-2">
          <ChartIcon size={14} className="text-[#00fc40]" /> Account Equity Curve
        </h3>
        <span className="text-[10px] font-bold text-[#565556]">$100,000 BASELINE</span>
      </div>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00fc40" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00fc40" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262627" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              hide 
            />
            <YAxis 
              domain={['dataMin - 1000', 'dataMax + 1000']} 
              orientation="right"
              tick={{ fill: '#565556', fontSize: 10, fontWeight: 'bold' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#131314', border: '1px solid #262627', borderRadius: '12px' }}
              itemStyle={{ color: '#00fc40', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#adaaab', fontSize: '10px', marginBottom: '4px' }}
              labelFormatter={(label) => `Time: ${formatDate(label)}`}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), "Equity"]}
            />
            <Area 
              type="monotone" 
              dataKey="totalEquity" 
              stroke="#00fc40" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorEquity)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
