import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config()

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export interface MarketData {
  currentPrice: number
  candles: any[]
  portfolioValue: number
  unrealizedPnl: number
  totalTrades: number
  signals?: {
    rsi: number
    volatility: number
    trend: string
  } | null
}

/**
 * Send market data to Groq for a trading decision.
 * Returns a structured JSON decision.
 */
export async function makeDecision(marketData: MarketData, retryCount = 0): Promise<any> {
  const MAX_RETRIES = 3;

  try {
    const maxVolume = 200 / marketData.currentPrice;
    const prompt = `You are a strategic trend-following crypto trading agent managing a $10,000 paper portfolio. You receive BTC/USD market data every 10 minutes. Analyze the last 10 hourly OHLC candles to determine trend.
    
    You also receive RSI (above 70 = overbought, below 30 = oversold) and volatility score. Factor these into your confidence score. 

    ONLY BUY if at least 5 of the last 10 candles closed higher than they opened OR RSI is below 35 (oversold) AND you have no current BTC position. ONLY SELL if you hold BTC AND (at least 5 of the last 10 candles closed lower than they opened OR RSI is above 65). Otherwise HOLD. Never risk more than $200 per trade. The maximum allowed trade volume based on the current price is ${maxVolume}. Your volume MUST be a pre-computed decimal number (e.g., 0.00298) and NEVER a math expression. Respond ONLY with valid JSON, no markdown, no explanation, no extra text: {action: 'buy'|'sell'|'hold', volume: number, reason: string, confidence: number}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: JSON.stringify(marketData) }
      ],
      model: 'llama-3.3-70b-versatile', 
      response_format: { type: 'json_object' }
    })

    let content = chatCompletion.choices[0].message.content || '{}'
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()

    return JSON.parse(content)
  } catch (error: any) {
    if (error.status === 429 && retryCount < MAX_RETRIES) {
      const waitTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s exponential backoff
      console.warn(`Groq rate limit hit (429). Retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(res => setTimeout(res, waitTime));
      return makeDecision(marketData, retryCount + 1);
    }
    
    console.error('Groq decision failed:', error.message)
    return {
      action: 'hold',
      volume: 0,
      reason: `error: ${error.message}`,
      confidence: 0
    }
  }
}
