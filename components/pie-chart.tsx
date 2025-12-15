'use client';

import { EChartsWrapper } from './echarts-wrapper';

interface PieChartData {
  name: string;
  value: number;
  id?: string;
  [key: string]: string | number | undefined;
}

interface PieChartProps {
  data: PieChartData[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  title?: string;
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

export function PieChartComponent({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showTooltip = true,
  title,
}: PieChartProps) {
  // Filter out zero values for cleaner chart
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        Няма данни за показване
      </div>
    );
  }

  const option = {
    title: title
      ? {
          text: title,
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        }
      : undefined,
    tooltip: showTooltip
      ? {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
          },
        }
      : undefined,
    legend: showLegend
      ? {
          orient: 'horizontal',
          bottom: 0,
          left: 'center',
          itemGap: 15,
          textStyle: {
            fontSize: 12,
          },
        }
      : undefined,
    series: [
      {
        name: 'Статистика',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', showLegend ? '45%' : '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#fff',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
        },
        data: filteredData.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 50,
      },
    ],
  };

  return <EChartsWrapper option={option} height={height} />;
}
