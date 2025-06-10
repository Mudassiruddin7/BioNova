'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Gauge, Sun, Wind } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SensorReading } from '@/lib/types';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'pressure' | 'light' | 'co2';
  readings: SensorReading[];
  className?: string;
}

export function SensorCard({ type, readings, className }: SensorCardProps) {
  const [thresholds, setThresholds] = useState({
    temperature: { min: 18, max: 25 },
    humidity: { min: 30, max: 60 },
    pressure: { min: 980, max: 1030 },
    light: { min: 300, max: 800 },
    co2: { min: 400, max: 1000 },
  });
  
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  
  const getSensorIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-6 w-6 text-red-500" />;
      case 'humidity':
        return <Droplets className="h-6 w-6 text-blue-500" />;
      case 'pressure':
        return <Gauge className="h-6 w-6 text-purple-500" />;
      case 'light':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'co2':
        return <Wind className="h-6 w-6 text-green-500" />;
      default:
        return null;
    }
  };

  const getSensorName = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getSensorUnit = () => {
    switch (type) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'pressure':
        return 'hPa';
      case 'light':
        return 'lux';
      case 'co2':
        return 'ppm';
      default:
        return '';
    }
  };

  // Determine status based on thresholds
  const getStatus = () => {
    if (!latestReading) return 'unknown';
    
    const value = latestReading.value;
    const { min, max } = thresholds[type];
    
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'normal';
  };
  
  const status = getStatus();
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'high':
        return 'bg-red-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Format chart data
  const chartData = readings.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: reading.value,
  }));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("p-4 h-full overflow-hidden", className)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {getSensorIcon()}
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">{getSensorName()}</h3>
              <div className="flex items-center mt-1">
                <span className={cn("flex-shrink-0 inline-block h-2 w-2 rounded-full mr-2", getStatusColor())}></span>
                <span className="text-xs text-gray-500 capitalize">{status}</span>
              </div>
            </div>
          </div>
          {latestReading && (
            <div className="text-right">
              <p className="text-2xl font-semibold">
                {latestReading.value.toFixed(1)}
                <span className="text-sm text-gray-500 ml-1">{getSensorUnit()}</span>
              </p>
              <p className="text-xs text-gray-500">
                {new Date(latestReading.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
        
        {readings.length > 1 && (
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  minTickGap={10}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']} 
                  width={30}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} ${getSensorUnit()}`, getSensorName()]} 
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={
                    type === 'temperature' ? '#ef4444' : 
                    type === 'humidity' ? '#3b82f6' : 
                    type === 'pressure' ? '#8b5cf6' : 
                    type === 'light' ? '#eab308' : 
                    '#22c55e'
                  } 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
} 