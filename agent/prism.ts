import dotenv from 'dotenv'

dotenv.config()

export interface PrismSignals {
  rsi: number
  volatility: number
  trend: string
}

/**
 * Fetch market signals from PRISM API.
 * Silent skip if PRISM_API_KEY is not set.
 */
export async function getSignals(): Promise<PrismSignals | null> {
  const apiKey = process.env.PRISM_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch('https://api.prismapi.ai/signals/BTC', {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      // Silent skip on API errors
      return null
    }

    const data: any = await response.json()
    return {
      rsi: data.rsi,
      volatility: data.volatility,
      trend: data.trend
    }
  } catch (error) {
    // Silent skip on network errors
    return null
  }
}
