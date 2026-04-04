# UI Design Contract: Dashboard Visualizer

## Screen Reference
- Stitch Project ID: 9496867698943067626
- Screen ID: ed78be6bf29e45be90d690a23a9809cc

## Aesthetics
- **Theme:** Dark mode ("The Obsidian Lens" via Stitch). Deep blacks (#0e0e0f background) to minimize ocular strain.
- **Glassmorphism:** Frosted glass background for data cards with subtle 1px border gradients.
- **Neon Accents:** Primary neon green (#00FF41) for BUY/Profit, primary red (#ff7351) for SELL/Loss.
- **Typography:** Space Grotesk for metrics/headers (technical feel), Inter for body text (readability). 

## Screens/Components

### 1. Header (Portfolio Top Panel)
- **Content:** Total Portfolio PnL ($), Win Rate (%), Current BTC Price ($).
- **Style:** Big, high-contrast Space Grotesk metrics. 

### 2. Decision Feed (Central Panel)
- **Role:** Autonomous Reasoning Log.
- **Content:** Scrolling list of `decisions` rows fetched from Convex. 
- **Card Format:** Action (BUY/SELL/HOLD) + Confidence Score (%) + Reasoning text. 
- **Style:** Frost-glass cards. No solid dividing lines between them, just 8px gaps. Action text colored natively to the action (`primary` for BUY).

### 3. Sidebar / Agent Control
- **Role:** Agent intervention panel.
- **Content:** Toggle switch for "Agent Status" (Pause / Resume) mapping to `state` table in Convex.
- **Style:** Sharp, precise switch echoing hardware controls.
