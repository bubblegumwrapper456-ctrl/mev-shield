'use client';

import { useState } from 'react';
import { SandwichAttackJSON } from '@/lib/types';
import { AttackCard } from './AttackCard';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface AttackTimelineProps {
  attacks: SandwichAttackJSON[];
}

const PAGE_SIZE = 10;

export function AttackTimeline({ attacks }: AttackTimelineProps) {
  const [showCount, setShowCount] = useState(PAGE_SIZE);

  const sorted = [...attacks].sort((a, b) => b.timestamp - a.timestamp);
  const visible = sorted.slice(0, showCount);
  const hasMore = showCount < sorted.length;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Attack Timeline</h3>
      <div className="space-y-3">
        {visible.map((attack) => (
          <AttackCard key={attack.id} attack={attack} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setShowCount((c) => c + PAGE_SIZE)}
            className="gap-2"
          >
            Show More <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
