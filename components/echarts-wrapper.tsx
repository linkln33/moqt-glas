'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Dynamically import ReactECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface EChartsWrapperProps {
  option: any;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export function EChartsWrapper({ option, height = 300, style, className }: EChartsWrapperProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Apply theme colors
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e5e7eb' : '#374151';
  const backgroundColor = 'transparent';

  const themedOption = {
    ...option,
    backgroundColor,
    textStyle: {
      color: textColor,
      fontFamily: 'inherit',
    },
    tooltip: {
      ...option.tooltip,
      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)',
      textStyle: {
        color: textColor,
      },
    },
    legend: {
      ...option.legend,
      textStyle: {
        color: textColor,
      },
    },
  };

  return (
    <ReactECharts
      option={themedOption}
      style={{ height, width: '100%', ...style }}
      className={className}
      opts={{ renderer: 'svg' }}
    />
  );
}
