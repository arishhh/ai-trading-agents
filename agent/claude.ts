import Groq from "groq-sdk"
import dotenv from "dotenv"

dotenv.config()

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface MarketData {
  currentPrice: number
  candles: any[]
  portfolioValue: number
  unrealizedPnl: number
  totalTrades: number
  avgEntryPrice: number // The price we bought at
  signals?: {
    rsi: number
    volatility: number
    trend: string
  } | null
}

/**
 * Get trading decision from Claude (via Groq).
 */
export async function makeDecision(marketData: MarketData) {
  try {
    const maxVolume = 20000 / marketData.currentPrice;
    const prompt = `You are an elite institutional trend-following crypto trading agent managing a $100,000 paper portfolio. You are competing for the top of the leaderboard. Analyze the last 20 5-minute OHLC candles to determine trend (total 100 minutes).

    You also receive RSI (above 70 = overbought, below 30 = oversold) and volatility score. Factor these into your confidence score. 

    ### TRADING RULES ###
    - ONLY BUY if at least 12 of the last 20 candles were GREEN (closed higher than they opened) OR RSI is below 30 (deep oversold) AND you hold NO BTC.
    - ONLY SELL if you hold BTC AND:
        1. At least 12 of the last 20 candles were RED (closed lower than they opened).
        2. OR RSI is above 75 (extreme overbought).
        3. OR Take Profit: Current price is > 2.5% above your avgEntryPrice (Objective: $500 profit).
        4. OR Stop Loss: Current price is < 1.5% below your avgEntryPrice (Protection: $300 limit).
    
    ### EXECUTION ###
    - Maximize leaderboard impact. Never risk more than $20,000 per trade. 
    - The maximum allowed trade volume based on the current price is ${maxVolume}. 
    - Your volume MUST be a pre-computed decimal number (e.g., 0.285).
    - Be decisive. Do not default to HOLD if a trend reversal or profit target is hit.

    Respond ONLY with valid JSON: {action: 'buy'|'sell'|'hold', volume: number, reason: string, confidence: number}`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Current Price: $${marketData.currentPrice.toFixed(2)}, avgEntryPrice: $${marketData.avgEntryPrice.toFixed(2)}, portfolioValue: $${marketData.portfolioValue.toFixed(2)}, unrealizedPnl: $${marketData.unrealizedPnl.toFixed(2)}, totalTrades: ${marketData.totalTrades}, Signals: ${JSON.stringify(marketData.signals)}, OHLC: ${JSON.stringify(marketData.candles)}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const content = chatCompletion.choices[0]?.message?.content
    if (!content) throw new Error("Empty response from AI")
    
    return JSON.parse(content)
  } catch (error) {
    console.error("AI Decision Error:", error)
    return { action: "hold", volume: 0, reason: "ai error", confidence: 0 }
  }
}
