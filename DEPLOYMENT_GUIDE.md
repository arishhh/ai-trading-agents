# Deployment Guide: KrakenAI Full Stack
This guide explains how to deploy the KrakenAI project so it runs 24/7 in production.

> [!IMPORTANT]
> A trading agent is a **continuous loop**, which is not supported by Vercel's serverless model.
> **The Strategy**: Deploy the **Dashboard** to Vercel and the **Trading Agent** to Railway.

---

## 🏗️ 1. Backend: Convex (Pre-requisite)
Your database and reactive logic must be pushed to a production Convex instance first.
1.  Run `npx convex deploy` in the root folder.
2.  Go to the [Convex Dashboard](https://dashboard.convex.dev).
3.  Copy your **Production Deployment URL** (e.g., `https://...convex.cloud`).

---

## 🖥️ 2. Frontend: Vercel (The Dashboard)
Deploy the Next.js visual interface.

1.  **Project Root**: When importing to Vercel, set the **Root Directory** to `dashboard`.
2.  **Environment Variables**: Add the following:
    *   `NEXT_PUBLIC_CONVEX_URL`: (Your Production Convex URL from Step 1).
3.  **Deploy**: Vercel will build and serve your terminal interface at a public URL.

---

## 🤖 3. The Agent: Railway (The Trading Loop)
Railway is ideal for background processes like trading loops.

1.  **Connect Repo**: Import your entire `ai-trading-agents` repository.
2.  **Settings**:
    *   **Root Directory**: `/` (Leave as root).
    *   **Start Command**: `npm run agent` (This runs the continuous 5-minute loop).
3.  **Environment Variables**: Add the following to Railway:
    *   `GROQ_API_KEY`: Your Groq token.
    *   `CONVEX_URL`: Your Production Convex URL.
    *   `PAPER_MODE`: `true` (Always start in paper mode first!).
    *   `LOOP_INTERVAL_MS`: `300000` (5 minutes).

---

## 🔗 4. How They Stay Connected
Because both your **Vercel Dashboard** and **Railway Agent** use the *same* **Convex URL**, they stay in perfect sync:
*   The **Agent** on Railway writes decisions to Convex.
*   The **Dashboard** on Vercel immediately renders those decisions for you to see.
*   If you click **Pause** on Vercel, the **Agent** on Railway will see the state change in Convex and stop trading instantly.

---

## 🛠️ Summary Checklist
| Service | Role | Key Setting |
| :--- | :--- | :--- |
| **Vercel** | Dashboard | Root Dir: `dashboard` |
| **Railway** | Agent Loop | Start Cmd: `npm run agent` |
| **Convex** | Real-time DB | Run `npx convex deploy` |
