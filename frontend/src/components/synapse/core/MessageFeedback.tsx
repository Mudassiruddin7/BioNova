'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { synapseAPI } from '../../../lib/api';

interface MessageFeedbackProps {
  sessionId: string;
  messageId: string;
  onFeedbackSubmitted?: () => void;
}

const MessageFeedback: React.FC<MessageFeedbackProps> = ({ 
  sessionId, 
  messageId,
  onFeedbackSubmitted
}) => {
  const [feedbackState, setFeedbackState] = useState<'initial' | 'positive' | 'negative' | 'comment' | 'submitted'>('initial');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePositiveFeedback = async () => {
    setFeedbackState('positive');
    await submitFeedback('positive');
  };
  
  const handleNegativeFeedback = () => {
    setFeedbackState('negative');
  };
  
  const submitFeedback = async (type: 'positive' | 'negative' | 'specific', specificRatings?: any) => {
    try {
      setIsSubmitting(true);
      
      await synapseAPI.submitFeedback(
        sessionId,
        messageId,
        type,
        {
          comment: comment.trim() !== '' ? comment : undefined,
          specificRatings
        }
      );
      
      setFeedbackState('submitted');
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCommentSubmit = async () => {
    await submitFeedback('negative', undefined);
  };
  
  const resetFeedback = () => {
    setFeedbackState('initial');
    setComment('');
  };
  
  if (feedbackState === 'submitted') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1 text-xs text-emerald-400 mt-1"
      >
        <CheckCircle className="h-3 w-3" />
        <span>Feedback received</span>
      </motion.div>
    );
  }
  
  return (
    <div className="mt-1">
      {feedbackState === 'initial' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePositiveFeedback}
            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-emerald-400 transition-all"
            aria-label="Helpful"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>Helpful</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNegativeFeedback}
            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-amber-400 transition-all"
            aria-label="Not helpful"
          >
            <ThumbsDown className="h-3 w-3" />
            <span>Not helpful</span>
          </motion.button>
        </motion.div>
      )}
      
      {feedbackState === 'negative' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2"
        >
          <div className="flex items-start space-x-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What was wrong with the response? (optional)"
              className="flex-1 text-xs p-2 border border-indigo-500/30 rounded-lg bg-slate-800/80 text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-indigo-400/50 shadow-inner"
              rows={2}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetFeedback}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
          
          <div className="flex justify-end mt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCommentSubmit}
              disabled={isSubmitting}
              className="text-xs bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-1.5 rounded-lg hover:from-indigo-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 shadow-md shadow-indigo-900/20 transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MessageFeedback; 