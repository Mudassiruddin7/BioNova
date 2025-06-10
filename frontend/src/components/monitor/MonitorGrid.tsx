'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMonitor } from '@/lib/hooks/useMonitor';
import { SensorCard } from './SensorCard';
import { Card } from '@/components/ui/card';
import { AIAssistant } from '@/components/ai/AIAssistant';

export function MonitorGrid() {
  const {
    temperature,
    humidity,
    pressure,
    light,
    co2,
    insights,
    isLoading,
    isSocketConnected,
    getLatestData,
  } = useMonitor();

  // Load initial data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        await getLatestData();
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchData();
  }, [getLatestData]);

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold text-gray-800">Lab Environment</h2>
        <div className="flex items-center">
          <span className={`inline-block h-2 w-2 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-500">
            {isSocketConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </motion.div>

      {/* Sensor grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Temperature */}
        <SensorCard type="temperature" readings={temperature} />
        
        {/* Humidity */}
        <SensorCard type="humidity" readings={humidity} />
        
        {/* Pressure */}
        {pressure && pressure.length > 0 && (
          <SensorCard type="pressure" readings={pressure} />
        )}
        
        {/* Light */}
        {light && light.length > 0 && (
          <SensorCard type="light" readings={light} />
        )}
        
        {/* CO2 */}
        {co2 && co2.length > 0 && (
          <SensorCard type="co2" readings={co2} />
        )}
      </div>

      {/* AI Assistant with insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AIAssistant
          context="lab-monitor"
          systemMessage="You are a laboratory environment expert. You provide insights on environmental conditions and how they might affect biological experiments. Be concise and informative in your responses."
          contextData={{
            temperature: temperature.length > 0 ? temperature[temperature.length - 1] : null,
            humidity: humidity.length > 0 ? humidity[humidity.length - 1] : null,
            pressure: pressure && pressure.length > 0 ? pressure[pressure.length - 1] : null,
            light: light && light.length > 0 ? light[light.length - 1] : null,
            co2: co2 && co2.length > 0 ? co2[co2.length - 1] : null,
          }}
          initialMessage={insights || "I can help you understand how these environmental conditions might affect your experiments. Ask me anything about optimal lab conditions."}
        />
      </motion.div>
    </div>
  );
} 