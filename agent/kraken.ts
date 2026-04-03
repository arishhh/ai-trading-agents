import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const KRAKEN_BIN = process.env.KRAKEN_BIN_PATH || '/usr/local/bin/kraken'

/**
 * Shell execute a kraken command and parse JSON output.
 * @param command The kraken command to run (e.g. 'ticker BTCUSD')
 * @returns Parsed JSON result
 */
async function krakenExec(command: string) {
  try {
    const fullCommand = `${KRAKEN_BIN} ${command} -o json`
    const { stdout, stderr } = await execAsync(fullCommand)

    if (stderr && !stdout) {
      throw new Error(`Kraken CLI Error: ${stderr}`)
    }

    const result = JSON.parse(stdout)

    // Check for internal Kraken API errors
    if (result.error && result.error.length > 0) {
      throw new Error(`Kraken API Error: ${JSON.stringify(result.error)}`)
    }

    return result
  } catch (error: any) {
    throw new Error(`Failed to execute kraken command: ${error.message}`)
  }
}

/**
 * Get current ticker info for BTCUSD.
 * Pair-agnostic parsing using Object.values(result)[0].
 */
export async function getTicker() {
  const result = await krakenExec('ticker BTCUSD')
  const pairData: any = Object.values(result)[0]
  // 'a' is for ask price, 'b' is for bid. We'll use the last trade closed 'c'[0] or mid price.
  // Using last trade price for simplicity: c[0]
  const price = parseFloat(pairData.c[0])
  return { price }
}

/**
 * Get last 10 hourly OHLC candles.
 */
export async function getOHLC() {
  const result = await krakenExec('ohlc BTCUSD --interval 60')
  const pairData: any = Object.values(result)[0]
  // Kraken OHLC returns a large array of candles [time, open, high, low, close, vwap, volume, count]
  // We take the last 10 candles.
  const last10 = pairData.slice(-10).map((c: any) => ({
    time: c[0],
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    vwap: parseFloat(c[5]),
    volume: parseFloat(c[6]),
    count: c[7]
  }))
  return last10
}

/**
 * Get paper trading account status.
 */
export async function getPaperStatus() {
  const result = await krakenExec('paper status')
  return {
    current_value: parseFloat(result.current_value),
    unrealized_pnl: parseFloat(result.unrealized_pnl),
    total_trades: parseInt(result.total_trades)
  }
}

/**
 * Place a paper buy order.
 */
export async function paperBuy(volume: number) {
  return await krakenExec(`paper buy BTCUSD ${volume}`)
}

/**
 * Place a paper sell order.
 */
export async function paperSell(volume: number) {
  return await krakenExec(`paper sell BTCUSD ${volume}`)
}

/**
 * Initialize paper trading account.
 */
export async function initPaper() {
  return await krakenExec('paper init --balance 10000')
}
