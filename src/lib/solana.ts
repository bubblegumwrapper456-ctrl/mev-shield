import { Connection, PublicKey } from '@solana/web3.js';

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    connection = new Connection(rpcUrl, 'confirmed');
  }
  return connection;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export async function getSOLPrice(): Promise<number> {
  // Check env override first
  const envPrice = process.env.SOL_PRICE_USD;
  if (envPrice && !isNaN(Number(envPrice))) {
    return Number(envPrice);
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    const data = await res.json();
    return data.solana?.usd ?? 150; // Fallback price
  } catch {
    return 150; // Fallback
  }
}
