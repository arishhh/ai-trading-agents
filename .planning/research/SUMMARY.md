# Research Summary: KrakenAI Trader Stack

## Kraken CLI
- **Source**: [github.com/krakenfx/kraken-cli](https://github.com/krakenfx/kraken-cli)
- **Status**: AI-native, single binary (Rust), supports 130+ commands.
- **Key Commands**:
  - `kraken ticker BTCUSD -o json`: Standard market price.
  - `kraken ohlc BTCUSD -o json`: Historically fetches last N candles (default interval is 1m, can be changed with `--interval`).
  - `kraken paper buy --pair BTCUSD --type market --volume <X>`: Paper execution.
  - `kraken order buy --pair BTCUSD --type market --volume <X>`: Real order execution.
- **Installation**: `curl --proto '=https' --tlsv1.2 -LsSf https://github.com/krakenfx/kraken-cli/releases/latest/download/kraken-cli-installer.sh | sh`
- **Output**: Pure JSON via `-o json` flag.

## Railway & Vercel
- **Railway**: Ideal for the long-running Node process. The binary can be installed in the build step.
- **Vercel**: Best for Next.js dashboard. API routes will serve as the bridge to Supabase.
- **Bridging**: Supabase (PostgreSQL) is the source of truth for `decisions` and `state`.

## Supabase Schema
- **decisions table**: `id`, `timestamp`, `action`, `volume`, `price`, `reason`, `confidence`, `executed`, `kraken_response`, `pnl_snapshot`.
- **state table**: `id`, `key`, `value` (for rate limiting, paper vs live mode, etc.).

## Critical Findings
- **Shell Exec**: Node's `child_process.exec` works well. Wrapping in `util.promisify` is recommended.
- **Rate Limits**: Kraken has a sliding window for rate limits. The user's "15s delay" on error is a good heuristic.
- **Paper vs Real**: The logic must strictly check `PAPER_MODE` before executing any command to avoid accidental real orders.
