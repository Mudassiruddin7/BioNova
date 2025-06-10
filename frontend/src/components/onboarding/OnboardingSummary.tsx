'use client';

import { motion } from 'framer-motion';
import { Check, Edit } from 'lucide-react';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OnboardingSummaryProps {
  onEdit: () => void;
}

export function OnboardingSummary({ onEdit }: OnboardingSummaryProps) {
  const { role, experienceLevel, interests, completeOnboarding, isLoading } = useOnboarding();

  const getRoleDisplay = () => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'researcher':
        return 'Researcher';
      case 'other':
        return 'Other';
      default:
        return 'Not specified';
    }
  };

  const getLevelDisplay = () => {
    switch (experienceLevel) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return 'Not specified';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Role</h3>
            <p className="mt-1 text-lg font-semibold">{getRoleDisplay()}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Experience Level</h3>
            <p className="mt-1 text-lg font-semibold">{getLevelDisplay()}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Interests</h3>
            {interests.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-gray-600">No specific interests identified</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Button
            className="w-full"
            onClick={() => completeOnboarding()}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Complete Setup & Continue
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
} 