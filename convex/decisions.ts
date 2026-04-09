import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { Doc } from "./_generated/dataModel"

export const insertDecision = mutation({
  args: {
    timestamp: v.number(),
    action: v.string(),
    volume: v.number(),
    price: v.number(),
    reason: v.string(),
    confidence: v.number(),
    executed: v.boolean(),
    krakenResponse: v.any(),
    pnlSnapshot: v.number(),
    totalEquity: v.optional(v.number()),
    eip712Signature: v.optional(v.string()),
    intentTx: v.optional(v.string()),
    checkpointTx: v.optional(v.string()),
    reputationTx: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("decisions", args)
    return id
  },
})

export const getRecent = query({
  handler: async (ctx): Promise<Doc<"decisions">[]> => {
    return await ctx.db
      .query("decisions")
      .order("desc")
      .take(50)
  },
})

// For Daily Loss Limit ($500) — no index on timestamp, filter in memory
export const getRecentByTime = query({
  args: { since: v.number() },
  handler: async (ctx, args): Promise<Doc<"decisions">[]> => {
    const all = await ctx.db
      .query("decisions")
      .order("desc")
      .take(500) // Look back through the last 500 rows max
    return all.filter((d) => d.timestamp >= args.since)
  },
})

// For Circuit Breaker (3 losses)
export const getLatestTrades = query({
  args: { count: v.number() },
  handler: async (ctx, args): Promise<Doc<"decisions">[]> => {
    return await ctx.db
      .query("decisions")
      .order("desc")
      .take(args.count)
  },
})

export const getEquityHistory = query({
  handler: async (ctx): Promise<{ timestamp: number; totalEquity: number }[]> => {
    const decisions = await ctx.db
      .query("decisions")
      .order("asc") // Changed to asc for chronological charting
      .take(1000)
    
    return decisions
      .filter((d) => d.totalEquity !== undefined)
      .map((d) => ({
        timestamp: d.timestamp,
        totalEquity: d.totalEquity as number,
      }))
  },
})

export const getPerformanceStats = query({
  handler: async (ctx) => {
    const allDecisions = await ctx.db
      .query("decisions")
      .order("desc")
      .take(500)

    const trades = allDecisions.filter(d => d.executed)
    const count = trades.length
    
    // Win Rate calculation based on pnlSnapshot (positive being a win)
    const wins = trades.filter(d => d.pnlSnapshot > 0).length
    const winRate = count > 0 ? (wins / count) * 100 : 0

    // Latest equity vs Initial $100,000
    const latest = allDecisions[0]?.totalEquity || 100000
    const initial = 100000
    const totalPnl = latest - initial
    const totalPnlPct = ((latest - initial) / initial) * 100

    // Max Drawdown calculation
    let maxEquity = 100000
    let maxDd = 0
    const chronological = [...allDecisions].reverse()
    
    for (const d of chronological) {
      if (d.totalEquity) {
        if (d.totalEquity > maxEquity) maxEquity = d.totalEquity
        const dd = (maxEquity - d.totalEquity) / maxEquity
        if (dd > maxDd) maxDd = dd
      }
    }

    return {
      count,
      winRate,
      totalPnl,
      totalPnlPct,
      maxDrawdown: maxDd * 100,
      currentEquity: latest
    }
  }
})
