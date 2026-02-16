# MEV Shield - "Have I Been Sandwiched?"

A free tool that shows Solana users how much MEV bots have stolen from their wallets through sandwich attacks.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **shadcn/ui** component library
- **Recharts** for data visualization
- **Astralane Transaction Indexer** (GraphQL) for on-chain data
- **Prisma** + PostgreSQL for result caching

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client (requires DATABASE_URL)
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `ASTRALANE_API_KEY` | Astralane Transaction Indexer API key | No (uses mock data without it) |
| `SOLANA_RPC_URL` | Solana RPC endpoint | No (defaults to public RPC) |
| `DATABASE_URL` | PostgreSQL connection string | For caching only |
| `NEXT_PUBLIC_APP_URL` | Public app URL for share links | No |

## Development

The app works without any API keys using realistic mock data. Set `ASTRALANE_API_KEY` to enable real on-chain analysis.

## Architecture

- `/src/lib/sandwich-detector.ts` - Core detection algorithm
- `/src/lib/dex-parsers.ts` - Parse swaps from Raydium, Orca, Meteora, pump.fun
- `/src/lib/loss-calculator.ts` - Estimate user losses from sandwich attacks
- `/src/app/api/sandwich-check/[wallet]/route.ts` - API endpoint
- `/src/app/results/[wallet]/` - Results page with charts and attack timeline
