import { SwapTransaction, SandwichAttack, WalletReport } from './types';
import { LAMPORTS_PER_SOL, KNOWN_SANDWICH_BOTS } from './constants';

interface LossResult {
  lossLamports: bigint;
  lossUSD: number;
  botProfitLamports: bigint;
}

/**
 * Calculate user loss from a sandwich attack.
 * MVP Method: Use bot profit as proxy for user loss.
 * Bot profit = backrun output - frontrun input - fees
 * User loss ≈ bot profit (conservative estimate; actual loss is often higher)
 */
export function calculateLoss(
  frontrun: SwapTransaction,
  _victim: SwapTransaction,
  backrun: SwapTransaction,
  solPriceUSD: number
): LossResult {
  // Bot profit in the quote token (usually SOL)
  // frontrun: bot buys token (amountIn = SOL spent)
  // backrun: bot sells token (amountOut = SOL received)
  const botProfitLamports = backrun.amountOut - frontrun.amountIn;

  // Ensure non-negative (data quality check)
  const safeBotProfit = botProfitLamports > BigInt(0) ? botProfitLamports : BigInt(0);

  // User loss is approximately equal to bot profit for MVP
  const lossLamports = safeBotProfit;
  const lossUSD = (Number(lossLamports) / LAMPORTS_PER_SOL) * solPriceUSD;

  return {
    lossLamports,
    lossUSD,
    botProfitLamports: safeBotProfit,
  };
}

/**
 * Aggregate individual attacks into a wallet report.
 */
export function aggregateReport(
  wallet: string,
  attacks: SandwichAttack[],
  solPriceUSD: number
): WalletReport {
  const totalLossLamports = attacks.reduce((sum, a) => sum + a.lossLamports, BigInt(0));
  const totalLossSOL = Number(totalLossLamports) / LAMPORTS_PER_SOL;
  const totalLossUSD = totalLossSOL * solPriceUSD;

  // Worst attack
  const worstAttack = attacks.length > 0
    ? attacks.reduce((worst, a) => a.lossUSD > worst.lossUSD ? a : worst)
    : null;

  // Most targeted token
  const tokenCounts = new Map<string, { mint: string; symbol?: string; count: number; lossUSD: number }>();
  for (const attack of attacks) {
    const existing = tokenCounts.get(attack.tokenMint) || {
      mint: attack.tokenMint,
      symbol: attack.tokenSymbol,
      count: 0,
      lossUSD: 0,
    };
    existing.count++;
    existing.lossUSD += attack.lossUSD;
    tokenCounts.set(attack.tokenMint, existing);
  }
  const mostTargetedToken = tokenCounts.size > 0
    ? [...tokenCounts.values()].sort((a, b) => b.count - a.count)[0]
    : null;

  // Most active attacker
  const attackerCounts = new Map<string, { wallet: string; count: number; totalProfitUSD: number }>();
  for (const attack of attacks) {
    const existing = attackerCounts.get(attack.attackerWallet) || {
      wallet: attack.attackerWallet,
      count: 0,
      totalProfitUSD: 0,
    };
    existing.count++;
    existing.totalProfitUSD += (Number(attack.botProfitLamports) / LAMPORTS_PER_SOL) * solPriceUSD;
    attackerCounts.set(attack.attackerWallet, existing);
  }
  const attackersList = [...attackerCounts.values()].sort((a, b) => b.count - a.count);
  const mostActiveAttacker = attackersList.length > 0 ? attackersList[0] : null;

  // Attacks by DEX
  const attacksByDex: Record<string, { count: number; lossUSD: number }> = {};
  for (const attack of attacks) {
    if (!attacksByDex[attack.dex]) attacksByDex[attack.dex] = { count: 0, lossUSD: 0 };
    attacksByDex[attack.dex].count++;
    attacksByDex[attack.dex].lossUSD += attack.lossUSD;
  }

  // Attacks by week
  const weekMap = new Map<string, { week: string; count: number; lossUSD: number }>();
  for (const attack of attacks) {
    const date = new Date(attack.victimTx.timestamp * 1000);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().slice(0, 10);
    const existing = weekMap.get(weekKey) || { week: weekKey, count: 0, lossUSD: 0 };
    existing.count++;
    existing.lossUSD += attack.lossUSD;
    weekMap.set(weekKey, existing);
  }
  const attacksByWeek = [...weekMap.values()].sort((a, b) => a.week.localeCompare(b.week));

  // Attacks by token
  const attacksByToken = [...tokenCounts.values()].sort((a, b) => b.lossUSD - a.lossUSD).map(t => ({
    token: t.mint,
    symbol: t.symbol,
    count: t.count,
    lossUSD: t.lossUSD,
  }));

  // Top attackers
  const topAttackers = attackersList.slice(0, 5).map(a => ({
    ...a,
    knownAlias: KNOWN_SANDWICH_BOTS[a.wallet],
  }));

  // Time range
  const timestamps = attacks.map(a => a.victimTx.timestamp);
  const timeRange = attacks.length > 0
    ? { from: Math.min(...timestamps), to: Math.max(...timestamps) }
    : { from: Math.floor(Date.now() / 1000) - 90 * 86400, to: Math.floor(Date.now() / 1000) };

  return {
    wallet,
    attackCount: attacks.length,
    totalLossLamports,
    totalLossSOL,
    totalLossUSD,
    worstAttack,
    mostTargetedToken,
    mostActiveAttacker,
    attacksByDex,
    attacksByWeek,
    attacksByToken,
    topAttackers,
    attacks,
    timeRange,
    analyzedAt: new Date(),
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
