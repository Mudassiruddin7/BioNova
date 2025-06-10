'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, Droplets, FlaskRound, Wind, Zap, 
  AlertTriangle, Camera, BarChart2, ChevronDown, ChevronUp, 
  RefreshCw, Download, Maximize2, Minimize2, Volume2, VolumeX,
  LucideIcon
} from 'lucide-react';

// Import components from the centralized location
import LineChart, { HistoricalDataPoint } from '@/components/monitor/LineChart';
import LabSensorCard from '@/components/monitor/LabSensorCard';

// Define TypeScript interfaces for our data structures
interface SensorData {
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

interface SensorDataMap {
  temperature: SensorData;
  humidity: SensorData;
  pH: SensorData;
  co2: SensorData;
  pressure: SensorData;
  oxygen: SensorData;
  [key: string]: SensorData;
}

// Mock sensor data generator
const generateMockSensorData = (): SensorDataMap => {
  return {
    temperature: {
      value: +(22 + Math.random() * 5).toFixed(1),
      unit: '°C',
      status: 'normal'
    },
    humidity: {
      value: +(45 + Math.random() * 25).toFixed(1),
      unit: '%',
      status: 'normal'
    },
    pH: {
      value: +(6.5 + Math.random() * 1.5).toFixed(2),
      unit: 'pH',
      status: 'normal'
    },
    co2: {
      value: +(350 + Math.random() * 150).toFixed(0),
      unit: 'ppm',
      status: 'normal'
    },
    pressure: {
      value: +(1010 + Math.random() * 20).toFixed(1),
      unit: 'hPa',
      status: 'normal'
    },
    oxygen: {
      value: +(20 + Math.random() * 1.5).toFixed(1),
      unit: '%',
      status: 'normal'
    }
  };
};

// Generate historical data
const generateHistoricalData = (hours = 24): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temperature: +(22 + Math.random() * 5).toFixed(1),
      humidity: +(45 + Math.random() * 25).toFixed(1),
      pH: +(6.5 + Math.random() * 1.5).toFixed(2),
      co2: +(350 + Math.random() * 150).toFixed(0),
      oxygen: +(20 + Math.random() * 1.5).toFixed(1),
    });
  }
  
  return data;
};

