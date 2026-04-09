import { ethers } from 'ethers'
import dotenv from 'dotenv'
import { ConvexHttpClient } from "convex/browser"

dotenv.config()

// Hardcoded Addresses for ERC-8004 Challenge
const AGENT_REGISTRY_ADDRESS = "0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3"
const HACKATHON_VAULT_ADDRESS = "0x0E7CD8ef9743FEcf94f9103033a044caBD45fC90"
const RISK_ROUTER_ADDRESS = "0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC"
const REPUTATION_REGISTRY_ADDRESS = "0x423a9904e39537a9997fbaF0f220d79D7d545763"

const CHAIN_ID = 11155111 // Sepolia

const CONVEX_URL = (process.env.CONVEX_URL || "").replace(/\/$/, '')
const client = new ConvexHttpClient(CONVEX_URL)

// EIP-712 Domain for RiskRouter (TradeIntents)
const DOMAIN = {
  name: 'RiskRouter',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: RISK_ROUTER_ADDRESS
}

// EIP-712 Types for TradeIntent
const TRADE_INTENT_TYPES = {
  TradeIntent: [
    { name: 'agentId',          type: 'uint256' },
    { name: 'agentWallet',      type: 'address' },
    { name: 'pair',             type: 'string'  },
    { name: 'action',           type: 'string'  },
    { name: 'amountUsdScaled',  type: 'uint256' },
    { name: 'maxSlippageBps',   type: 'uint256' },
    { name: 'nonce',            type: 'uint256' },
    { name: 'deadline',         type: 'uint256' },
  ],
}

const HEARTBEAT_TYPES = {
  Heartbeat: [
    { name: 'agentId',   type: 'uint256' },
    { name: 'action',    type: 'string'  },
    { name: 'reason',    type: 'string'  },
    { name: 'timestamp', type: 'uint256' },
  ],
}

// EIP-712 Domain for AgentRegistry (Checkpoints)
const AGENT_REGISTRY_DOMAIN = {
  name: "AITradingAgent",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: AGENT_REGISTRY_ADDRESS
}

// Minimal ABIs
const AGENT_REGISTRY_ABI = [
  "function register(address agentWallet, string name, string description, string[] capabilities, string agentURI) external returns (uint256 agentId)",
  "function isRegistered(uint256 agentId) external view returns (bool)",
  "event AgentRegistered(uint256 indexed agentId, address indexed operatorWallet, address indexed agentWallet, string name)"
]

const VAULT_ABI = [
  "function claimAllocation(uint256 agentId) external",
  "function hasClaimed(uint256 agentId) external view returns (bool)"
]

const RISK_ROUTER_ABI = [
  "function submitTradeIntent((uint256 agentId, address agentWallet, string pair, string action, uint256 amountUsdScaled, uint256 maxSlippageBps, uint256 nonce, uint256 deadline) intent, bytes signature) external",
  "function getIntentNonce(uint256 agentId) external view returns (uint256)"
]

const REPUTATION_REGISTRY_ABI = [
  "function submitFeedback(uint256 agentId, uint8 score, bytes32 outcomeRef, string comment, uint8 feedbackType) external"
]

/**
 * Setup Ethers Provider and Wallet
 */
function getSigner() {
  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.AGENT_WALLET_KEY || process.env.OPERATOR_PRIVATE_KEY
  
  if (!rpcUrl || !privateKey) {
    return null
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    return new ethers.Wallet(privateKey, provider)
  } catch (e) {
    console.error("Failed to initialize ethers signer:", e)
    return null
  }
}

/**
 * 1. Register Agent
 */
