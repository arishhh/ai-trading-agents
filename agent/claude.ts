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
}

/**
 * Send market data to Groq for a trading decision.
 * Returns a structured JSON decision.
 */
export async function makeDecision(marketData: MarketData) {
  try {
    const prompt = `You are a conservative trend-following crypto trading agent managing a $10,000 paper portfolio. You receive BTC/USD market data every 5 minutes. Analyze the last 10 hourly OHLC candles to determine trend. ONLY BUY if at least 6 of the last 10 candles closed higher than they opened AND you have no current BTC position. ONLY SELL if you hold BTC AND at least 6 of the last 10 candles closed lower than they opened. Otherwise HOLD. Never risk more than $200 per trade. Respond ONLY with valid JSON, no markdown, no explanation, no extra text: {action: 'buy'|'sell'|'hold', volume: number, reason: string, confidence: number}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: JSON.stringify(marketData) }
      ],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' }
    })

    let content = chatCompletion.choices[0].message.content || '{}'
    
    // Strip markdown fences if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()

    return JSON.parse(content)
  } catch (error: any) {
    console.error('Groq decision failed:', error.message)
    return {
      action: 'hold',
      volume: 0,
      reason: `parse error: ${error.message}`,
      confidence: 0
    }
  }
}
