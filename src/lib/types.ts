export interface SwapTransaction {
  signature: string;
  slot: number;
  slotIndex: number;
  pool: string;
  tokenMint: string;
  tokenSymbol?: string;
  direction: 'buy' | 'sell';
  amountIn: bigint;
  amountOut: bigint;
  signer: string;
  timestamp: number;
  dex: string;
}

export interface SandwichAttack {
  id: string;
  victimWallet: string;
  attackerWallet: string;
  slot: number;
  pool: string;
  tokenMint: string;
  tokenSymbol?: string;
  victimTx: SwapTransaction;
  frontrunTx: SwapTransaction;
  backrunTx: SwapTransaction;
  lossLamports: bigint;
  lossUSD: number;
  botProfitLamports: bigint;
  dex: string;
  detectedAt: Date;
}

export interface WalletReport {
  wallet: string;
  attackCount: number;
  totalLossLamports: bigint;
  totalLossSOL: number;
  totalLossUSD: number;
  worstAttack: SandwichAttack | null;
  mostTargetedToken: { mint: string; symbol?: string; count: number; lossUSD: number } | null;
  mostActiveAttacker: { wallet: string; count: number; totalProfitUSD: number } | null;
  attacksByDex: Record<string, { count: number; lossUSD: number }>;
  attacksByWeek: { week: string; count: number; lossUSD: number }[];
  attacksByToken: { token: string; symbol?: string; count: number; lossUSD: number }[];
  topAttackers: { wallet: string; count: number; totalProfitUSD: number }[];
  attacks: SandwichAttack[];
  timeRange: { from: number; to: number };
  analyzedAt: Date;
}

export interface AttackerProfile {
  wallet: string;
  attackCount: number;
  totalProfitLamports: bigint;
  totalProfitUSD: number;
  activeSince?: number;
  knownAlias?: string;
}

// Serializable versions for JSON transport
export interface SandwichAttackJSON {
  id: string;
  victimWallet: string;
  attackerWallet: string;
  slot: number;
  pool: string;
  tokenMint: string;
  tokenSymbol?: string;
  victimTxSig: string;
  frontrunTxSig: string;
  backrunTxSig: string;
  lossLamports: string;
  lossUSD: number;
  botProfitLamports: string;
  dex: string;
  detectedAt: string;
  timestamp: number;
}

export interface WalletReportJSON {
  wallet: string;
  attackCount: number;
  totalLossSOL: number;
  totalLossUSD: number;
  worstAttack: SandwichAttackJSON | null;
  mostTargetedToken: { mint: string; symbol?: string; count: number; lossUSD: number } | null;
  mostActiveAttacker: { wallet: string; count: number; totalProfitUSD: number } | null;
  attacksByDex: Record<string, { count: number; lossUSD: number }>;
  attacksByWeek: { week: string; count: number; lossUSD: number }[];
  attacksByToken: { token: string; symbol?: string; count: number; lossUSD: number }[];
  topAttackers: { wallet: string; count: number; totalProfitUSD: number }[];
  attacks: SandwichAttackJSON[];
  timeRange: { from: number; to: number };
  analyzedAt: string;
}
