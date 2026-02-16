'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

export function WalletInput() {
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function validateAddress(addr: string): boolean {
    // Basic base58 check: 32-44 chars, only base58 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(addr);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = wallet.trim();

    if (!trimmed) {
      setError('Please enter a wallet address');
      return;
    }

    if (!validateAddress(trimmed)) {
      setError('Invalid Solana wallet address');
      return;
    }

    setError('');
    setLoading(true);
    router.push(`/results/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Enter your Solana wallet address..."
            value={wallet}
            onChange={(e) => {
              setWallet(e.target.value);
              if (error) setError('');
            }}
            className="h-12 pl-4 pr-4 bg-secondary/50 border-border/50 focus:border-red-500/50 focus:ring-red-500/20 text-base placeholder:text-muted-foreground/50"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold glow-red-sm"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Check My Wallet
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
    </form>
  );
}
