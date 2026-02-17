'use client';

import { useEffect, useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Check } from 'lucide-react';

interface ResultsClientProps {
  wallet: string;
}

export function ResultsClient({ wallet }: ResultsClientProps) {
  const { data, loading, error, fetchReport } = useSandwichData();

  useEffect(() => {
    fetchReport(wallet);
  }, [wallet, fetchReport]);

  if (loading) {
    return <AnalysisLoader wallet={wallet} />;
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

const ANALYSIS_PHASES = [
  { label: 'Connecting to Solana network...', delay: 0 },
  { label: 'Fetching transaction history...', delay: 4000 },
  { label: 'Parsing DEX swap data...', delay: 12000 },
  { label: 'Scanning blocks for sandwich patterns...', delay: 30000 },
  { label: 'Analyzing attacker wallets...', delay: 70000 },
  { label: 'Crunching the numbers...', delay: 130000 },
];

const FUN_FACTS = [
  'Sandwich attacks earned MEV bots over $200M on Ethereum in 2023 alone.',
  'The term "sandwich attack" comes from your trade being placed between two attacker trades.',
  'MEV stands for Maximal Extractable Value — profit miners/validators can extract by reordering transactions.',
  'Some sandwich bots operate across multiple DEXs simultaneously to maximize profit.',
  'Solana\'s fast block times make sandwich detection especially challenging.',
  'The average sandwich attack on Solana costs users 0.5–2% of their swap value.',
  'Private mempools and transaction bundling are the main defenses against MEV.',
  'Over 60% of DEX trades on Ethereum have been touched by some form of MEV.',
];

function AnalysisLoader({ wallet }: { wallet: string }) {
  const [activePhase, setActivePhase] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);

  useEffect(() => {
    const timers = ANALYSIS_PHASES.slice(1).map((phase, i) =>
      setTimeout(() => setActivePhase(i + 1), phase.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-sm text-muted-foreground mb-1">Analyzing</h1>
        <p className="font-mono text-sm break-all text-foreground/80">{wallet}</p>
      </div>

      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          {/* Radar animation */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-red-500/30" />
              <div className="absolute inset-2 rounded-full border-2 border-red-500/20" />
              <div className="absolute inset-4 rounded-full border-2 border-red-500/10" />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(239,68,68,0.4) 40deg, transparent 80deg)',
                  animation: 'radar-sweep 2s linear infinite',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-3 h-3 rounded-full bg-red-500"
                  style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                />
              </div>
            </div>
          </div>

          {/* Phase stepper */}
          <div className="space-y-3 mb-6">
            {ANALYSIS_PHASES.map((phase, i) => {
              const isCompleted = i < activePhase;
              const isActive = i === activePhase;
              const isPending = i > activePhase;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3"
                  style={isActive ? { animation: 'fade-slide-in 0.4s ease-out' } : undefined}
                >
                  {/* Step indicator */}
                  {isCompleted && (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                  {isActive && (
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-red-500"
                        style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}
                      />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-5 h-5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                  )}

                  {/* Label */}
                  <span
                    className={
                      isCompleted
                        ? 'text-sm text-muted-foreground/50 line-through'
                        : isActive
                        ? 'text-sm font-semibold text-foreground'
                        : 'text-sm text-muted-foreground/30'
                    }
                  >
                    {phase.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fun fact */}
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Did you know?</p>
            <p
              className="text-sm text-muted-foreground/80 min-h-[2.5rem] transition-opacity duration-400"
              style={{ opacity: factVisible ? 1 : 0 }}
            >
              {FUN_FACTS[factIndex]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shimmer skeleton blocks */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 w-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsl(217 33% 12%) 25%, hsl(217 33% 17%) 50%, hsl(217 33% 12%) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}
