import { ConvexHttpClient } from "convex/browser"
import * as kraken from "./kraken"
import * as claude from "./claude"
import * as prism from "./prism"
import { checkRisk } from "./risk"
import { registerAgent, claimAllocation, submitTradeIntent, postReputation, signHeartbeat, getAgentAddress, getWalletBalance, postCheckpoint } from "./erc8004"
import dotenv from "dotenv"
import http from "http"

dotenv.config()

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Main agent cycle.
 */
async function runCycle() {
  const timestamp = Date.now()
  const timeStr = new Date(timestamp).toLocaleTimeString()
  
  try {
    // 0. Update heartbeat in Convex
    await client.mutation("state:upsertValue" as any, { key: "heartbeat", value: timestamp })

    // 1. Check if agent is paused
    const pausedState = await client.query("state:getValue" as any, { key: "paused" })
    if (pausedState?.value === true) {
      console.log(`[${timeStr}] Agent paused, skipping cycle.`)
      return
    }

    // --- STEP 1: Get current BTC price ---
    const { price: currentPrice } = await kraken.getTicker()
    await client.mutation("state:upsertValue" as any, { key: "lastPrice", value: currentPrice })
    
    // --- STEP 2: Check cloud state ---
    const paperStateState = await client.query("state:getValue" as any, { key: "paperTradingState" })
    let currentPaperState: kraken.PaperState = paperStateState?.value || { balance: 100000, holdings: 0, total_trades: 0, avg_price: 0 }
    
    const posEntryTimeState = await client.query("state:getValue" as any, { key: "positionEntryTime" })
    let entryTime = posEntryTimeState?.value
    const isPositionOpen = currentPaperState.holdings > 0

    // STALE STATE RECOVERY: If holding but no timestamp, try to recover from history
    if (isPositionOpen && !entryTime) {
      const recent = await client.query("decisions:getLatestTrades" as any, { count: 5 })
      const lastBuy = recent?.find((d: any) => d.action === "buy")
      if (lastBuy) {
        entryTime = lastBuy.timestamp
        await client.mutation("state:upsertValue" as any, { key: "positionEntryTime", value: entryTime })
        console.log(`[${timeStr}] 🛠️ RECOVERED: Found entry time in history: ${new Date(entryTime).toLocaleTimeString()}`)
      } else {
        // Fallback: Start timer NOW if no history found
        entryTime = timestamp
        await client.mutation("state:upsertValue" as any, { key: "positionEntryTime", value: entryTime })
        console.log(`[${timeStr}] ⚠️ FALLBACK: No entry history found. Starting 60-min timer NOW.`)
      }
    }

    if (isPositionOpen) {
      console.log(`[${timeStr}] Position Check: EntryTime=${entryTime ? new Date(entryTime).toLocaleTimeString() : 'MISSING'}`)
    }

    // --- STEP 3: If position IS open -> run exit checks ---
    if (isPositionOpen) {
      const pnlPct = (currentPrice - currentPaperState.avg_price) / currentPaperState.avg_price
      const heldDurationMs = timestamp - (entryTime || timestamp)
      const heldMinutes = Math.floor(heldDurationMs / 60000)
      
      let exitTriggered = false
      let exitReason = ""

      if (pnlPct >= 0.005) {
        exitTriggered = true
        exitReason = "take_profit"
      } else if (pnlPct <= -0.01) {
        exitTriggered = true
        exitReason = "stop_loss"
      } else if (heldDurationMs >= 3600000) {
        exitTriggered = true
        exitReason = "time_exit_60min"
      }

      if (exitTriggered) {
        console.log(`[${timeStr}] EXIT TRIGGERED: ${exitReason} | PnL: ${(pnlPct * 100).toFixed(2)}%`)
        
        const volume = currentPaperState.holdings
        const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
        const agentId = agentIdState?.value

        // Execute Sell
        const result = await kraken.paperSell(currentPaperState, volume)
        if (result.success) {
          // Clear position state
          await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: result.state })
          await client.mutation("state:upsertValue" as any, { key: "positionEntryTime", value: null })
          
          let intentSig: string | undefined
          // On-chain Intent
          if (agentId) {
            const intent = await submitTradeIntent(agentId, "sell", "XBTUSD", volume, currentPrice).catch(() => {})
            intentSig = (intent as any)?.signature
            postReputation(agentId, 1.0, { action: "sell", pnlSnapshot: (pnlPct * 100), executed: true }).catch(() => {})
            postCheckpoint(agentId, { action: "sell", reason: exitReason }, 1.0, (pnlPct * 100)).catch(() => {})
          }

          // Log to Convex
          await client.mutation("decisions:insertDecision" as any, {
            timestamp,
            action: "sell",
            volume,
            price: currentPrice,
            reason: exitReason,
            confidence: 1.0,
            executed: true,
            pnlSnapshot: (pnlPct * 100),
            totalEquity: result.state.balance + (result.state.holdings * currentPrice),
            eip712Signature: intentSig,
            source: "InnovAgent-Production-Exit"
          })

          console.log(`[${timeStr}] SELL EXECUTED: ${exitReason} | 10s Cooldown starting...`)
          await new Promise(resolve => setTimeout(resolve, 10000))
          return
        }
      } else {
        // No exit triggered: Log monitoring and END cycle
        const monitorReason = "monitoring_position"
        const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
        const agentId = agentIdState?.value
        let heartbeatSig: string | undefined
        
        if (agentId) {
          heartbeatSig = await signHeartbeat(agentId, "hold", monitorReason, timestamp).catch(() => undefined) || undefined
          postCheckpoint(agentId, { action: "hold", reason: monitorReason }, 0.5, (pnlPct * 100)).catch(() => {})
        }

        await client.mutation("decisions:insertDecision" as any, {
          timestamp,
          action: "hold",
          volume: 0,
          price: currentPrice,
          reason: monitorReason,
          confidence: 0.5,
          executed: false,
          pnlSnapshot: (pnlPct * 100),
          totalEquity: currentPaperState.balance + (currentPaperState.holdings * currentPrice),
          eip712Signature: heartbeatSig,
          source: "InnovAgent-Monitoring"
        })
        console.log(`[${timeStr}] Monitoring: PnL ${(pnlPct * 100).toFixed(2)}% | Held: ${heldMinutes} min | Reason: ${monitorReason}`)
        return
      }
    }

    // --- STEP 4: If position is NOT open -> check Entry Logic ---
    const lastAIConsultState = await client.query("state:getValue" as any, { key: "lastAIConsultTime" })
    const lastAIConsultTime = lastAIConsultState?.value || 0
    const sinceLastAI = timestamp - lastAIConsultTime
    
    // Fetch market indicator data
    const candles = await kraken.getOHLC()
    const signals = await prism.getSignals()
    
    // Neural Sync Check: Force AI consultation every 30 minutes
    const neuralSyncTrigger = sinceLastAI >= 1800000
    
    // Normal Indicator Gate: RSI or 10/20 Trend shift
    const greenCount = candles.filter((c: any) => c.isGreen).length
    const trendTrigger = greenCount >= 10
    const rsiTrigger = signals && (signals.rsi < 40 || signals.rsi > 65)

    if (neuralSyncTrigger || trendTrigger || rsiTrigger) {
      const triggerType = neuralSyncTrigger ? "neural_sync_trigger" : "indicator_gate"
      console.log(`[${timeStr}] Entry Logic Triggered: ${triggerType}. Consulting AI...`)
      
      const marketData: claude.MarketData = {
        currentPrice,
        candles,
        portfolioValue: currentPaperState.balance,
        unrealizedPnl: 0,
        totalTrades: currentPaperState.total_trades,
        avgEntryPrice: 0,
        signals
      }
      
      const decision = await claude.makeDecision(marketData)
      await client.mutation("state:upsertValue" as any, { key: "lastAIConsultTime", value: timestamp })

      if (decision.action === "buy") {
        const volume = 950 / currentPrice // Production $950 target
        const risk = await checkRisk(volume, currentPrice)
        
        if (risk.allowed) {
          const result = await kraken.paperBuy(currentPaperState, volume)
          if (result.success) {
            await client.mutation("state:upsertValue" as any, { key: "paperTradingState", value: result.state })
            await client.mutation("state:upsertValue" as any, { key: "positionEntryTime", value: timestamp })

            const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
            const agentId = agentIdState?.value
            
            if (agentId) {
              await submitTradeIntent(agentId, "buy", "XBTUSD", volume, currentPrice).catch(() => {})
              postReputation(agentId, decision.confidence, { action: "buy", pnlSnapshot: 0, executed: true }).catch(() => {})
              postCheckpoint(agentId, decision, decision.confidence, 0).catch(() => {})
            }

            await client.mutation("decisions:insertDecision" as any, {
              timestamp,
              action: "buy",
              volume,
              price: currentPrice,
              reason: neuralSyncTrigger ? "neural_sync_trigger" : decision.reason,
              confidence: decision.confidence,
              executed: true,
              pnlSnapshot: 0,
              totalEquity: result.state.balance + (result.state.holdings * currentPrice),
              source: `InnovAgent-Entry-${neuralSyncTrigger ? 'Neural' : 'Indicator'}`
            })
            console.log(`[${timeStr}] BUY EXECUTED | Size: $950 | Entry Time Stored: ${new Date(timestamp).toLocaleTimeString()}`)
          }
        }
      } else {
        // AI said hold despite indicators/timer
        const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
        const agentId = agentIdState?.value
        let heartbeatSig: string | undefined
        const reason = neuralSyncTrigger ? "neural_sync_trigger" : "indicators_met_ai_hold"
        
        if (agentId) {
          heartbeatSig = await signHeartbeat(agentId, "hold", reason, timestamp).catch(() => undefined) || undefined
          postCheckpoint(agentId, { action: "hold", reason: reason }, decision.confidence, 0).catch(() => {})
        }

        await client.mutation("decisions:insertDecision" as any, {
          timestamp,
          action: "hold",
          volume: 0,
          price: currentPrice,
          reason: reason,
          confidence: decision.confidence,
          executed: false,
          pnlSnapshot: 0,
          totalEquity: currentPaperState.balance,
          eip712Signature: heartbeatSig,
          source: "InnovAgent-Hold-Analysis"
        })
        console.log(`[${timeStr}] AI HOLD | Reason: ${neuralSyncTrigger ? 'Neural Sync Refused' : 'Indicator Refused'}`)
      }
    } else {
       // Standby: Neither timer nor indicators triggered
       const walletBalance = await getWalletBalance()
       await client.mutation("state:upsertValue" as any, { key: "walletBalance", value: walletBalance })
       
       // Heartbeat signature for Pulse Monitor
       const agentIdState = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
       const agentId = agentIdState?.value
       let heartbeatSig: string | undefined
       
       if (agentId) {
         heartbeatSig = await signHeartbeat(agentId, "hold", "standby", timestamp).catch(() => undefined) || undefined
         postCheckpoint(agentId, { action: "hold", reason: "standby" }, 0.5, 0).catch(() => {})
       }

       await client.mutation("decisions:insertDecision" as any, {
         timestamp,
         action: "hold",
         volume: 0,
         price: currentPrice,
         reason: "standby",
         confidence: 0.5,
         executed: false,
         pnlSnapshot: 0,
         totalEquity: currentPaperState.balance,
         eip712Signature: heartbeatSig,
         source: "InnovAgent-Standby"
       })
       console.log(`[${timeStr}] Standby: Monitoring metrics...`)
    }

  } catch (error: any) {
    console.error(`[${timeStr}] CYCLE ERROR:`, error)
  }
}

/**
 * Startup sequence.
 */
async function main() {
  console.log("--- ACTIVATE: Hackathon Boost Mode (V3) ---")
  
  // 1. Start Heartbeat Loop immediately (Crash-Proof)
  const interval = parseInt(process.env.LOOP_INTERVAL_MS || "360000")
  console.log(`[Lifecycle] Starting 6-minute cycle loop (Interval: ${interval}ms)`)
  
  runCycle().catch(err => console.error("[Cycle Error]", err))
  setInterval(() => {
    runCycle().catch(err => console.error("[Cycle Error]", err))
  }, interval)

  // 2. Start Health Check Server
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('InnovAgent is healthy and running in Boost Mode.\n')
  }).listen(process.env.PORT || 8080)

  // 3. Perform background registration/allocation
  try {
    const agentId = await registerAgent()
    if (agentId) {
      console.log(`[Registration] Agent verified/registered: ${agentId}`)
      await claimAllocation(agentId)
    }
  } catch (err) {
    console.warn(`[Registration] Initial registration failed, will retry in background:`, err)
  }
}

main()
