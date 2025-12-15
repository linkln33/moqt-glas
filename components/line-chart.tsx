'use client';

import { EChartsWrapper } from './echarts-wrapper';

interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  color?: string;
  title?: string;
  smooth?: boolean;
  area?: boolean;
}

export function LineChartComponent({
  data,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  color = '#3b82f6',
  title,
  smooth = true,
  area = false,
}: LineChartProps) {
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
    xAxis: {
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
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 40,
    },
    series: [
      {
        name: yAxisLabel || 'Стойност',
        type: 'line',
        data: data.map((item) => item.value),
        smooth,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color,
        },
        itemStyle: {
          color,
        },
        areaStyle: area
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: color + '80',
                  },
                  {
                    offset: 1,
                    color: color + '10',
                  },
                ],
              },
            }
          : undefined,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: color,
          },
        },
        animationDelay: (idx: number) => idx * 20,
      },
    ],
  };

  return <EChartsWrapper option={option} height={height} />;
}
