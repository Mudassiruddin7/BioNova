'use client';

import React, { useState, useEffect } from 'react';
import { useAuthState } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getGuestId,
  loadGuestData,
  updateGuestData,
  isGuestSessionActive
} from '@/lib/utils/guestStorage';

/**
 * This component demonstrates how to handle guest user data.
 * It shows:
 * 1. How to check if the user is a guest
 * 2. How to load data from localStorage for guests
 * 3. How to save data to localStorage for guests
 * 4. How to manage different UI states based on authentication type
 */
export default function GuestDataExample() {
  const { isAuthenticated, userType, user } = useAuthState();
  const isGuest = userType === 'guest';
  const [isMounted, setIsMounted] = useState(false);
  
  // Sample user data
  const [userData, setUserData] = useState<{
    notes: string[];
    preferences: {
      theme?: string;
    }
  }>({
    notes: [],
    preferences: { theme: 'light' }
  });
  
  const [newNote, setNewNote] = useState('');
  
  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load data when component mounts
  useEffect(() => {
    if (isMounted) {
      loadUserData();
    }
  }, [isAuthenticated, userType, isMounted]);
  
  // Function to load data (handles both guest and registered users)
  const loadUserData = () => {
    if (!isAuthenticated) return;
    
    if (isGuest) {
      // Load data from localStorage for guests
      const guestId = getGuestId();
      if (guestId && isGuestSessionActive()) {
        const guestData = loadGuestData(guestId);
        
        // If guest data exists, use it
        if (guestData) {
          setUserData({
            notes: guestData.notes || [],
            preferences: guestData.preferences || { theme: 'light' }
          });
        }
      }
    } else {
      // For registered users, we would typically load from API
      // This is just a mock example
      console.log('Would load data for registered user:', user?.id);
      
      // In a real implementation, you would call your API
      // Example: loadUserDataFromApi(user.id);
    }
  };
  
  // Function to save data (handles both guest and registered users)
  const saveNote = () => {
    if (!newNote.trim() || !isAuthenticated) return;
    
    // Create updated notes array
    const updatedNotes = [...userData.notes, newNote.trim()];
    
    if (isGuest) {
      // For guests, save to localStorage
      const guestId = getGuestId();
      if (guestId) {
        updateGuestData(guestId, (currentData) => ({
          ...currentData,
          notes: updatedNotes
        }));
        
        // Update local state as well
        setUserData({
          ...userData,
          notes: updatedNotes
        });
      }
    } else {
      // For registered users, we would typically save to API
      // This is just a mock example
      console.log('Would save note for registered user:', user?.id, newNote);
      
      // In a real implementation, you would call your API
      // Example: saveNoteToApi(user.id, newNote);
      
      // Then update local state after successful API call
      setUserData({
        ...userData,
        notes: updatedNotes
      });
    }
    
    // Clear input field
    setNewNote('');
  };
  
  // Function to toggle theme preference
  const toggleTheme = () => {
    const newTheme = userData.preferences.theme === 'light' ? 'dark' : 'light';
    
    if (isGuest) {
      // For guests, save to localStorage
      const guestId = getGuestId();
      if (guestId) {
        updateGuestData(guestId, (currentData) => ({
          ...currentData,
          preferences: {
            ...currentData.preferences,
            theme: newTheme
          }
        }));
      }
    } else {
      // For registered users, save to API
      console.log('Would save theme preference for registered user:', user?.id, newTheme);
      // Example: savePreferencesToApi(user.id, { theme: newTheme });
    }
    
    // Update local state
    setUserData({
      ...userData,
      preferences: {
        ...userData.preferences,
        theme: newTheme
      }
    });
  };
  
  // Don't render anything during SSR or before mounting
  if (!isMounted) {
    return null;
  }
  
  // If not authenticated at all, show limited UI
  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Please Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You need to sign in to view and manage your data.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          User Data Example
          {isGuest && <span className="ml-2 text-sm text-amber-500">(Guest Mode)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Your current theme preference:</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">{userData.preferences.theme}</span>
            <Button onClick={toggleTheme} size="sm">
              Toggle Theme
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Label htmlFor="new-note">Add a Note</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Type a note..."
            />
            <Button onClick={saveNote}>Save</Button>
          </div>
        </div>
        
        <div className="pt-4">
          <h3 className="font-medium mb-2">Your Notes</h3>
          {userData.notes.length > 0 ? (
            <ul className="space-y-1">
              {userData.notes.map((note, index) => (
                <li key={index} className="text-sm p-2 bg-secondary/50 rounded">
                  {note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No notes yet. Add one above.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {isGuest ? (
          "Your data is stored locally in this browser and will be lost if you clear your browser data."
        ) : (
          "Your data is securely stored in our database."
        )}
      </CardFooter>
    </Card>
  );
} 