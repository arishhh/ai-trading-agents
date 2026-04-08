/**
 * Kraken & Paper Trading Simulation Module (Cloud-Ready)
 */

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
  return { price: parseFloat(pairData.c[0]) }
}

/**
 * Get last 10 10-minute OHLC candles.
 */
export async function getOHLC() {
  const data = await krakenPublic('OHLC', 'pair=XBTUSD&interval=10')
  const pairData = data[Object.keys(data)[0]]
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
 * Simulate paper buy order using provided state.
 * Returns the modified state.
 */
export async function paperBuy(state: PaperState, volume: number): Promise<PaperState> {
  const { price } = await getTicker()
  const cost = volume * price

  if (state.balance >= cost) {
    const nextState = { ...state }
    const totalCost = (nextState.holdings * nextState.avg_price) + cost
    nextState.holdings += volume
    nextState.avg_price = nextState.holdings > 0 ? totalCost / nextState.holdings : price
    nextState.balance -= cost
    nextState.total_trades += 1
    return nextState
  } else {
    throw new Error(`Insufficient paper balance: ${state.balance.toFixed(2)} < ${cost.toFixed(2)}`)
  }
}

/**
 * Simulate paper sell order using provided state.
 * Returns the modified state.
 */
export async function paperSell(state: PaperState, volume: number): Promise<PaperState> {
  const { price } = await getTicker()

  if (state.holdings >= volume) {
    const nextState = { ...state }
    nextState.balance += volume * price
    nextState.holdings -= volume
    if (nextState.holdings <= 0) {
      nextState.avg_price = 0
    }
    nextState.total_trades += 1
    return nextState
  } else {
    throw new Error(`Insufficient paper holdings: ${state.holdings.toFixed(4)} < ${volume.toFixed(4)}`)
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
