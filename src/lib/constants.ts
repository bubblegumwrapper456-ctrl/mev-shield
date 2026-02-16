// DEX Program IDs on Solana
export const DEX_PROGRAMS = {
  RAYDIUM_AMM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  RAYDIUM_CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  RAYDIUM_CP: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  METEORA_DLMM: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  METEORA_POOLS: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
  PUMP_FUN: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  JUPITER_V4: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  JUPITER_DCA: 'DCAK36VfExkPdAkYUQg6ewgxyinvcEyPLyHjRbmveKFw',
  PHOENIX: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
  LIFINITY: '2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c',
  OPENBOOK: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
  // MEV/router programs that wrap DEX swaps
  MEV_ROUTER_1: 'MEViEnscUm6tsQRoGd9h6nLQaQspKj7DB2M5FwM3Xvz',
} as const;

export const DEX_NAMES: Record<string, string> = {
  [DEX_PROGRAMS.RAYDIUM_AMM]: 'Raydium',
  [DEX_PROGRAMS.RAYDIUM_CLMM]: 'Raydium CLMM',
  [DEX_PROGRAMS.RAYDIUM_CP]: 'Raydium CP',
  [DEX_PROGRAMS.ORCA_WHIRLPOOL]: 'Orca',
  [DEX_PROGRAMS.METEORA_DLMM]: 'Meteora',
  [DEX_PROGRAMS.METEORA_POOLS]: 'Meteora',
  [DEX_PROGRAMS.PUMP_FUN]: 'pump.fun',
  [DEX_PROGRAMS.JUPITER_V6]: 'Jupiter',
  [DEX_PROGRAMS.JUPITER_V4]: 'Jupiter',
  [DEX_PROGRAMS.JUPITER_DCA]: 'Jupiter DCA',
  [DEX_PROGRAMS.PHOENIX]: 'Phoenix',
  [DEX_PROGRAMS.LIFINITY]: 'Lifinity',
  [DEX_PROGRAMS.OPENBOOK]: 'OpenBook',
  [DEX_PROGRAMS.MEV_ROUTER_1]: 'MEV Router',
};

// Known sandwich bot addresses (from public reports and on-chain analysis)
export const KNOWN_SANDWICH_BOTS: Record<string, string> = {
  'arsc4jbDnzaqcCLByyGo7fg7S2SmcFsWUzQuDtLZh2y': 'arsc',
  'JUPzBjEFSqECCsHHJgSCVFbPVzpjhBSsE1C7bAh15RK': 'jito-sandwich-1',
  'A77HErqtfN1hLFhkQJM8mLFBpJQmBqYWGTwENhSJyAYo': 'sandwich-bot-3',
  '5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h': 'sandwich-bot-4',
  '9nnLbotNTbcUCyrqE1hTnPzSJaFy1gSXJV8QfnkeLBKx': 'sandwich-bot-5',
  'HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY': 'sandwich-bot-6',
};

// Well-known token mints
export const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', decimals: 9 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', decimals: 5 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', decimals: 6 },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH (Wormhole)', decimals: 8 },
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': { symbol: 'RNDR', decimals: 8 },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', decimals: 6 },
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p91oHPk': { symbol: 'WEN', decimals: 5 },
};

export const LAMPORTS_PER_SOL = 1_000_000_000;

// Cache duration in milliseconds (1 hour)
export const CACHE_DURATION_MS = 60 * 60 * 1000;

// Analysis window (90 days)
export const ANALYSIS_WINDOW_DAYS = 90;

// Solscan base URL
export const SOLSCAN_TX_URL = 'https://solscan.io/tx/';
export const SOLSCAN_ACCOUNT_URL = 'https://solscan.io/account/';
