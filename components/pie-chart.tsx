'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  id?: string;
}

interface PieChartProps {
  data: PieChartData[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
}

const DEFAULT_COLORS = [
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
];

// Gradient colors for better visual appeal
const GRADIENT_COLORS = [
  'url(#gradientGreen)',
  'url(#gradientBlue)',
  'url(#gradientPurple)',
  'url(#gradientAmber)',
  'url(#gradientRed)',
  'url(#gradientCyan)',
  'url(#gradientPink)',
  'url(#gradientLime)',
];

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for slices < 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          Стойност: <span className="font-semibold text-primary">{payload[0].value}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Процент: <span className="font-semibold">{(payload[0].payload.percent * 100).toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function PieChartComponent({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showTooltip = true,
}: PieChartProps) {
  // Filter out zero values for cleaner chart
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Няма данни за показване
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <defs>
          <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
            <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientPink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
            <stop offset="100%" stopColor="#db2777" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="gradientLime" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#84cc16" stopOpacity={1} />
            <stop offset="100%" stopColor="#65a30d" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={height * 0.35}
          innerRadius={height * 0.15}
          fill="#8884d8"
          dataKey="value"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={3}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {filteredData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                if (e.target) {
                  (e.target as SVGElement).style.opacity = '0.8';
                }
              }}
              onMouseLeave={(e) => {
                if (e.target) {
                  (e.target as SVGElement).style.opacity = '1';
                }
              }}
            />
          ))}
        </Pie>
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value, entry: any) => (
              <span className="text-sm text-foreground">
                {value}: <span className="font-semibold text-primary">{entry.payload.value}</span>
              </span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
