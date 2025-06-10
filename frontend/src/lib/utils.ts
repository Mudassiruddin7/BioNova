import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines Tailwind CSS classes using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date as a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncates a string to a specific length
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

/**
 * Formats a wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Highlights differences between two sequences
 */
export function highlightDifferences(
  original: string, 
  predicted: string
): { 
  original: string, 
  predicted: string 
} {
  if (original.length !== predicted.length) {
    return {
      original,
      predicted
    };
  }
  
  let originalFormatted = '';
  let predictedFormatted = '';
  
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== predicted[i]) {
      originalFormatted += `<span class="bg-yellow-200 dark:bg-yellow-800">${original[i]}</span>`;
      predictedFormatted += `<span class="bg-green-200 dark:bg-green-800">${predicted[i]}</span>`;
    } else {
      originalFormatted += original[i];
      predictedFormatted += predicted[i];
    }
  }
  
  return {
    original: originalFormatted,
    predicted: predictedFormatted
  };
}
