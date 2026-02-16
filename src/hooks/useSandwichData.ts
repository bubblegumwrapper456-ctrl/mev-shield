'use client';

import { useState, useCallback } from 'react';
import { WalletReportJSON } from '@/lib/types';

interface UseSandwichDataResult {
  data: WalletReportJSON | null;
  loading: boolean;
  error: string | null;
  fetchReport: (wallet: string) => Promise<WalletReportJSON | null>;
}

export function useSandwichData(): UseSandwichDataResult {
  const [data, setData] = useState<WalletReportJSON | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (wallet: string): Promise<WalletReportJSON | null> => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/sandwich-check/${wallet}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
      const report: WalletReportJSON = await res.json();
      setData(report);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchReport };
}
