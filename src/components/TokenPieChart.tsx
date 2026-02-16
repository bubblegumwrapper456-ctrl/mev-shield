'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TokenPieChartProps {
  data: { token: string; symbol?: string; count: number; lossUSD: number }[];
}

const COLORS = [
  'hsl(0, 84%, 60%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 65%, 60%)',
  'hsl(160, 60%, 45%)',
  'hsl(340, 75%, 55%)',
  'hsl(200, 70%, 50%)',
];

export function TokenPieChart({ data }: TokenPieChartProps) {
  if (data.length === 0) return null;

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.symbol || `${d.token.slice(0, 6)}...`,
    value: Number(d.lossUSD.toFixed(2)),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Losses by Token</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
              <Legend
                wrapperStyle={{ color: 'hsl(215, 20%, 65%)', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
