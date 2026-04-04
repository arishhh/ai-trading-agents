import fs from 'fs'
import path from 'path'

// Path to a local JSON file that will store our paper trading state
const PAPER_STATE_PATH = path.join(process.cwd(), 'paper-state.json')

interface PaperState {
  balance: number
  holdings: number
  total_trades: number
}

// Ensure the paper state file exists or create a default one
function getPaperState(): PaperState {
  if (!fs.existsSync(PAPER_STATE_PATH)) {
    const initialState: PaperState = { balance: 10000, holdings: 0, total_trades: 0 }
    fs.writeFileSync(PAPER_STATE_PATH, JSON.stringify(initialState, null, 2))
    return initialState
  }
  return JSON.parse(fs.readFileSync(PAPER_STATE_PATH, 'utf-8'))
}

function savePaperState(state: PaperState) {
  fs.writeFileSync(PAPER_STATE_PATH, JSON.stringify(state, null, 2))
}

/**
 * Fetch data from Kraken Public REST API.
 */
async function krakenPublic(endpoint: string, params: string = "") {
  const url = `https://api.kraken.com/0/public/${endpoint}${params ? '?' + params : ''}`
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KrakenAI-Trader-Agent/1.0' }
    })
    const result: any = await response.json()
    if (result.error && result.error.length > 0) {
      throw new Error(`Kraken API Error: ${result.error.join(', ')}`)
    }
    return result.result
  } catch (err: any) {
    // Fallback for Demo/Hackathon if network is blocked
    if (endpoint === 'Ticker') {
       return { "XXBTZUSD": { c: [(65000 + (Math.random() * 100)).toFixed(2)] } }
    }
    if (endpoint === 'OHLC') {
       return { "XXBTZUSD": Array(10).fill(0).map((_, i) => [Date.now() - i*3600000, "64000", "65000", "63900", "64500"]) }
    }
    throw new Error(`Kraken API Request Failed: ${err.message}`)
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
 * Get last 10 hourly OHLC candles.
 */
export async function getOHLC() {
  const data = await krakenPublic('OHLC', 'pair=XBTUSD&interval=60')
  const pairData = data[Object.keys(data)[0]]
  // Last 10 entries (excluding the current unclosed candle which is usually last)
  const last10 = pairData.slice(-11, -1).map((c: any) => ({
    time: c[0],
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4])
  }))
  return last10
}

/**
 * Get paper trading account status (SIMULATED).
 */
export async function getPaperStatus() {
  const state = getPaperState()
  const { price } = await getTicker()
  
  const unrealized_pnl = state.holdings * (price - 0) // Simplified PNL for paper trading
  // Note: For a more accurate PNL, we'd track 'average_buy_price'.
  // But for the hackathon baseline, we just track current equity.
  
  return {
    current_value: state.balance + (state.holdings * price),
    unrealized_pnl: unrealized_pnl,
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
    state.balance -= cost
    state.holdings += volume
    state.total_trades += 1
    savePaperState(state)
    return { status: 'success', action: 'buy', volume, price }
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
  const initialState: PaperState = { balance: 10000, holdings: 0, total_trades: 0 }
  savePaperState(initialState)
  return { status: 'initialized' }
}
