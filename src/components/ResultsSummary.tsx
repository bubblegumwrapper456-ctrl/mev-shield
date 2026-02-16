'use client';

import { Card, CardContent } from '@/components/ui/card';
import { WalletReportJSON } from '@/lib/types';
import { KNOWN_SANDWICH_BOTS } from '@/lib/constants';
import { AlertTriangle, Skull, Target, Bot, Clock } from 'lucide-react';

interface ResultsSummaryProps {
  report: WalletReportJSON;
}

export function ResultsSummary({ report }: ResultsSummaryProps) {
  const formatUSD = (n: number) =>
    n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(4)}`;
  const formatSOL = (n: number) =>
    n >= 1 ? `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL` : `${n.toFixed(6)} SOL`;

  const timeRangeStr = (() => {
    const from = new Date(report.timeRange.from * 1000);
    const to = new Date(report.timeRange.to * 1000);
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  })();

  if (report.attackCount === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">You&apos;re Safe!</h2>
          <p className="text-muted-foreground">
            No sandwich attacks detected for this wallet in the last 90 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main alert banner */}
      <Card className="border-red-500/30 bg-red-500/5 glow-red">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-400">Sandwich Attacks Detected</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Attack Count */}
            <div>
              <div className="text-4xl font-bold text-red-400">
                {report.attackCount}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Skull className="w-3.5 h-3.5" />
                Attacks
              </div>
            </div>

            {/* Total Loss SOL */}
            <div>
              <div className="text-4xl font-bold text-red-400">
                {formatSOL(report.totalLossSOL)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatUSD(report.totalLossUSD)} lost
              </div>
            </div>

            {/* Most Targeted Token */}
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {report.mostTargetedToken?.symbol || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Target className="w-3.5 h-3.5" />
                Most Targeted
              </div>
            </div>

            {/* Most Active Attacker */}
            <div>
              <div className="text-2xl font-bold text-orange-400 truncate">
                {report.mostActiveAttacker
                  ? KNOWN_SANDWICH_BOTS[report.mostActiveAttacker.wallet] ||
                    `${report.mostActiveAttacker.wallet.slice(0, 8)}...`
                  : 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Bot className="w-3.5 h-3.5" />
                Top Attacker
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time range & worst attack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5" />
              Analysis Period
            </div>
            <div className="text-base font-medium">{timeRangeStr}</div>
          </CardContent>
        </Card>

        {report.worstAttack && (
          <Card className="border-red-500/20 bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="text-sm text-muted-foreground mb-1">Worst Single Attack</div>
              <div className="text-lg font-bold text-red-400">
                {formatUSD(report.worstAttack.lossUSD)}
              </div>
              <div className="text-xs text-muted-foreground">
                {report.worstAttack.dex} &middot; {report.worstAttack.tokenSymbol || 'Unknown token'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
