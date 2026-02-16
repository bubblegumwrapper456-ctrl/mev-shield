'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LossChartProps {
  data: { week: string; count: number; lossUSD: number }[];
}

export function LossChart({ data }: LossChartProps) {
  if (data.length === 0) return null;

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    loss: Number(d.lossUSD.toFixed(2)),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">MEV Losses Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="label"
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
              <Line
                type="monotone"
                dataKey="loss"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(0, 84%, 60%)', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(0, 84%, 60%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
