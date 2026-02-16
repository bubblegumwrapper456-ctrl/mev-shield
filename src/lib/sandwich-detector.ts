import { SwapTransaction, SandwichAttack } from './types';
import { KNOWN_SANDWICH_BOTS } from './constants';
import { calculateLoss } from './loss-calculator';

const HELIUS_API_KEY = process.env.SOLANA_RPC_URL?.match(/api-key=([^&]+)/)?.[1] || '';
const HELIUS_ENHANCED_URL = `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;
const HELIUS_BATCH_SIZE = 100;
const MAX_SLOT_CHECKS = 15;
const SANDWICH_WINDOW = 500; // Max tx distance for wide sandwich detection

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error instanceof Error && (
        error.message.includes('429') || error.message.includes('Too Many')
      );
      if (!isRateLimit || attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt + 1) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Core sandwich detection: for each slot where the victim swapped,
 * fetch all block transactions via Helius Enhanced API and scan for
 * buy-before / sell-after patterns on the same token.
 */
export async function detectSandwiches(
  victimWallet: string,
  victimSwaps: SwapTransaction[],
  solPriceUSD: number
): Promise<SandwichAttack[]> {
  const attacks: SandwichAttack[] = [];
  const processedSlots = new Set<number>();

  const slotsToCheck: { slot: number; swaps: SwapTransaction[] }[] = [];
  for (const victimSwap of victimSwaps) {
    if (slotsToCheck.length >= MAX_SLOT_CHECKS) break;
    if (processedSlots.has(victimSwap.slot)) {
      const existing = slotsToCheck.find(s => s.slot === victimSwap.slot);
      if (existing) existing.swaps.push(victimSwap);
      continue;
    }
    processedSlots.add(victimSwap.slot);
    slotsToCheck.push({ slot: victimSwap.slot, swaps: [victimSwap] });
  }

  const BATCH_SIZE = 2;
  for (let i = 0; i < slotsToCheck.length; i += BATCH_SIZE) {
    const batch = slotsToCheck.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async ({ slot, swaps }) => {
        const victimSigs = swaps.map(s => s.signature);
        const allBlockSwaps = await getBlockSwaps(slot, victimSigs);
        if (allBlockSwaps.length === 0) return [];

        allBlockSwaps.sort((a, b) => a.slotIndex - b.slotIndex);
        return findSandwichPatterns(victimWallet, allBlockSwaps, solPriceUSD);
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        attacks.push(...result.value);
      }
    }
  }

  return attacks;
}

/**
 * Two-step block analysis using Helius:
 * 1. getBlock(transactionDetails: 'signatures') - ~0.2s for ordered sig list
 * 2. Helius Enhanced /v0/transactions/ - batch parse, ~1s per 100
 *
 * Only parses a ±500 tx window around the victim to minimize API calls.
 */
async function getBlockSwaps(
  slot: number,
  victimSigs?: string[]
): Promise<SwapTransaction[]> {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || '';
    const blockResp = await retryWithBackoff(async () => {
      const r = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBlock',
          params: [slot, {
            maxSupportedTransactionVersion: 0,
            transactionDetails: 'signatures',
            rewards: false,
          }],
        }),
      });
      const data = await r.json() as { result?: { signatures?: string[] }; error?: { message: string } };
      if (data.error) throw new Error(data.error.message);
      return data.result;
    });

    const allSigs = blockResp?.signatures;
    if (!allSigs || allSigs.length === 0) return [];

    // Focus on a window around the victim's position
    let startIdx = 0;
    let endIdx = allSigs.length;

    if (victimSigs && victimSigs.length > 0) {
      const victimIndices = victimSigs
        .map(vs => allSigs.indexOf(vs))
        .filter(i => i >= 0);

      if (victimIndices.length > 0) {
        startIdx = Math.max(0, Math.min(...victimIndices) - SANDWICH_WINDOW);
        endIdx = Math.min(allSigs.length, Math.max(...victimIndices) + SANDWICH_WINDOW);
      }
    }

    const windowSigs = allSigs.slice(startIdx, endIdx);
    const swaps: SwapTransaction[] = [];

    for (let i = 0; i < windowSigs.length; i += HELIUS_BATCH_SIZE) {
      const batch = windowSigs.slice(i, i + HELIUS_BATCH_SIZE);

      try {
        const parsed = await fetchHeliusEnhanced(batch);
        for (let j = 0; j < parsed.length; j++) {
          if (parsed[j].type !== 'SWAP') continue;
          const swap = parseHeliusSwap(parsed[j], slot, startIdx + i + j);
          if (swap) swaps.push(swap);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429')) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            const parsed = await fetchHeliusEnhanced(batch);
            for (let j = 0; j < parsed.length; j++) {
              if (parsed[j].type !== 'SWAP') continue;
              const swap = parseHeliusSwap(parsed[j], slot, startIdx + i + j);
              if (swap) swaps.push(swap);
            }
          } catch { /* skip batch */ }
        }
      }

      if (i + HELIUS_BATCH_SIZE < windowSigs.length) {
        await new Promise(r => setTimeout(r, 120));
      }
    }

    return swaps;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('not available') && !msg.includes('was skipped')) {
      console.error(`[Sandwich] getBlock failed for slot ${slot}: ${msg.slice(0, 100)}`);
    }
    return [];
  }
}

// --- Helius Enhanced API types ---

interface HeliusEnhancedTx {
  signature: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  slot: number;
  timestamp: number;
  tokenTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
  }>;
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      userAccount: string;
      tokenAccount: string;
      mint: string;
      rawTokenAmount: { tokenAmount: string; decimals: number };
    }>;
  }>;
  events: Record<string, unknown>;
}

async function fetchHeliusEnhanced(signatures: string[]): Promise<HeliusEnhancedTx[]> {
  return retryWithBackoff(async () => {
    const r = await fetch(HELIUS_ENHANCED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: signatures }),
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json() as Promise<HeliusEnhancedTx[]>;
  });
}

function parseHeliusSwap(
  tx: HeliusEnhancedTx,
  slot: number,
  txIndex: number
): SwapTransaction | null {
  const signer = tx.feePayer;
  const solMint = 'So11111111111111111111111111111111111111112';

  const signerAccount = tx.accountData.find(a => a.account === signer);
  const signerChanges = signerAccount?.tokenBalanceChanges || [];
  const nativeChange = signerAccount?.nativeBalanceChange || 0;

  const nonSolChanges: { mint: string; change: number }[] = [];

  for (const tbc of signerChanges) {
    const amount = Number(tbc.rawTokenAmount.tokenAmount);
    if (amount !== 0 && tbc.mint !== solMint) {
      nonSolChanges.push({ mint: tbc.mint, change: amount });
    }
  }

  // Fallback: infer from tokenTransfers if no balance changes on signer
  if (nonSolChanges.length === 0) {
    const received = new Map<string, number>();
    const sent = new Map<string, number>();
    for (const tt of tx.tokenTransfers) {
      if (tt.mint === solMint) continue;
      if (tt.toUserAccount === signer) {
        received.set(tt.mint, (received.get(tt.mint) || 0) + tt.tokenAmount);
      }
      if (tt.fromUserAccount === signer) {
        sent.set(tt.mint, (sent.get(tt.mint) || 0) + tt.tokenAmount);
      }
    }
    for (const [mint, amount] of received) {
      const net = amount - (sent.get(mint) || 0);
      if (net !== 0) nonSolChanges.push({ mint, change: net });
    }
    for (const [mint, amount] of sent) {
      if (!received.has(mint)) nonSolChanges.push({ mint, change: -amount });
    }
  }

  if (nonSolChanges.length === 0) return null;

  const primaryToken = nonSolChanges.reduce((max, c) =>
    Math.abs(c.change) > Math.abs(max.change) ? c : max
  );

  const tokenMint = primaryToken.mint;
  let direction: 'buy' | 'sell';
  let amountIn: bigint;
  let amountOut: bigint;

  if (primaryToken.change > 0) {
    direction = 'buy';
    amountOut = BigInt(Math.round(primaryToken.change));
    const spent = nonSolChanges.find(c => c.change < 0);
    amountIn = spent
      ? BigInt(Math.round(Math.abs(spent.change)))
      : BigInt(Math.abs(Math.min(nativeChange, 0)));
  } else {
    direction = 'sell';
    amountIn = BigInt(Math.round(Math.abs(primaryToken.change)));
    const gained = nonSolChanges.find(c => c.change > 0 && c.mint !== primaryToken.mint);
    amountOut = gained
      ? BigInt(Math.round(gained.change))
      : BigInt(Math.max(nativeChange, 0));
  }

  return {
    signature: tx.signature,
    slot,
    slotIndex: txIndex,
    pool: `slot-${slot}`,
    tokenMint,
    tokenSymbol: undefined,
    direction,
    amountIn,
    amountOut,
    signer,
    timestamp: tx.timestamp || Math.floor(Date.now() / 1000),
    dex: tx.source || 'Unknown',
  };
}

// --- Sandwich pattern detection ---

/**
 * Detect sandwich patterns: for each victim swap, find buy-before and
 * sell-after of the same token. Supports both classic (same signer)
 * and wide (different signers, >90% of Solana sandwiches per DevConnect research).
 */
function findSandwichPatterns(
  victimWallet: string,
  swaps: SwapTransaction[],
  solPriceUSD: number
): SandwichAttack[] {
  const attacks: SandwichAttack[] = [];
  const usedSigs = new Set<string>();

  const victimSwaps = swaps.filter(s => s.signer === victimWallet);
  const otherSwaps = swaps.filter(s => s.signer !== victimWallet);

  for (const victimSwap of victimSwaps) {
    const token = victimSwap.tokenMint;
    const vi = victimSwap.slotIndex;

    const buysBefore = otherSwaps.filter(
      s => s.tokenMint === token && s.direction === 'buy' && s.slotIndex < vi && !usedSigs.has(s.signature)
    );
    const sellsAfter = otherSwaps.filter(
      s => s.tokenMint === token && s.direction === 'sell' && s.slotIndex > vi && !usedSigs.has(s.signature)
    );

    if (buysBefore.length === 0 || sellsAfter.length === 0) continue;

    // Classic sandwich: same signer for frontrun and backrun
    let frontrun: SwapTransaction | null = null;
    let backrun: SwapTransaction | null = null;

    for (const buy of buysBefore) {
      const matchingSell = sellsAfter.find(s => s.signer === buy.signer);
      if (matchingSell) {
        frontrun = buy;
        backrun = matchingSell;
        break;
      }
    }

    // Wide sandwich: closest buy before + closest sell after (different signers OK)
    if (!frontrun || !backrun) {
      const closestBuy = buysBefore.reduce((closest, b) =>
        (vi - b.slotIndex) < (vi - closest.slotIndex) ? b : closest
      );
      const closestSell = sellsAfter.reduce((closest, s) =>
        (s.slotIndex - vi) < (closest.slotIndex - vi) ? s : closest
      );

      const buyDistance = vi - closestBuy.slotIndex;
      const sellDistance = closestSell.slotIndex - vi;

      if (buyDistance > 0 && buyDistance <= SANDWICH_WINDOW && sellDistance > 0 && sellDistance <= SANDWICH_WINDOW) {
        frontrun = closestBuy;
        backrun = closestSell;
      }
    }

    if (!frontrun || !backrun) continue;

    usedSigs.add(frontrun.signature);
    usedSigs.add(backrun.signature);

    const loss = calculateLoss(frontrun, victimSwap, backrun, solPriceUSD);
    const attackerWallet = frontrun.signer === backrun.signer
      ? frontrun.signer
      : `${frontrun.signer.slice(0, 8)}...+${backrun.signer.slice(0, 8)}...`;

    attacks.push({
      id: `${frontrun.signature.slice(0, 16)}-${victimSwap.signature.slice(0, 16)}-${backrun.signature.slice(0, 16)}`,
      victimWallet,
      attackerWallet,
      slot: victimSwap.slot,
      pool: victimSwap.pool,
      tokenMint: token,
      tokenSymbol: victimSwap.tokenSymbol || frontrun.tokenSymbol,
      victimTx: victimSwap,
      frontrunTx: frontrun,
      backrunTx: backrun,
      lossLamports: loss.lossLamports,
      lossUSD: loss.lossUSD,
      botProfitLamports: loss.botProfitLamports,
      dex: victimSwap.dex || frontrun.dex,
      detectedAt: new Date(),
    });
  }

  return attacks;
}

// --- Mock data for development ---

export function detectSandwichesMock(wallet: string): SandwichAttack[] {
  const now = Date.now();
  const day = 86400000;
  const botAddresses = Object.keys(KNOWN_SANDWICH_BOTS);
  const tokens = [
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK' },
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP' },
    { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
    { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH' },
    { mint: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p91oHPk', symbol: 'WEN' },
  ];
  const dexes = ['Raydium', 'Orca', 'Meteora', 'pump.fun'];
  const seed = wallet.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const attackCount = 5 + (seed % 20);
  const attacks: SandwichAttack[] = [];

  for (let i = 0; i < attackCount; i++) {
    const token = tokens[(seed + i) % tokens.length];
    const dex = dexes[(seed + i) % dexes.length];
    const bot = botAddresses[(seed + i) % botAddresses.length];
    const slot = 250000000 + seed + i * 1000;
    const timestamp = now - (i * day * 3 + (seed % day));
    const lossLamports = BigInt(Math.floor(50000000 + (((seed * (i + 1)) % 1000) * 1000000)));
    const botProfit = BigInt(Math.floor(Number(lossLamports) * 0.7));

    const baseTx: SwapTransaction = {
      signature: generateMockSig(seed, i, 0),
      slot, slotIndex: i * 3, pool: generateMockAddress(seed + i),
      tokenMint: token.mint, tokenSymbol: token.symbol, direction: 'buy',
      amountIn: lossLamports * BigInt(2), amountOut: lossLamports * BigInt(3),
      signer: bot, timestamp: Math.floor(timestamp / 1000), dex,
    };

    attacks.push({
      id: `mock-${i}-${seed}`, victimWallet: wallet, attackerWallet: bot,
      slot, pool: baseTx.pool, tokenMint: token.mint, tokenSymbol: token.symbol,
      victimTx: { ...baseTx, signature: generateMockSig(seed, i, 1), slotIndex: i * 3 + 1, signer: wallet },
      frontrunTx: baseTx,
      backrunTx: { ...baseTx, signature: generateMockSig(seed, i, 2), slotIndex: i * 3 + 2, direction: 'sell', signer: bot },
      lossLamports, lossUSD: Number(lossLamports) / 1e9 * 150, botProfitLamports: botProfit,
      dex, detectedAt: new Date(timestamp),
    });
  }

  return attacks.sort((a, b) => b.slot - a.slot);
}

function generateMockSig(seed: number, i: number, j: number): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '', s = seed * 31 + i * 17 + j * 7;
  for (let k = 0; k < 88; k++) { s = (s * 1103515245 + 12345) & 0x7fffffff; sig += chars[s % chars.length]; }
  return sig;
}

function generateMockAddress(seed: number): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = '', s = seed * 37;
  for (let k = 0; k < 44; k++) { s = (s * 1103515245 + 12345) & 0x7fffffff; addr += chars[s % chars.length]; }
  return addr;
}
