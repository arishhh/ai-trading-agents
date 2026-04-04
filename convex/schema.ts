import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  decisions: defineTable({
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
  }),
  state: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
})
