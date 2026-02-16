'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KNOWN_SANDWICH_BOTS, SOLSCAN_ACCOUNT_URL } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';

interface AttackerTableProps {
  attackers: { wallet: string; count: number; totalProfitUSD: number }[];
}

export function AttackerTable({ attackers }: AttackerTableProps) {
  if (attackers.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Attacker Bots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 text-muted-foreground font-medium">Bot</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Attacks</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Profit (est.)</th>
                <th className="text-right py-2 text-muted-foreground font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {attackers.map((attacker) => (
                <tr key={attacker.wallet} className="border-b border-border/30">
                  <td className="py-2.5">
                    <span className="text-orange-400 font-mono text-xs">
                      {KNOWN_SANDWICH_BOTS[attacker.wallet] ||
                        `${attacker.wallet.slice(0, 8)}...${attacker.wallet.slice(-4)}`}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-medium">{attacker.count}</td>
                  <td className="py-2.5 text-right text-red-400 font-medium">
                    ${attacker.totalProfitUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right">
                    <a
                      href={`${SOLSCAN_ACCOUNT_URL}${attacker.wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5 inline" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
