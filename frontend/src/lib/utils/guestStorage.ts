import { v4 as uuidv4 } from 'uuid';

// Constants for localStorage keys
const GUEST_ID_KEY = 'guestId';
const GUEST_SESSION_ACTIVE_KEY = 'isGuestSessionActive';
const GUEST_DATA_PREFIX = 'guest_data_';

// Type definition for guest data
export interface GuestData {
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

/**
 * Generates a new UUID for guest identification
 */
export const generateGuestId = (): string => {
  return uuidv4();
};

/**
 * Gets the current guest ID from localStorage
 */
export const getGuestId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GUEST_ID_KEY);
};

/**
 * Checks if a guest session is currently active
 */
export const isGuestSessionActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(GUEST_SESSION_ACTIVE_KEY) === 'true';
};

/**
 * Creates a new guest session
 */
export const createGuestSession = (): string => {
  if (typeof window === 'undefined') return '';
  
  const guestId = generateGuestId();
  localStorage.setItem(GUEST_ID_KEY, guestId);
  localStorage.setItem(GUEST_SESSION_ACTIVE_KEY, 'true');
  
  // Initialize empty guest data
  saveGuestData(guestId, {});
  
  return guestId;
};

/**
 * Saves guest data to localStorage
 */
export const saveGuestData = (guestId: string, data: GuestData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const dataString = JSON.stringify(data);
    localStorage.setItem(`${GUEST_DATA_PREFIX}${guestId}`, dataString);
  } catch (error) {
    console.error('Failed to save guest data:', error);
  }
};

/**
 * Loads guest data from localStorage
 */
export const loadGuestData = (guestId: string | null): GuestData => {
  if (typeof window === 'undefined' || !guestId) return {};
  
  try {
    const dataString = localStorage.getItem(`${GUEST_DATA_PREFIX}${guestId}`);
    if (!dataString) return {};
    
    return JSON.parse(dataString) as GuestData;
  } catch (error) {
    console.error('Failed to load guest data:', error);
    return {};
  }
};

/**
 * Updates a specific section of guest data
 */
export const updateGuestData = (
  guestId: string | null, 
  updater: (currentData: GuestData) => GuestData
): void => {
  if (typeof window === 'undefined' || !guestId) return;
  
  try {
    const currentData = loadGuestData(guestId);
    const updatedData = updater(currentData);
    saveGuestData(guestId, updatedData);
  } catch (error) {
    console.error('Failed to update guest data:', error);
  }
};

/**
 * Clears all guest data from localStorage
 */
export const clearGuestData = (guestId: string | null): void => {
  if (typeof window === 'undefined' || !guestId) return;
  
  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(GUEST_SESSION_ACTIVE_KEY);
  localStorage.removeItem(`${GUEST_DATA_PREFIX}${guestId}`);
  
  console.log('Guest session data cleared');
};

/**
 * Ends the current guest session and clears data
 */
export const endGuestSession = (): void => {
  const guestId = getGuestId();
  clearGuestData(guestId);
}; 