import React, { memo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

export interface ClientsRadarChartProps {
  data: Array<{ name: string; count: number }>;
  height?: number;
  maxClients?: number; // limit number of spokes for readability
}

const ClientsRadarChart: React.FC<ClientsRadarChartProps> = ({
  data,
  height = 320,
  maxClients = 12,
}) => {
  const trimmed = (data || [])
    .filter(d => !!d?.name)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxClients)
    .map(d => ({ subject: d.name, count: d.count }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart
          data={trimmed}
          outerRadius="80%"
          margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
        >
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            stroke="var(--border)"
          />
          <Tooltip
            formatter={(value: unknown) => [`${value as number} invoice(s)`, 'Count']}
            labelFormatter={(label: string) => `${label}`}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Radar
            name="Invoices"
            dataKey="count"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(ClientsRadarChart);
