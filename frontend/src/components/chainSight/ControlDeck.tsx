"use client";

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Users, Grid, Network } from 'lucide-react';
import { useChainSightStore, ExperimentType } from '@/lib/stores/chainSightStore';
import { EFFECTS, DNA_COLORS } from '@/lib/constants/designTokens';

export const ControlDeck = () => {
  const { 
    search, setSearch, 
    filters, toggleExperimentTypeFilter, setDateRangeFilter, setLoggedByFilter, 
    viewMode, setViewMode, 
    sortOrder, setSortOrder 
  } = useChainSightStore();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Handle filter toggle
  const handleFilterToggle = (type: ExperimentType) => {
    toggleExperimentTypeFilter(type);
  };

  // Apply date range filter
  const applyDateRange = () => {
    if (dateRange[0] && dateRange[1]) {
      setDateRangeFilter([dateRange[0].getTime(), dateRange[1].getTime()]);
    } else {
      setDateRangeFilter(null);
    }
    setIsCalendarOpen(false);
  };

  // Clear date range filter
  const clearDateRange = () => {
    setDateRange([null, null]);
    setDateRangeFilter(null);
    setIsCalendarOpen(false);
  };

  // Switch view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'helix' : 'grid');
  };

  // Handle sort order change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as any);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      className="mb-8"
    >
      <div 
        className="w-full rounded-xl p-4"
        style={{
          background: EFFECTS.glassMorphism.background,
          backdropFilter: EFFECTS.glassMorphism.backdropFilter,
          border: EFFECTS.glassMorphism.border,
          boxShadow: EFFECTS.shadows.medium,
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-grow">
            <div 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              style={{ color: DNA_COLORS.text.muted }}
            >
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by ID, Address, Gene..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 text-white"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                focusRing: `2px solid ${DNA_COLORS.primary}`
              }}
            />
          </div>
          
          {/* Filter Pills */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="flex gap-2">
              {(['prediction', 'sensor', 'manual'] as ExperimentType[]).map((type) => {
                const isActive = filters.experimentTypes.includes(type);
                return (
                  <motion.button
                    key={type}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5`}
                    style={{
                      background: isActive 
                        ? type === 'prediction' 
                          ? 'rgba(0, 255, 255, 0.2)' 
                          : type === 'sensor' 
                            ? 'rgba(255, 0, 255, 0.2)' 
                            : 'rgba(0, 255, 127, 0.2)'
                        : 'rgba(30, 30, 60, 0.5)',
                      border: `1px solid ${isActive 
                        ? type === 'prediction' 
                          ? DNA_COLORS.primary 
                          : type === 'sensor' 
                            ? DNA_COLORS.secondary 
                            : DNA_COLORS.tertiary
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      color: isActive ? '#ffffff' : DNA_COLORS.text.secondary,
                      boxShadow: isActive ? `0 0 10px rgba(${type === 'prediction' ? '0, 255, 255' : type === 'sensor' ? '255, 0, 255' : '0, 255, 127'}, 0.2)` : 'none'
                    }}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: `0 0 12px rgba(${type === 'prediction' ? '0, 255, 255' : type === 'sensor' ? '255, 0, 255' : '0, 255, 127'}, 0.3)`
                    }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleFilterToggle(type)}
                  >
                    <span>
                      {type === 'prediction' ? '🧪' : type === 'sensor' ? '📊' : '📝'}
                    </span>
                    <span className="capitalize">{type}</span>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Date Range Filter */}
            <div className="relative">
              <motion.button
                className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5"
                style={{
                  background: filters.dateRange ? 'rgba(255, 215, 0, 0.2)' : 'rgba(30, 30, 60, 0.5)',
                  border: filters.dateRange ? `1px solid ${DNA_COLORS.status.warning}` : '1px solid rgba(255, 255, 255, 0.1)',
                  color: filters.dateRange ? '#ffffff' : DNA_COLORS.text.secondary
                }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: `0 0 12px rgba(255, 215, 0, 0.3)`
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <Calendar size={14} />
                <span>{filters.dateRange ? 'Date Range' : 'All Dates'}</span>
              </motion.button>
              
              {/* Calendar Dropdown - Simplified for this example */}
              {isCalendarOpen && (
                <div
                  className="absolute top-full left-0 mt-2 p-4 rounded-lg z-20"
                  style={{
                    background: EFFECTS.glassMorphism.background,
                    backdropFilter: EFFECTS.glassMorphism.backdropFilter,
                    border: EFFECTS.glassMorphism.border,
                    boxShadow: EFFECTS.shadows.large,
                    width: '240px'
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">Start Date:</div>
                      <input 
                        type="date" 
                        className="w-full bg-black bg-opacity-30 border border-gray-700 rounded p-1 text-white text-sm"
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDateRange([date, dateRange[1]]);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">End Date:</div>
                      <input 
                        type="date" 
                        className="w-full bg-black bg-opacity-30 border border-gray-700 rounded p-1 text-white text-sm"
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDateRange([dateRange[0], date]);
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        className="flex-1 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded"
                        onClick={applyDateRange}
                      >
                        Apply
                      </button>
                      <button 
                        className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                        onClick={clearDateRange}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <motion.button
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: EFFECTS.glows.cyan
            }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleViewMode}
          >
            {viewMode === 'grid' ? (
              <Grid size={18} className="text-cyan-400" />
            ) : (
              <Network size={18} className="text-cyan-400" />
            )}
          </motion.button>
          
          {/* Sort Order Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 text-white"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                focusRing: `2px solid ${DNA_COLORS.primary}`
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="recordId">Record ID</option>
            </select>
            <div 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
              style={{ color: DNA_COLORS.text.muted }}
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 