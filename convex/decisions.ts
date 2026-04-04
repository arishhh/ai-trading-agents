import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

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
    eip712Signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("decisions", args)
    return id
  },
})

export const getRecent = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("decisions")
      .order("desc")
      .take(50)
  },
})

// For Daily Loss Limit ($500) — no index on timestamp, filter in memory
export const getRecentByTime = query({
  args: { since: v.number() },
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    return await ctx.db
      .query("decisions")
      .order("desc")
      .take(args.count)
  },
})
