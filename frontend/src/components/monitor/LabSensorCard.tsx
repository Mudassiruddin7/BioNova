'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, RefreshCw } from 'lucide-react';

export interface LabSensorCardProps {
  title: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: LucideIcon;
}

const LabSensorCard = ({ title, value, unit, status, icon: Icon }: LabSensorCardProps) => {
  const statusColors = {
    normal: '#8eff8b',
    warning: '#ffdb58',
    critical: '#ff4242'
  };
  
  const [flipped, setFlipped] = useState(false);
  
  // Generate sample historical values for detail view
  const historyValues = [
    { time: '1h ago', value: +(value - Math.random()).toFixed(2) },
    { time: '30m ago', value: +(value - Math.random() * 0.5).toFixed(2) },
    { time: '15m ago', value: +(value - Math.random() * 0.2).toFixed(2) },
    { time: 'Now', value: value }
  ];
  
  return (
    <motion.div
      className="relative h-52 perspective-1000"
      onClick={() => setFlipped(!flipped)}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className={`absolute w-full h-full rounded-3xl bg-gray-900/70 backdrop-blur-md border border-gray-800 p-4
          transition-all transform-gpu cursor-pointer`}
        initial={false}
        animate={{
          rotateY: flipped ? 180 : 0,
          boxShadow: `0 0 20px 2px ${statusColors[status]}40`
        }}
        style={{
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="relative h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${statusColors[status]}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: statusColors[status] }} />
              </div>
              <h3 className="text-lg font-medium text-white">{title}</h3>
            </div>
            
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusColors[status] }}
            />
          </div>
          
          <div className="flex flex-col items-center justify-center flex-grow">
            <motion.div 
              className="text-5xl font-light"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-white">{value}</span>
              <span className="text-white/60 text-3xl ml-1">{unit}</span>
            </motion.div>
          </div>
          
          <div className="text-gray-400 text-xs flex justify-between items-center">
            <span className="uppercase tracking-wider">{status}</span>
            <span className="flex items-center">
              <RefreshCw className="w-3 h-3 mr-1" />
              Live
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* Back of card (flipped) */}
      <motion.div
        className={`absolute w-full h-full rounded-3xl bg-gray-900/70 backdrop-blur-md border border-gray-800 p-4
          transition-all transform-gpu cursor-pointer`}
        initial={false}
        animate={{
          rotateY: flipped ? 0 : -180,
          boxShadow: `0 0 20px 2px ${statusColors[status]}40`
        }}
        style={{
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="relative h-full flex flex-col">
          <h3 className="text-lg font-medium text-white mb-2">{title} History</h3>
          
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {historyValues.map((item, index) => (
              <div key={index} className="flex justify-between mb-3">
                <span className="text-gray-400">{item.time}</span>
                <span className="text-white font-medium">{item.value} {unit}</span>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-400 mt-2 flex justify-end">
            Tap to flip back
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LabSensorCard; 