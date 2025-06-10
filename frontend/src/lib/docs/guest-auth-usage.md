# Guest Authentication System

This document provides an overview of the guest authentication system and how to use it across the application.

## Overview

The guest authentication system allows users to try out the application without creating an account. Guest users can:

- Access most features of the application
- Connect their wallet (data stored locally)
- Make predictions and view results (data stored locally)
- Later convert to a registered account if desired

## How It Works

The guest authentication works by:

1. Creating a temporary user session with a unique ID
2. Storing all guest data in localStorage
3. Providing a seamless experience for guests while keeping their data separate from registered users

## Using Guest Authentication in Components

### Checking Authentication Status

```tsx
import { useAuthState } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, userType, user, guestId } = useAuthState();
  
  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }
  
  // Check if user is a guest
  if (userType === 'guest') {
    return <p>Welcome, Guest!</p>;
  }
  
  return <p>Welcome, {user?.name}!</p>;
}
```

### Starting and Ending Guest Sessions

```tsx
import { useAuthMethods } from '@/lib/hooks/useAuth';

function LoginOptions() {
  const { startGuestSession, endGuestSession } = useAuthMethods();
  
  const handleGuestLogin = async () => {
    await startGuestSession();
    // Navigate to dashboard or other landing page
  };
  
  const handleExitGuestMode = async () => {
    await endGuestSession();
    // Navigate to login or home page
  };
  
  return (
    <div>
      <button onClick={handleGuestLogin}>Continue as Guest</button>
      <button onClick={handleExitGuestMode}>Exit Guest Mode</button>
    </div>
  );
}
```

### Working with Guest Data

To read or write guest-specific data, use the helper functions from `guestStorage.ts`:

```tsx
import { getGuestId, loadGuestData, updateGuestData } from '@/lib/utils/guestStorage';
import { useAuthState } from '@/lib/hooks/useAuth';

function GuestDataComponent() {
  const { userType, guestId } = useAuthState();
  
  // Save data for guest
  const saveGuestPreference = (theme: 'light' | 'dark') => {
    if (userType === 'guest' && guestId) {
      updateGuestData(guestId, (currentData) => ({
        ...currentData,
        preferences: {
          ...currentData.preferences,
          theme
        }
      }));
    }
  };
  
  // Load guest data
  const loadGuestPreferences = () => {
    if (userType === 'guest' && guestId) {
      const guestData = loadGuestData(guestId);
      return guestData.preferences?.theme || 'light';
    }
    return 'light'; // default
  };
  
  return (
    <div>
      <button onClick={() => saveGuestPreference('dark')}>Dark Mode</button>
      <button onClick={() => saveGuestPreference('light')}>Light Mode</button>
      <p>Current theme: {loadGuestPreferences()}</p>
    </div>
  );
}
```

## Guest Session Management

Guest sessions are persisted across page refreshes and browser restarts.

When a guest:
- Registers for a full account: All guest data is automatically cleared
- Logs in to an existing account: All guest data is automatically cleared

The guest session ID and data are stored in localStorage with the following keys:
- `guestId`: The unique identifier for the guest session
- `isGuestSessionActive`: A flag indicating if a guest session is active
- `guest_data_[guestId]`: An object containing all guest-specific data

## Guest Data Schema

The guest data object follows this schema:

```typescript
interface GuestData {
  // Basic user-like properties
  preferences?: {
    theme?: 'light' | 'dark';
    aiVoice?: string;
    [key: string]: any;
  };
  // Wallet connection state
  wallet?: {
    address?: string;
    isConnected: boolean;
    chainId?: number;
  };
  // Application data
  predictions?: Array<any>;
  monitoringData?: Array<any>;
  history?: Array<any>;
  // Can be extended with any other app-specific data
  [key: string]: any;
}
```

## Security Considerations

- Guest data is stored in localStorage and is therefore:
  - Device-specific (not available across devices)
  - Vulnerable to clearing if the user clears browser data
  - Limited in size (5-10MB typically)
- Do not store sensitive information in guest data
- Communicate limitations to guest users with a banner or notice 