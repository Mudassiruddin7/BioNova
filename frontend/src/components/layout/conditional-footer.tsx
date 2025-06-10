'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't render the footer on the homepage
  if (pathname === '/') {
    return null;
  }
  
  return <Footer />;
} 