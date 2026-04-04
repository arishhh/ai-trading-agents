import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

/**
 * ERC-8004: Trade Intent Signing
 * Signs a trade decision using EIP-712 typed data structure to produce a verifiable
 * on-chain-compatible signature from the autonomous agent's identity key.
 */

// Agent signer wallet — uses env var or falls back to a deterministic demo key
const AGENT_PRIVATE_KEY =
  process.env.AGENT_PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' // Hardhat account #0 — demo only

const wallet = new ethers.Wallet(AGENT_PRIVATE_KEY)

// EIP-712 Domain
const DOMAIN = {
  name: 'KrakenAI Agent',
  version: '1',
  chainId: 1, // Ethereum mainnet chainId for canonical typing
}

// EIP-712 Types
const TRADE_INTENT_TYPES = {
  TradeIntent: [
    { name: 'action',     type: 'string'  },
    { name: 'volume',     type: 'string'  }, // String to avoid float precision issues
    { name: 'price',      type: 'string'  },
    { name: 'confidence', type: 'string'  },
    { name: 'timestamp',  type: 'uint256' },
  ],
}

export interface TradeIntent {
  action:     string
  volume:     number
  price:      number
  confidence: number
  timestamp:  number
}

/**
 * Signs a trade intent using EIP-712 structured signing.
 * Returns a 0x-prefixed hex signature string (65-byte secp256k1 ECDSA sig).
 */
export async function signTradeIntent(intent: TradeIntent): Promise<string> {
  const value = {
    action:     intent.action,
    volume:     intent.volume.toFixed(8),
    price:      intent.price.toFixed(2),
    confidence: intent.confidence.toFixed(4),
    timestamp:  BigInt(intent.timestamp),
  }

  const signature = await wallet.signTypedData(DOMAIN, TRADE_INTENT_TYPES, value)
  return signature // e.g. "0xabc123...1b"
}

/** Returns the agent wallet address (for logging / verification). */
export function getAgentAddress(): string {
  return wallet.address
}