export async function registerAgent(): Promise<string | null> {
  const signer = getSigner()
  if (!signer) {
    console.warn("ERC-8004: Missing RPC_URL or AGENT_WALLET_KEY. Skipping registration.")
    return null
  }

  // Check Convex first
  const existingId = await client.query("state:getValue" as any, { key: "erc8004AgentId" })
  if (existingId?.value) {
    console.log(`ERC-8004: Agent already registered with ID ${existingId.value}`)
    return existingId.value.toString()
  }

  console.log("ERC-8004: Registering agent on Sepolia...")
  const registry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, signer)
  
  try {
    const tx = await registry.register(
      signer.address,
      "InnovAgent",
      "Autonomous 70B Neural Trading Agent with Explainable Reasoning",
      ["trading", "eip712-signing", "bitcoin-analysis"],
      "https://github.com/arishhh/ai-trading-agents"
    )
    console.log(`ERC-8004: Registration TX Sent: ${tx.hash}`)
    const receipt = await tx.wait()
    
    // Parse AgentRegistered event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = registry.interface.parseLog(log)
        return parsed?.name === 'AgentRegistered'
      } catch { return false }
    })

    if (event) {
      const parsedLog = registry.interface.parseLog(event)
      const agentId = parsedLog?.args.agentId
      console.log(`ERC-8004: Agent Registered successfully! ID: ${agentId}`)
      
      await client.mutation("state:upsertValue" as any, { 
        key: "erc8004AgentId", 
        value: agentId.toString() 
      })
      
      return agentId.toString()
    }
  } catch (e: any) {
    if (String(e).includes("already registered") || e.message?.includes("already registered")) {
      console.log("ERC-8004: Wallet already registered on-chain. Scanning logs to recover Agent ID...")
      try {
        const eventSignature = ethers.id('AgentRegistered(uint256,address,address,string)')
        
        if (!signer.provider) throw new Error("No provider available")
        const currentBlock = await signer.provider.getBlockNumber()
        const fromBlock = Math.max(0, currentBlock - 40000) 
        
        const logs = await signer.provider.getLogs({
          address: AGENT_REGISTRY_ADDRESS,
          fromBlock: fromBlock,
          toBlock: 'latest',
          topics: [eventSignature]
        })

        let recoveredId: string | null = null;
        for (const log of logs) {
          try {
            const parsed = registry.interface.parseLog(log)
            if (parsed && parsed.args.agentWallet.toLowerCase() === signer.address.toLowerCase()) {
              recoveredId = parsed.args.agentId.toString()
              break
            }
          } catch (err) {
            // ignore unparseable logs
          }
        }

        if (recoveredId) {
          console.log(`ERC-8004: Recovered Agent ID from chain: ${recoveredId}`)
          await client.mutation("state:upsertValue" as any, { key: "erc8004AgentId", value: recoveredId })
          return recoveredId
        } else {
          console.log("ERC-8004: Could not find AgentRegistered logs for this wallet.")
        }
      } catch (err) {
        console.error("ERC-8004: Failed to recover Agent ID from logs:", err)
      }
    }
    console.error("ERC-8004: Registration failed:", e.reason || e.message || e)
  }
  return null
}

/**
 * 2. Claim Allocation
 */
export async function claimAllocation(agentId: string): Promise<boolean> {
  const signer = getSigner()
  if (!signer || !agentId) return false

  const vaultClaimed = await client.query("state:getValue" as any, { key: "vaultClaimed" })
  if (vaultClaimed?.value === true) return true

  console.log(`ERC-8004: Claiming sandbox allocation for Agent ${agentId}...`)
  const vault = new ethers.Contract(HACKATHON_VAULT_ADDRESS, VAULT_ABI, signer)
  
  try {
    const tx = await vault.claimAllocation(BigInt(agentId))
    console.log(`ERC-8004: Claim TX Sent: ${tx.hash}`)
    await tx.wait()
    
    await client.mutation("state:upsertValue" as any, { 
      key: "vaultClaimed", 
      value: true 
    })
    return true
  } catch (e) {
    console.error("ERC-8004: Claim failed:", e)
    return false
  }
}

/**
 * 3. Submit Trade Intent
 */
