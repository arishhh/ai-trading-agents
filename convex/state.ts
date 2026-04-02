import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getValue = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("state")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()
  },
})

export const upsertValue = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("state")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value })
    } else {
      await ctx.db.insert("state", { key: args.key, value: args.value })
    }
  },
})
