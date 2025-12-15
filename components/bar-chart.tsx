'use client';

import { EChartsWrapper } from './echarts-wrapper';

interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  colors?: string[];
  title?: string;
  horizontal?: boolean;
}

const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function BarChartComponent({
  data,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  colors = DEFAULT_COLORS,
  title,
  horizontal = false,
}: BarChartProps) {
  if (!data || data.length === 0) {
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
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = Array.isArray(params) ? params[0] : params;
        return `${param.name}<br/>${param.seriesName}: ${param.value}`;
      },
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: title ? '20%' : '10%',
      containLabel: true,
    },
    xAxis: horizontal
      ? {
          type: 'value',
          name: xAxisLabel,
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            formatter: '{value}',
          },
        }
      : {
          type: 'category',
          data: data.map((item) => item.name),
          name: xAxisLabel,
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            rotate: data.length > 5 ? 45 : 0,
            interval: 0,
          },
        },
    yAxis: horizontal
      ? {
          type: 'category',
          data: data.map((item) => item.name),
          name: yAxisLabel,
          nameLocation: 'middle',
          nameGap: 50,
          axisLabel: {
            interval: 0,
          },
        }
      : {
          type: 'value',
          name: yAxisLabel,
          nameLocation: 'middle',
          nameGap: 40,
        },
    series: [
      {
        name: yAxisLabel || 'Стойност',
        type: 'bar',
        data: data.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: colors[index % colors.length],
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: {
          show: true,
          position: horizontal ? 'right' : 'top',
          formatter: '{c}',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        animationDelay: (idx: number) => idx * 50,
      },
    ],
  };

  return <EChartsWrapper option={option} height={height} />;
}
