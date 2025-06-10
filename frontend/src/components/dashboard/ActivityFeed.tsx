import React from 'react';
import { useActivityData } from '@/lib/hooks/useActivityData';
import { Button } from '@/components/ui/button';
import { Dna, ExternalLink, ChevronDown, FileText, Activity as ActivityIcon, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface ActivityFeedProps {
  limit?: number;
}

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const { activities, isLoading, error, totalCount } = useActivityData();
  
  // Format timestamp to readable format
  const formatTime = (timestamp: Date | number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Get icon based on activity type and status
  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'prediction':
        return <Dna className="h-5 w-5 text-purple-400" />;
      case 'transaction':
        if (status === 'confirmed') return <CheckCircle className="h-5 w-5 text-green-400" />;
        if (status === 'pending') return <Clock className="h-5 w-5 text-yellow-400" />;
        if (status === 'failed') return <XCircle className="h-5 w-5 text-red-400" />;
        return <ExternalLink className="h-5 w-5 text-blue-400" />;
      case 'monitoring':
        return <ActivityIcon className="h-5 w-5 text-cyan-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Get appropriate URL for activity details view
  const getActivityUrl = (activity: any) => {
    switch (activity.type) {
      case 'prediction':
        return `/dashboard/gene/${activity.data._id}`;
      case 'transaction':
        return `https://sepolia.basescan.org/tx/${activity.data.hash}`;
      default:
        return '#';
    }
  };
  
  // Render the activity feed content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-8 bg-red-900/10 rounded-lg border border-red-500/10">
          <p className="text-red-300">{error}</p>
        </div>
      );
    }
    
    if (activities.length === 0) {
      return (
        <motion.div 
          className="text-center py-12 bg-indigo-900/10 rounded-lg border border-indigo-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FileText className="h-12 w-12 mx-auto mb-4 text-indigo-400/50" />
          <p className="text-lg text-indigo-300">No activity found</p>
          <p className="text-sm text-indigo-300/70 mt-1">Your recent actions will appear here</p>
        </motion.div>
      );
    }
    
    return (
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.map((activity, index) => (
            <motion.div 
              key={activity.id}
              className="flex justify-between p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20 hover:bg-indigo-900/30 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-indigo-900/40 p-2 rounded-full mt-1">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {activity.title}
                    {activity.type === 'transaction' && activity.status && (
                      <span className={`ml-2 text-sm ${
                        activity.status === 'confirmed' ? 'text-green-400' : 
                        activity.status === 'pending' ? 'text-yellow-400' : 
                        activity.status === 'failed' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        ({activity.status})
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-indigo-300/70 mt-1">
                    {activity.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <p className="text-sm text-indigo-300/70">
                  {formatTime(activity.timestamp)}
                </p>
                {activity.type !== 'monitoring' && (
                  <Link 
                    href={getActivityUrl(activity)}
                    target={activity.type === 'transaction' ? "_blank" : undefined}
                    className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1"
                  >
                    View Details
                    <ChevronDown className="h-3 w-3 rotate-270" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };
  
  return (
    <div className="activity-feed">
      {renderContent()}
      
      {/* Show load more button if we have more items than our limit */}
      {!isLoading && !error && activities.length > 0 && totalCount > activities.length && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-600/30 text-indigo-100"
            onClick={() => {/* Implementation for loading more activities */}}
          >
            Load More
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 