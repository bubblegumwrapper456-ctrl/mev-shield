'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DexBarChartProps {
  data: Record<string, { count: number; lossUSD: number }>;
}

export function DexBarChart({ data }: DexBarChartProps) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const chartData = entries.map(([dex, stats]) => ({
    dex,
    loss: Number(stats.lossUSD.toFixed(2)),
    count: stats.count,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Losses by DEX</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="dex"
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
              />
              <YAxis
                tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222, 47%, 8%)',
                  border: '1px solid hsl(217, 33%, 17%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 40%, 98%)',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Loss']}
              />
              <Bar dataKey="loss" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
