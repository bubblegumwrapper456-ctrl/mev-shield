import { WalletInput } from '@/components/WalletInput';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Have I Been{' '}
            <span className="gradient-text">Sandwiched?</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Find out how much MEV bots have stolen from your Solana wallet.
            Enter your address to see your sandwich attack history.
          </p>
          <WalletInput />
          <p className="text-xs text-muted-foreground mt-4">
            Analyzes the last 90 days of DEX activity across Raydium, Orca, Meteora, and pump.fun
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">What Are Sandwich Attacks?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-500">1</span>
              </div>
              <h3 className="font-semibold mb-2">Front-Run</h3>
              <p className="text-sm text-muted-foreground">
                A bot detects your pending swap and places a buy order before yours,
                driving the price up.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-500">2</span>
              </div>
              <h3 className="font-semibold mb-2">Your Trade</h3>
              <p className="text-sm text-muted-foreground">
                Your swap executes at a worse price because the bot already moved
                the market against you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-500">3</span>
              </div>
              <h3 className="font-semibold mb-2">Back-Run</h3>
              <p className="text-sm text-muted-foreground">
                The bot sells immediately after your trade, pocketing the price difference as profit
                at your expense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 border-t border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-400">$370M+</div>
              <div className="text-sm text-muted-foreground mt-1">
                Extracted by sandwich bots on Solana
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">Millions</div>
              <div className="text-sm text-muted-foreground mt-1">
                Of wallets affected
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">Free</div>
              <div className="text-sm text-muted-foreground mt-1">
                Check your wallet now
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
