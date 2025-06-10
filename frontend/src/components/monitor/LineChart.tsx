'use client';

import { useRef, useState, useEffect } from 'react';

export interface HistoricalDataPoint {
  time: string;
  temperature: number;
  humidity: number;
  pH: number;
  co2: number;
  oxygen: number;
  pressure?: number;
  [key: string]: string | number | undefined;
}

export interface LineChartProps {
  data: HistoricalDataPoint[];
  dataKey: string;
  color: string;
  secondaryColor?: string;
}

const LineChart = ({ data, dataKey, color, secondaryColor = '#ffffff20' }: LineChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  
  // Get min and max values for scaling
  const values = data.map(item => Number(item[dataKey]));
  const minValue = Math.floor(Math.min(...values));
  const maxValue = Math.ceil(Math.max(...values));
  const range = maxValue - minValue;
  
  // Calculate path
  useEffect(() => {
    if (chartRef.current) {
      const { width, height } = chartRef.current.getBoundingClientRect();
      setChartSize({ width, height });
    }
  }, []);
  
  // Create data points for the chart
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartSize.width;
    const normalizedValue = (Number(item[dataKey]) - minValue) / range;
    const y = chartSize.height - (normalizedValue * (chartSize.height - 20)) - 10;
    return { x, y, value: item[dataKey] };
  });
  
  // Create path string
  const pathString = points.length > 0
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';
  
  // Create area fill path
  const areaPathString = points.length > 0
    ? `${pathString} L ${points[points.length - 1].x},${chartSize.height} L ${points[0].x},${chartSize.height} Z`
    : '';
  
  return (
    <div className="relative h-full w-full" ref={chartRef}>
      {chartSize.width > 0 && (
        <>
          {/* Y-axis values */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
            <div>{maxValue}</div>
            <div>{minValue + range/2}</div>
            <div>{minValue}</div>
          </div>
          
          {/* X-axis times */}
          <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 pointer-events-none">
            <div>{data[0]?.time}</div>
            <div>{data[Math.floor(data.length/2)]?.time}</div>
            <div>{data[data.length-1]?.time}</div>
          </div>
          
          <svg width={chartSize.width} height={chartSize.height} className="overflow-visible">
            {/* Area fill */}
            <path
              d={areaPathString}
              fill={`url(#gradient-${dataKey})`}
              opacity="0.2"
            />
            
            {/* Line */}
            <path
              d={pathString}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              className="drop-shadow-glow"
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <g key={index} className="group">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={color}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Tooltip */}
                <g
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  transform={`translate(${point.x - 30}, ${point.y - 30})`}
                >
                  <rect
                    x="0"
                    y="0"
                    width="60"
                    height="25"
                    rx="4"
                    fill="#111827"
                    stroke={color}
                    strokeWidth="1"
                  />
                  <text
                    x="30"
                    y="16"
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontFamily="monospace"
                  >
                    {point.value}
                  </text>
                </g>
              </g>
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </>
      )}
    </div>
  );
};

export default LineChart; 