// Main lab monitor component
export default function LabMonitor() {
  const [sensorData, setSensorData] = useState(generateMockSensorData());
  const [historicalData, setHistoricalData] = useState(generateHistoricalData());
  const [activeChart, setActiveChart] = useState('temperature');
  const [alertStatus, setAlertStatus] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Automatic updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newData = generateMockSensorData();
      
      // Randomly set critical status for demo purposes
      if (Math.random() > 0.9) {
        const sensors = Object.keys(newData);
        const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];
        newData[randomSensor].status = 'critical';
        setAlertStatus(randomSensor);
        
        // Reset alert after 3 seconds
        setTimeout(() => setAlertStatus(null), 3000);
      }
      
      setSensorData(newData);
      
      // Update historical data
      setHistoricalData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temperature: newData.temperature.value,
          humidity: newData.humidity.value,
          pH: newData.pH.value,
          co2: newData.co2.value,
          oxygen: newData.oxygen.value,
        };
        
        return [...prev.slice(1), newPoint];
      });
      
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };
  
  // Handle export/snapshot
  const takeSnapshot = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sensorData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `lab-snapshot-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  // Icons for sensor cards
  const sensorIcons: Record<string, LucideIcon> = {
    temperature: Thermometer,
    humidity: Droplets,
    pH: FlaskRound,
    co2: Wind,
    pressure: BarChart2,
    oxygen: Zap
  };
  
  // Colors for sensors
  const sensorColors: Record<string, string> = {
    temperature: '#ff2fc5',
    humidity: '#00ffe3',
    pH: '#8eff8b',
    co2: '#bb9af7',
    pressure: '#ff9e64',
    oxygen: '#7aa2f7'
  };
  
  return (
    <div className="min-h-screen w-full bg-gray-950 text-white">
      {/* Alert overlay */}
      <AnimatePresence>
        {alertStatus && (
          <motion.div
            className="fixed inset-0 bg-red-600/10 z-50 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.2, 0.5, 0.8] }}
          >
            <motion.div 
              className="bg-gray-900/80 backdrop-blur-md p-6 rounded-xl border border-red-500 shadow-xl shadow-red-500/20 max-w-md"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="flex items-center mb-2">
                <AlertTriangle className="text-red-500 mr-2" />
                <h3 className="text-xl font-semibold text-red-400">Critical Alert</h3>
              </div>
              <p className="text-gray-300">
                {alertStatus.charAt(0).toUpperCase() + alertStatus.slice(1)} 
                {' has reached a critical level of '}
                <span className="text-white font-medium">
                  {sensorData[alertStatus].value} {sensorData[alertStatus].unit}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Lab Monitoring System
          </motion.h1>
          
          <div className="flex space-x-3">
            <motion.button
              className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </motion.button>
            
            <motion.button
              className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </motion.button>
            
            <motion.button
              className="bg-indigo-600/30 backdrop-blur-sm text-indigo-300 px-4 py-2 rounded-full hover:bg-indigo-600/50 transition-colors flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={takeSnapshot}
            >
              <Camera size={16} className="mr-2" />
              Take Snapshot
            </motion.button>
            
            <motion.button
              className="bg-cyan-600/30 backdrop-blur-sm text-cyan-300 px-4 py-2 rounded-full hover:bg-cyan-600/50 transition-colors flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {}}
            >
              <Download size={16} className="mr-2" />
              Export Data
            </motion.button>
          </div>
        </div>
        
        {/* Lab Health Score */}
        <motion.div 
          className="mb-10 backdrop-blur-md bg-gray-900/50 rounded-3xl border border-gray-800 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium">Lab Health Status</h2>
              <p className="text-gray-400">Overall system conditions</p>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="h-3 w-3 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm text-gray-300">Normal</span>
              </div>
              
              <div className="flex items-center mr-6">
                <div className="h-3 w-3 rounded-full bg-yellow-400 mr-2"></div>
                <span className="text-sm text-gray-300">Warning</span>
              </div>
              
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-400 mr-2"></div>
                <span className="text-sm text-gray-300">Critical</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Sensor Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {Object.entries(sensorData).map(([key, sensor], index) => (
            <motion.div
              key={key}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <LabSensorCard
                title={key.charAt(0).toUpperCase() + key.slice(1)}
                value={sensor.value}
                unit={sensor.unit}
                status={sensor.status}
                icon={sensorIcons[key]}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Charts Section */}
        <motion.div 
          className="backdrop-blur-md bg-gray-900/50 rounded-3xl border border-gray-800 p-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Real-Time Monitoring</h2>
            
            <div className="flex space-x-2">
              {Object.keys(sensorData).map(key => (
                <motion.button
                  key={key}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeChart === key 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                  onClick={() => setActiveChart(key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="h-64">
            <LineChart 
              data={historicalData} 
              dataKey={activeChart} 
              color={sensorColors[activeChart]} 
            />
          </div>
        </motion.div>
        
        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Section */}
          <motion.div 
            className="backdrop-blur-md bg-gray-900/50 rounded-3xl border border-gray-800 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-xl font-medium mb-4">Activity Log</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center p-2 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                <div>
                  <p className="text-white">System initialized</p>
                  <p className="text-gray-400 text-xs">Today, 9:30 AM</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mr-3"></div>
                <div>
                  <p className="text-white">Humidity level warning</p>
                  <p className="text-gray-400 text-xs">Today, 10:15 AM</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-3"></div>
                <div>
                  <p className="text-white">Scheduled maintenance</p>
                  <p className="text-gray-400 text-xs">Today, 11:00 AM</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-400 mr-3"></div>
                <div>
                  <p className="text-white">Temperature critical alert</p>
                  <p className="text-gray-400 text-xs">Today, 11:42 AM</p>
                </div>
              </div>
              
              <div className="flex items-center p-2 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                <div>
                  <p className="text-white">All parameters stable</p>
                  <p className="text-gray-400 text-xs">Today, 12:30 PM</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Control Panel (placeholder) */}
          <motion.div 
            className="backdrop-blur-md bg-gray-900/50 rounded-3xl border border-gray-800 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-xl font-medium mb-4">System Controls</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/70 p-4 rounded-xl">
                <h3 className="font-medium mb-2 text-gray-300">Temperature Control</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold">{sensorData.temperature.value}°C</span>
                  <div className="flex">
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-l-md">
                      <ChevronDown size={18} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-r-md">
                      <ChevronUp size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/70 p-4 rounded-xl">
                <h3 className="font-medium mb-2 text-gray-300">Humidity Control</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold">{sensorData.humidity.value}%</span>
                  <div className="flex">
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-l-md">
                      <ChevronDown size={18} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-r-md">
                      <ChevronUp size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/70 p-4 rounded-xl">
                <h3 className="font-medium mb-2 text-gray-300">CO₂ Level</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold">{sensorData.co2.value} ppm</span>
                  <div className="flex">
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-l-md">
                      <ChevronDown size={18} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-r-md">
                      <ChevronUp size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/70 p-4 rounded-xl">
                <h3 className="font-medium mb-2 text-gray-300">Oxygen Level</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold">{sensorData.oxygen.value}%</span>
                  <div className="flex">
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-l-md">
                      <ChevronDown size={18} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-r-md">
                      <ChevronUp size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Add a custom CSS for things like scrollbars and glowing effects */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 2px var(--color)); }
          50% { filter: drop-shadow(0 0 10px var(--color)); }
        }
      `}</style>
    </div>
  );
} 