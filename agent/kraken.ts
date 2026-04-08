import fs from 'fs'
import path from 'path'

// Path to a local JSON file that will store our paper trading state
const PAPER_STATE_PATH = path.join(process.cwd(), 'paper-state.json')

interface PaperState {
  balance: number
  holdings: number
  total_trades: number
  avg_price: number // Add Average Entry Price tracking
}

// Ensure the paper state file exists or create a default one
function getPaperState(): PaperState {
  if (!fs.existsSync(PAPER_STATE_PATH)) {
    const initialState: PaperState = { balance: 10000, holdings: 0, total_trades: 0, avg_price: 0 }
    fs.writeFileSync(PAPER_STATE_PATH, JSON.stringify(initialState, null, 2))
    return initialState
  }
  const state = JSON.parse(fs.readFileSync(PAPER_STATE_PATH, 'utf-8'))
  // Migration: Add avg_price if it doesn't exist
  if (state.avg_price === undefined) {
    state.avg_price = 0
  }
  return state
}

function savePaperState(state: PaperState) {
  fs.writeFileSync(PAPER_STATE_PATH, JSON.stringify(state, null, 2))
}

/**
 * Fetch data from Kraken Public REST API.
 */
async function krakenPublic(endpoint: string, params: string = "", retries = 3) {
  const url = `https://api.kraken.com/0/public/${endpoint}${params ? '?' + params : ''}`
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'InnovAgent-Trader/1.0' },
        signal: AbortSignal.timeout(5000) // 5s timeout
      })
      const result: any = await response.json()
      if (result.error && result.error.length > 0) {
        throw new Error(`Kraken API Error: ${result.error.join(', ')}`)
      }
      return result.result
    } catch (err: any) {
      if (i === retries - 1) {
        console.warn(`Kraken API failed after ${retries} attempts, using mock fallback.`)
        // High-fidelity fallback for Demo/Hackathon
        if (endpoint === 'Ticker') {
           return { "XXBTZUSD": { c: [(71000 + (Math.random() * 500)).toFixed(2)] } }
        }
        if (endpoint === 'OHLC') {
           return { "XXBTZUSD": Array(12).fill(0).map((_, i) => [Date.now() - i*600000, "70000", "71000", "69900", "70500"]) }
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
  const data = await krakenPublic('Ticker', 'pair=XBTUSD')
  const pairData = data[Object.keys(data)[0]]
  // 'c' is [price, whole_lot_volume]
  return { price: parseFloat(pairData.c[0]) }
}

/**
 * Get last 10 10-minute OHLC candles.
 */
export async function getOHLC() {
  // interval=10 for 10-minute candles
  const data = await krakenPublic('OHLC', 'pair=XBTUSD&interval=10')
  const pairData = data[Object.keys(data)[0]]
  // Last 10 entries (excluding the current unclosed candle which is usually last)
  const last10 = pairData.slice(-11, -1).map((c: any) => ({
    time: c[0],
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    isGreen: parseFloat(c[4]) > parseFloat(c[1])
  }))
  return last10
}

/**
 * Get paper trading account status (SIMULATED).
 */
export async function getPaperStatus() {
  const state = getPaperState()
  const { price } = await getTicker()
  
  // Real Unrealized PnL based on Average Entry Price
  const unrealized_pnl = state.holdings > 0 
    ? state.holdings * (price - state.avg_price)
    : 0
  
  return {
    current_value: state.balance + (state.holdings * price),
    unrealized_pnl: unrealized_pnl,
    avg_price: state.avg_price,
    holdings: state.holdings,
    total_trades: state.total_trades
  }
}

/**
 * Place a paper buy order (SIMULATED).
 */
export async function paperBuy(volume: number) {
  const state = getPaperState()
  const { price } = await getTicker()
  const cost = volume * price

  if (state.balance >= cost) {
    // Update Average Entry Price (weighted)
    const totalCost = (state.holdings * state.avg_price) + cost
    state.holdings += volume
    state.avg_price = totalCost / state.holdings
    
    state.balance -= cost
    state.total_trades += 1
    savePaperState(state)
    return { status: 'success', action: 'buy', volume, price, avg_price: state.avg_price }
  } else {
    throw new Error(`Insufficient paper balance: ${state.balance.toFixed(2)} < ${cost.toFixed(2)}`)
  }
}

/**
 * Place a paper sell order (SIMULATED).
 */
export async function paperSell(volume: number) {
  const state = getPaperState()
  const { price } = await getTicker()

  if (state.holdings >= volume) {
    state.balance += volume * price
    state.holdings -= volume
    
    // If we sold everything, reset avg_price
    if (state.holdings <= 0) {
      state.avg_price = 0
    }
    
    state.total_trades += 1
    savePaperState(state)
    return { status: 'success', action: 'sell', volume, price }
  } else {
    throw new Error(`Insufficient paper holdings: ${state.holdings.toFixed(4)} < ${volume.toFixed(4)}`)
  }
}

/**
 * Initialize paper trading account (SIMULATED).
 */
export async function initPaper() {
  const initialState: PaperState = { balance: 10000, holdings: 0, total_trades: 0, avg_price: 0 }
  savePaperState(initialState)
  return { status: 'initialized' }
}
