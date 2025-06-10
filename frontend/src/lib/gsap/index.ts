/**
 * GSAP and plugins
 * This file provides a centralized place to import and register all GSAP plugins
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the plugins we need
gsap.registerPlugin(ScrollTrigger);

// Re-export everything
export { gsap, ScrollTrigger };

// Export our ScrollSmoother compatibility layer
export { ScrollSmoother } from './scrollSmoother'; 