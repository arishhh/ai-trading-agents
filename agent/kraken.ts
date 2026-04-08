import { ConvexHttpClient } from "convex/browser"
import dotenv from "dotenv"

dotenv.config()

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

export interface PaperState {
  balance: number
  holdings: number
  total_trades: number
  avg_price: number
}

// Default initial state for a 100k account
export const INITIAL_PAPER_STATE: PaperState = {
  balance: 100000,
  holdings: 0,
  total_trades: 0,
  avg_price: 0
}

/**
 * Fetch data from Kraken Public REST API.
 */
async function krakenPublic(endpoint: string, params: string = "", retries = 5) {
  const url = `https://api.kraken.com/0/public/${endpoint}${params ? '?' + params : ''}`
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'InnovAgent-Trader/1.1',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000) // Increase to 15s for stability
      })
      const result: any = await response.json()
      if (result.error && result.error.length > 0) {
        throw new Error(`Kraken API Error: ${result.error.join(', ')}`)
      }
      return result.result
    } catch (err: any) {
      if (i === retries - 1) {
        console.warn(`[Kraken] API failed after ${retries} attempts, using dynamic fallback. Error: ${err.message}`)
        
        if (endpoint === 'Ticker') {
           try {
             const lastPriceState: any = await client.query("state:getValue" as any, { key: "lastPrice" })
             if (lastPriceState?.value) {
               console.log(`[Kraken] Fallback: Using last known price from Convex: $${lastPriceState.value}`)
               return { "XXBTZUSD": { c: [lastPriceState.value.toString()] } }
             }
           } catch (fallbackErr) {
             console.error("[Kraken] Failed to fetch lastPrice fallback from Convex.")
           }
           // Ultimate safety net (~$70k range)
           return { "XXBTZUSD": { c: [(70000 + (Math.random() * 500)).toFixed(2)] } }
        }
        
        if (endpoint === 'OHLC') {
           // Return generic training-friendly data if OHLC is down
           return { "XXBTZUSD": Array(22).fill(0).map((_, i) => [Date.now() - i*300000, "70000", "71000", "69900", "70500"]) }
        }
        throw new Error(`Kraken API Request Failed: ${err.message}`)
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

/**
 * Get current ticker info for BTCUSD.
 */
export async function getTicker() {
  const data = await krakenPublic('Ticker', 'pair=XXBTZUSD')
  const pairData = data[Object.keys(data)[0]]
  return { price: parseFloat(pairData.c[0]) }
}

/**
 * Get last 20 5-minute OHLC candles (total 100 mins).
 */
export async function getOHLC() {
  // Wait 1s before calling OHLC to avoid rate limit after Ticker call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // interval=5 is the closest supported timeframe for granular 10-minute trends
  const data = await krakenPublic('OHLC', 'pair=XXBTZUSD&interval=5')
  const pairData = data[Object.keys(data)[0]]
  
  // Last 20 5-minute candles = 100 minutes of history
  const last20 = pairData.slice(-21, -1).map((c: any) => ({
    time: c[0],
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    isGreen: parseFloat(c[4]) > parseFloat(c[1])
  }))
  return last20
}

/**
 * Simulate paper buy order using provided state.
 * Returns the modified state.
 */
export async function paperBuy(state: PaperState, volume: number): Promise<{ success: boolean, state: PaperState, error?: string }> {
  const { price } = await getTicker()
  const cost = volume * price

  if (state.balance >= cost) {
    const nextState = { ...state }
    const totalCost = (nextState.holdings * nextState.avg_price) + cost
    nextState.holdings += volume
    nextState.avg_price = nextState.holdings > 0 ? totalCost / nextState.holdings : price
    nextState.balance -= cost
    nextState.total_trades += 1
    return { success: true, state: nextState }
  } else {
    return { success: false, error: `Insufficient paper balance: ${state.balance.toFixed(2)} < ${cost.toFixed(2)}`, state }
  }
}

/**
 * Simulate paper sell order using provided state.
 * Returns the modified state.
 */
export async function paperSell(state: PaperState, volume: number): Promise<{ success: boolean, state: PaperState, error?: string }> {
  const { price } = await getTicker()

  if (state.holdings >= volume) {
    const nextState = { ...state }
    nextState.balance += volume * price
    nextState.holdings -= volume
    if (nextState.holdings <= 0) {
      nextState.avg_price = 0
    }
    nextState.total_trades += 1
    return { success: true, state: nextState }
  } else {
    return { success: false, error: `Insufficient paper holdings: ${state.holdings.toFixed(4)} < ${volume.toFixed(4)}`, state }
  }
}

/**
 * Calculate PnL and Status using provided state.
 */
export async function getPaperStatus(state: PaperState) {
  const { price } = await getTicker()
  const unrealized_pnl = state.holdings > 0 
    ? state.holdings * (price - state.avg_price)
    : 0
  
  return {
    current_value: state.balance + (state.holdings * price),
    unrealized_pnl: unrealized_pnl,
    avg_price: state.avg_price,
    holdings: state.holdings,
    total_trades: state.total_trades,
    current_price: price
  }
}
