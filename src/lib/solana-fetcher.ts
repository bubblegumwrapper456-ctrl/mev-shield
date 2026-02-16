import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  ConfirmedSignatureInfo,
} from '@solana/web3.js';
import { getConnection } from './solana';
import { SwapTransaction } from './types';
import { DEX_PROGRAMS, DEX_NAMES, KNOWN_TOKENS, ANALYSIS_WINDOW_DAYS } from './constants';

const DEX_PROGRAM_IDS: Set<string> = new Set(Object.values(DEX_PROGRAMS));

// Programs that are definitely NOT swaps (system, token, compute budget, etc.)
const SYSTEM_PROGRAMS = new Set([
  '11111111111111111111111111111111',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  'ComputeBudget111111111111111111111111111111',
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  'Memo1UhkJBfCR6MNB3fhkQLbbp5Z9QpKET4gGJQzPDB',
]);

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error instanceof Error && error.message.includes('429');
      if (!isRateLimit || attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt + 1) * 1000;
      console.log(`[RPC] Rate limited, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Fetch recent swap transactions for a wallet using Solana RPC.
 * Uses balance-change-based detection: any tx with opposing token changes is a swap.
 */
export async function fetchWalletSwapsViaRPC(wallet: string): Promise<SwapTransaction[]> {
  const conn = getConnection();
  const pubkey = new PublicKey(wallet);
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (ANALYSIS_WINDOW_DAYS * 24 * 60 * 60);

  const signatures = await fetchSignatures(conn, pubkey, cutoffTimestamp);
  console.log(`[RPC] Found ${signatures.length} signatures for ${wallet}`);

  if (signatures.length === 0) return [];

  const MAX_SIGS = 80;
  const limitedSigs = signatures.slice(0, MAX_SIGS);
  if (signatures.length > MAX_SIGS) {
    console.log(`[RPC] Limiting analysis to most recent ${MAX_SIGS} of ${signatures.length} transactions`);
  }

  const swaps: SwapTransaction[] = [];
  const txs = await fetchParsedTransactions(conn, limitedSigs.map(s => s.signature));

  for (let j = 0; j < txs.length; j++) {
    const tx = txs[j];
    if (!tx || tx.meta?.err) continue;

    const swap = parseSwapFromParsedTx(tx, limitedSigs[j]);
    if (swap) swaps.push(swap);
  }

  console.log(`[RPC] Parsed ${swaps.length} swaps from ${limitedSigs.length} transactions`);
  return swaps;
}

/**
 * Fetch all transactions in a specific slot that touch a pool address.
 * Uses the victim's signature as an anchor to search around the right slot,
 * since getSignaturesForAddress only returns the most recent by default.
 */
export async function fetchSlotSwapsForPool(
  pool: string,
  slot: number,
  knownSigs: Set<string>,
  victimSignature?: string
): Promise<SwapTransaction[]> {
  const conn = getConnection();

  try {
    const poolPubkey = new PublicKey(pool);

    // Search backwards from just after the victim's transaction
    // This ensures we find transactions in the same slot, not just the latest ones
    const searchOptions: { limit: number; before?: string; until?: string } = { limit: 100 };
    if (victimSignature) {
      // Start from the victim's signature and look before it (frontrun candidates)
      // Also look after it (backrun candidates) in a second query
      searchOptions.before = victimSignature;
    }

    const sigsBefore = await retryWithBackoff(() =>
      conn.getSignaturesForAddress(poolPubkey, searchOptions)
    );

    // Also get signatures after the victim's tx (for backrun detection)
    let sigsAfter: ConfirmedSignatureInfo[] = [];
    if (victimSignature) {
      try {
        // Get recent signatures and filter to same slot
        const recent = await retryWithBackoff(() =>
          conn.getSignaturesForAddress(poolPubkey, { limit: 100 })
        );
        sigsAfter = recent.filter(s => s.slot === slot);
      } catch {
        // Ignore - we'll work with what we have
      }
    }

    const allSigs = [...sigsBefore, ...sigsAfter];

    // Filter to same slot and not already known
    const slotSigs = allSigs.filter(
      s => s.slot === slot && !s.err && !knownSigs.has(s.signature)
    );

    // Deduplicate
    const uniqueSigs = Array.from(new Map(slotSigs.map(s => [s.signature, s])).values());

    if (uniqueSigs.length === 0) return [];

    console.log(`[RPC] Found ${uniqueSigs.length} other txs in slot ${slot} for pool ${pool.slice(0, 12)}...`);

    const swaps: SwapTransaction[] = [];
    const txs = await fetchParsedTransactions(conn, uniqueSigs.map(s => s.signature));

    for (let j = 0; j < txs.length; j++) {
      const tx = txs[j];
      if (!tx || tx.meta?.err) continue;

      const swap = parseSwapFromParsedTx(tx, uniqueSigs[j]);
      if (swap) {
        swap.slotIndex = j;
        swaps.push(swap);
      }
    }

    return swaps;
  } catch (error) {
    console.error(`[RPC] Error fetching pool ${pool} at slot ${slot}:`, error);
    return [];
  }
}

async function fetchSignatures(
  conn: Connection,
  pubkey: PublicKey,
  cutoffTimestamp: number
): Promise<ConfirmedSignatureInfo[]> {
  const allSigs: ConfirmedSignatureInfo[] = [];
  let before: string | undefined;
  const MAX_PAGES = 5;

  for (let page = 0; page < MAX_PAGES; page++) {
    const sigs = await retryWithBackoff(() =>
      conn.getSignaturesForAddress(pubkey, {
        limit: 1000,
        before,
      })
    );

    if (sigs.length === 0) break;

    for (const sig of sigs) {
      if (sig.blockTime && sig.blockTime < cutoffTimestamp) {
        return allSigs;
      }
      if (!sig.err) {
        allSigs.push(sig);
      }
    }

    before = sigs[sigs.length - 1].signature;
    if (sigs.length < 1000) break;
    await new Promise(r => setTimeout(r, 300));
  }

  return allSigs;
}

async function fetchParsedTransactions(
  conn: Connection,
  signatures: string[]
): Promise<(ParsedTransactionWithMeta | null)[]> {
  const results: (ParsedTransactionWithMeta | null)[] = [];
  for (const sig of signatures) {
    const tx = await retryWithBackoff(() =>
      conn.getParsedTransaction(sig, { maxSupportedTransactionVersion: 0 })
    );
    results.push(tx);
    if (signatures.length > 1) {
      await new Promise(r => setTimeout(r, 150));
    }
  }
  return results;
}

/**
 * Parse a swap from a parsed transaction using balance changes.
 * Strategy:
 * 1. Try to find a known DEX program (top-level or inner instructions)
 * 2. Regardless, detect swap via token balance changes for the signer
 * 3. A "swap" = signer lost one token and gained another
 */
function parseSwapFromParsedTx(
  tx: ParsedTransactionWithMeta,
  sigInfo: ConfirmedSignatureInfo
): SwapTransaction | null {
  const accountKeys = tx.transaction.message.accountKeys.map(k =>
    typeof k === 'string' ? k : k.pubkey.toBase58()
  );
  const signer = accountKeys[0];
  const meta = tx.meta!;

  // Get all token balance changes for the signer
  const preBalances = meta.preTokenBalances || [];
  const postBalances = meta.postTokenBalances || [];
  const changes = getSignerTokenChanges(preBalances, postBalances, signer);

  // Also compute SOL balance change (excluding fees)
  const solChange = ((meta.postBalances?.[0] || 0) - (meta.preBalances?.[0] || 0)) + (meta.fee || 0);
  const solMint = 'So11111111111111111111111111111111111111112';

  // Include wrapped SOL changes from token accounts
  const wrappedSolChange = changes.find(c => c.mint === solMint);
  const nonSolChanges = changes.filter(c => c.mint !== solMint);

  // Determine if this is a swap: need at least one token change,
  // plus either a SOL change or another token change in the opposite direction
  const hasTokenIncrease = nonSolChanges.some(c => c.change > 0);
  const hasTokenDecrease = nonSolChanges.some(c => c.change < 0);
  const hasSolDecrease = solChange < -10000; // More than dust (fees)
  const hasSolIncrease = solChange > 10000;

  const isSwap =
    (hasTokenIncrease && hasTokenDecrease) || // Token-to-token swap
    (hasTokenIncrease && hasSolDecrease) ||    // SOL -> Token (buy)
    (hasTokenDecrease && hasSolIncrease) ||    // Token -> SOL (sell)
    (wrappedSolChange && nonSolChanges.length > 0); // wSOL involved

  if (!isSwap) return null;

  // Identify the DEX and pool
  const dexInfo = identifyDexAndPool(tx, accountKeys);

  // Determine direction and amounts based on the primary non-SOL token change
  let tokenMint: string;
  let direction: 'buy' | 'sell';
  let amountIn: bigint;
  let amountOut: bigint;

  if (nonSolChanges.length > 0) {
    // Find the token with the largest absolute change
    const primaryToken = nonSolChanges.reduce((max, c) =>
      Math.abs(c.change) > Math.abs(max.change) ? c : max
    );
    tokenMint = primaryToken.mint;

    if (primaryToken.change > 0) {
      // Gained token = buy
      direction = 'buy';
      amountOut = BigInt(Math.round(primaryToken.change));
      // What we spent: SOL decrease or another token decrease
      const spent = nonSolChanges.find(c => c.change < 0);
      amountIn = spent
        ? BigInt(Math.round(Math.abs(spent.change)))
        : BigInt(Math.abs(Math.min(solChange, 0)));
    } else {
      // Lost token = sell
      direction = 'sell';
      amountIn = BigInt(Math.round(Math.abs(primaryToken.change)));
      const gained = nonSolChanges.find(c => c.change > 0 && c.mint !== primaryToken.mint);
      amountOut = gained
        ? BigInt(Math.round(gained.change))
        : BigInt(Math.max(solChange, 0));
    }
  } else if (wrappedSolChange) {
    tokenMint = solMint;
    direction = wrappedSolChange.change > 0 ? 'buy' : 'sell';
    amountIn = BigInt(Math.round(Math.abs(wrappedSolChange.change)));
    amountOut = amountIn;
  } else {
    return null;
  }

  // Use pool from DEX detection, or derive from account keys
  const pool = dexInfo.pool || derivePoolFromAccounts(tx, accountKeys);
  if (!pool) return null;

  console.log(`[RPC] Parsed swap: ${direction} ${KNOWN_TOKENS[tokenMint]?.symbol || tokenMint.slice(0,8)} on ${dexInfo.dexName || 'Unknown'} pool=${pool.slice(0,12)}... slot=${sigInfo.slot}`);

  return {
    signature: sigInfo.signature,
    slot: sigInfo.slot,
    slotIndex: 0,
    pool,
    tokenMint,
    tokenSymbol: KNOWN_TOKENS[tokenMint]?.symbol,
    direction,
    amountIn,
    amountOut,
    signer,
    timestamp: sigInfo.blockTime || tx.blockTime || Math.floor(Date.now() / 1000),
    dex: dexInfo.dexName || 'Unknown DEX',
  };
}

interface DexInfo {
  dexName: string | null;
  pool: string | null;
}

/**
 * Identify which DEX a transaction interacts with by checking all instructions
 * (top-level and inner) against known program IDs.
 * Also extracts the pool address from the DEX instruction accounts.
 */
function identifyDexAndPool(
  tx: ParsedTransactionWithMeta,
  accountKeys: string[]
): DexInfo {
  // Check top-level instructions
  for (const ix of tx.transaction.message.instructions) {
    const programId = getProgramId(ix);
    if (DEX_PROGRAM_IDS.has(programId)) {
      const pool = extractPoolFromInstruction(ix, programId);
      return { dexName: DEX_NAMES[programId] || programId, pool };
    }
  }

  // Check inner instructions (most swaps via routers end up here)
  if (tx.meta?.innerInstructions) {
    for (const inner of tx.meta.innerInstructions) {
      for (const ix of inner.instructions) {
        const programId = getProgramId(ix);
        if (DEX_PROGRAM_IDS.has(programId) && !SYSTEM_PROGRAMS.has(programId)) {
          const pool = extractPoolFromInstruction(ix, programId);
          return { dexName: DEX_NAMES[programId] || programId, pool };
        }
      }
    }
  }

  // Fallback: check if any account key is a known DEX program
  for (const key of accountKeys) {
    if (DEX_PROGRAM_IDS.has(key)) {
      return { dexName: DEX_NAMES[key] || key, pool: null };
    }
  }

  return { dexName: null, pool: null };
}

function extractPoolFromInstruction(
  ix: ParsedInstruction | PartiallyDecodedInstruction,
  dexProgramId: string
): string | null {
  if (!('accounts' in ix)) return null;
  const accounts = (ix as PartiallyDecodedInstruction).accounts;
  if (accounts.length < 2) return null;

  // Pool is typically at index 1 for most DEXes, index 2 for Orca Whirlpool
  let poolIdx = 1;
  if (dexProgramId === DEX_PROGRAMS.ORCA_WHIRLPOOL) poolIdx = 2;
  if (dexProgramId === DEX_PROGRAMS.RAYDIUM_CLMM) poolIdx = 1;
  if (dexProgramId === DEX_PROGRAMS.METEORA_DLMM) poolIdx = 1;

  const poolKey = accounts[poolIdx] || accounts[1];
  return poolKey.toBase58();
}

/**
 * Fallback pool derivation: find the first non-system, non-signer, non-program account
 * that appears in token balance records. This is likely a pool or AMM account.
 */
function derivePoolFromAccounts(
  tx: ParsedTransactionWithMeta,
  accountKeys: string[]
): string | null {
  const meta = tx.meta!;
  const allTokenOwners = new Set<string>();

  // Collect all token account owners from balance records
  for (const b of [...(meta.preTokenBalances || []), ...(meta.postTokenBalances || [])]) {
    if (b.owner) allTokenOwners.add(b.owner);
  }

  // Find an account that owns token accounts but isn't the signer or a known program
  const signer = accountKeys[0];
  for (const owner of allTokenOwners) {
    if (owner === signer) continue;
    if (SYSTEM_PROGRAMS.has(owner)) continue;
    if (DEX_PROGRAM_IDS.has(owner)) continue;
    // This is likely a pool/AMM authority
    return owner;
  }

  // Last resort: use the second account key (often the pool in direct DEX calls)
  if (accountKeys.length > 1) {
    return accountKeys[1];
  }

  return null;
}

function getProgramId(ix: ParsedInstruction | PartiallyDecodedInstruction): string {
  return ix.programId.toBase58();
}

interface TokenChange {
  mint: string;
  change: number;
}

function getSignerTokenChanges(
  preBalances: readonly { mint: string; owner?: string; uiTokenAmount: { amount: string } }[],
  postBalances: readonly { mint: string; owner?: string; uiTokenAmount: { amount: string } }[],
  signer: string
): TokenChange[] {
  const pre = preBalances.filter(b => b.owner === signer);
  const post = postBalances.filter(b => b.owner === signer);

  const changes: TokenChange[] = [];
  const mintArr = Array.from(new Set([...pre.map(b => b.mint), ...post.map(b => b.mint)]));

  for (const mint of mintArr) {
    const preB = pre.find(b => b.mint === mint);
    const postB = post.find(b => b.mint === mint);
    const preAmt = preB ? Number(preB.uiTokenAmount.amount) : 0;
    const postAmt = postB ? Number(postB.uiTokenAmount.amount) : 0;
    const change = postAmt - preAmt;
    if (change !== 0) {
      changes.push({ mint, change });
    }
  }

  return changes;
}
