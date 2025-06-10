import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { groqAPI, profileAPI } from '../api';
import { useOnboardingStore } from '../store';

export function useOnboarding() {
  const router = useRouter();
  const {
    role,
    experienceLevel,
    interests,
    chatHistory,
    setRole,
    setExperienceLevel,
    setInterests,
    addChatMessage,
    setCompleted,
    clearChatHistory,
  } = useOnboardingStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send message to onboarding chat
  const sendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to chat history
      const userMessage = { role: 'user' as const, content: message };
      addChatMessage(userMessage);
      
      // Make API call to Groq onboarding chat
      const response = await groqAPI.onboardingChat(message, chatHistory);
      
      // Extract profile data
      const { message: aiMessage, profileData } = response.data.data;
      
      // Add AI response to chat history
      const assistantMessage = { role: 'assistant' as const, content: aiMessage };
      addChatMessage(assistantMessage);
      
      // Update profile information based on AI analysis
      if (profileData) {
        if (profileData.role) setRole(profileData.role);
        if (profileData.experienceLevel) setExperienceLevel(profileData.experienceLevel);
        if (profileData.interests) setInterests(profileData.interests);
      }
      
      return assistantMessage;
    } catch (err: any) {
      console.error('Onboarding chat error:', err);
      
      // Enhanced error handling - extract the most useful error message
      let errorMessage = 'Failed to process message';
      
      if (err.response?.data?.message) {
        // Use server-provided error message
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication error - please log in again';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests - please try again later';
      } else if (err.message.includes('Network Error')) {
        errorMessage = 'Network error - please check your connection';
      } else if (err.message) {
        // Use the error message directly
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete onboarding process
  const completeOnboarding = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update user profile with onboarding information
      await profileAPI.updateOnboarding({
        role,
        experienceLevel,
        interests,
      });
      
      // Mark onboarding as completed
      setCompleted(true);
      
      // Redirect to dashboard
      router.push('/dashboard');
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to complete onboarding';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset onboarding
  const resetOnboarding = () => {
    setRole('student');
    setExperienceLevel('beginner');
    setInterests([]);
    clearChatHistory();
    setCompleted(false);
  };

  return {
    role,
    experienceLevel,
    interests,
    chatHistory,
    isLoading,
    error,
    sendMessage,
    completeOnboarding,
    resetOnboarding,
  };
} 