'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Check } from 'lucide-react';

export function ProtectCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      // In production, this would POST to an API endpoint
      setSubmitted(true);
    }
  }

  return (
    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">Protect Yourself</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our Protected RPC routes your transactions to avoid sandwich attacks.
              Join the waitlist to get early access when it launches.
            </p>

            {submitted ? (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">
                  You&apos;re on the list! We&apos;ll notify you at launch.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 bg-secondary/50 border-border/50"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Join Waitlist
                </Button>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