export async function submitTradeIntent(
  agentId: string,
  action: string,
  pair: string,
  volume: number,
  price: number
): Promise<{ hash: string, signature: string } | null> {
  const signer = getSigner()
  if (!signer || !agentId) return null

  const router = new ethers.Contract(RISK_ROUTER_ADDRESS, RISK_ROUTER_ABI, signer)
  
  try {
    const nonce = await router.getIntentNonce(BigInt(agentId))
    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour buffer

    const intent = {
      agentId: BigInt(agentId),
      agentWallet: signer.address,
      pair: pair || "XBTUSD",
      action: action.toUpperCase(),
      amountUsdScaled: BigInt(Math.floor(volume * price * 100)), // USD * 100
      maxSlippageBps: 100, // 1%
      nonce: BigInt(nonce),
      deadline: BigInt(deadline)
    }

    const signature = await signer.signTypedData(DOMAIN, TRADE_INTENT_TYPES, intent)
    const tx = await router.submitTradeIntent(intent, signature)
    console.log(`ERC-8004: Trade Intent Submitted: ${tx.hash}`)
    return { hash: tx.hash, signature }
  } catch (e) {
    console.error("ERC-8004: Trade intent submission failed:", e)
    return null
  }
}

/**
 * 5. Post Reputation Feedback
 */
export async function postReputation(
  agentId: string,
  score: number,
  outcomeData: any
): Promise<string | null> {
  const signer = getSigner()
  if (!signer || !agentId) return null

  const registry = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, signer)
  
  try {
    // Generate an outcome reference hash
    const outcomeRef = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
      timestamp: Date.now(),
      action: outcomeData.action,
      pnl: outcomeData.pnlSnapshot,
      executed: outcomeData.executed
    })))

    // Feedback type 0: Performance, 1: Accuracy, etc. (Default to 0)
    const feedbackType = outcomeData.executed ? 0 : 1
    const comment = `InnovAgent trade cycle: ${outcomeData.action.toUpperCase()} | PnL: ${outcomeData.pnlSnapshot?.toFixed(2)}`

    const tx = await registry.submitFeedback(
      BigInt(agentId),
      Math.min(100, Math.max(0, Math.floor(score * 100))),
      outcomeRef,
      comment.slice(0, 200),
      feedbackType
    )
    
    console.log(`ERC-8004: Reputation Posted: ${tx.hash}`)
    return tx.hash
  } catch (e: any) {
    if (e.message?.includes("operator cannot self-rate")) {
      console.log("ERC-8004: Skipping self-rating (reputation managed by external validator)")
      return "0x_SELF_RATE_SKIPPED"
    }
    if (e.message?.includes("already rated this agent")) {
      console.log(`ERC-8004: Already rated agent ${agentId} this epoch — skipping duplicate.`)
      return "0x_ALREADY_RATED"
    }
    console.error("ERC-8004: Reputation feedback failed:", e.message || e)
    return null
  }
}

/**
 * 6. Sign Heartbeat (Off-chain proof of life)
 */
export async function signHeartbeat(
  agentId: string,
  action: string,
  reason: string,
  timestamp: number
): Promise<string | null> {
  const signer = getSigner()
  if (!signer || !agentId) return null

  try {
    const heartbeat = {
      agentId: BigInt(agentId),
      action: action.toUpperCase(),
      reason: reason.slice(0, 200), // Cap length for signing
      timestamp: BigInt(timestamp)
    }

    return await signer.signTypedData(DOMAIN, HEARTBEAT_TYPES, heartbeat)
  } catch (e) {
    console.error("ERC-8004: Heartbeat signing failed:", e)
    return null
  }
}

/**
 * Get current wallet balance in ETH.
 */
export async function getWalletBalance(): Promise<string> {
  const signer = getSigner()
  if (!signer || !signer.provider) return "0"
  
  try {
    const balance = await signer.provider.getBalance(signer.address)
    return ethers.formatEther(balance)
  } catch (e) {
    console.error("Failed to get wallet balance:", e)
    return "0"
  }
}

export function getAgentAddress(): string {
  const signer = getSigner()
  return signer?.address || "0x0000000000000000000000000000000000000000"
}
