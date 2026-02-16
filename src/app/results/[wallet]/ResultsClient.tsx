'use client';

import { useEffect } from 'react';
import { useSandwichData } from '@/hooks/useSandwichData';
import { ResultsSummary } from '@/components/ResultsSummary';
import { AttackTimeline } from '@/components/AttackTimeline';
import { LossChart } from '@/components/LossChart';
import { TokenPieChart } from '@/components/TokenPieChart';
import { DexBarChart } from '@/components/DexBarChart';
import { AttackerTable } from '@/components/AttackerTable';
import { ShareButton } from '@/components/ShareButton';
import { ProtectCTA } from '@/components/ProtectCTA';
import { WalletInput } from '@/components/WalletInput';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ResultsClientProps {
  wallet: string;
}

export function ResultsClient({ wallet }: ResultsClientProps) {
  const { data, loading, error, fetchReport } = useSandwichData();

  useEffect(() => {
    fetchReport(wallet);
  }, [wallet, fetchReport]);

  if (loading) {
    return <LoadingSkeleton wallet={wallet} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-red-500/30">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <WalletInput />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Wallet address header */}
      <div className="mb-6">
        <h1 className="text-sm text-muted-foreground mb-1">Results for</h1>
        <p className="font-mono text-sm md:text-base break-all text-foreground/80">{wallet}</p>
      </div>

      {/* Summary */}
      <ResultsSummary report={data} />

      {/* Actions bar */}
      {data.attackCount > 0 && (
        <div className="flex flex-wrap gap-3 mt-6 mb-8">
          <ShareButton
            attackCount={data.attackCount}
            totalLossSOL={data.totalLossSOL}
            totalLossUSD={data.totalLossUSD}
            wallet={wallet}
          />
        </div>
      )}

      {/* CTA */}
      <div className="mb-8">
        <ProtectCTA />
      </div>

      {/* Charts */}
      {data.attackCount > 0 && (
        <>
          <div className="mb-8">
            <LossChart data={data.attacksByWeek} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <TokenPieChart data={data.attacksByToken} />
            <DexBarChart data={data.attacksByDex} />
          </div>

          <div className="mb-8">
            <AttackerTable attackers={data.topAttackers} />
          </div>

          {/* Attack Timeline */}
          <div className="mb-8">
            <AttackTimeline attacks={data.attacks} />
          </div>
        </>
      )}

      {/* Check another wallet */}
      <div className="border-t border-border/50 pt-8">
        <h3 className="text-lg font-semibold text-center mb-4">Check Another Wallet</h3>
        <WalletInput />
      </div>
    </div>
  );
}

function LoadingSkeleton({ wallet }: { wallet: string }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-sm text-muted-foreground mb-1">Analyzing</h1>
        <p className="font-mono text-sm break-all text-foreground/80">{wallet}</p>
      </div>

      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>Scanning for sandwich attacks...</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
