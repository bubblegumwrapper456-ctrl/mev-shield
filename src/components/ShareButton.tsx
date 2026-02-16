'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  attackCount: number;
  totalLossSOL: number;
  totalLossUSD: number;
  wallet: string;
}

export function ShareButton({ attackCount, totalLossSOL, totalLossUSD, wallet }: ShareButtonProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mevshield.com';

  const tweetText = encodeURIComponent(
    `I've been sandwiched ${attackCount} time${attackCount !== 1 ? 's' : ''} on Solana, losing ${totalLossSOL.toFixed(2)} SOL ($${totalLossUSD.toFixed(2)}).\n\nCheck yours: ${appUrl}/results/${wallet}\n\n#MEVShield #Solana #DeFi`
  );

  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <Button
      variant="outline"
      className="gap-2 border-border/50 hover:border-blue-500/50 hover:text-blue-400"
      onClick={() => window.open(twitterUrl, '_blank', 'width=600,height=400')}
    >
      <Share2 className="w-4 h-4" />
      Share on X
    </Button>
  );
}
