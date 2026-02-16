'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SandwichAttackJSON } from '@/lib/types';
import { KNOWN_SANDWICH_BOTS, SOLSCAN_TX_URL } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';

interface AttackCardProps {
  attack: SandwichAttackJSON;
}

export function AttackCard({ attack }: AttackCardProps) {
  const date = new Date(attack.timestamp * 1000);
  const botAlias = KNOWN_SANDWICH_BOTS[attack.attackerWallet];

  return (
    <Card className="border-border/50 card-hover">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-400">
                -{attack.lossUSD >= 1
                  ? `$${attack.lossUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : `$${attack.lossUSD.toFixed(4)}`}
              </span>
              <Badge variant="secondary" className="text-xs">
                {attack.dex}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {attack.tokenSymbol || attack.tokenMint.slice(0, 8) + '...'}
              {' '}&middot;{' '}Slot {attack.slot.toLocaleString()}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {date.toLocaleDateString()}
            <br />
            {date.toLocaleTimeString()}
          </div>
        </div>

        {/* Bot info */}
        <div className="text-xs text-muted-foreground mb-3">
          Attacker:{' '}
          <span className="text-orange-400 font-mono">
            {botAlias || `${attack.attackerWallet.slice(0, 12)}...${attack.attackerWallet.slice(-4)}`}
          </span>
        </div>

        {/* Transaction links */}
        <div className="flex gap-3 text-xs">
          <a
            href={`${SOLSCAN_TX_URL}${attack.frontrunTxSig}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors"
          >
            Frontrun <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={`${SOLSCAN_TX_URL}${attack.victimTxSig}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            Your TX <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={`${SOLSCAN_TX_URL}${attack.backrunTxSig}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors"
          >
            Backrun <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
