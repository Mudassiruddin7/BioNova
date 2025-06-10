// This is a temporary shim to provide ScrollSmoother functionality
// when the actual GSAP Club plugin is not available

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Create a minimal compatibility class
class ScrollSmootherCompat {
  static create(vars: any) {
    console.warn('ScrollSmoother is not available. Using compatibility layer.');
    return new ScrollSmootherCompat();
  }

  static get() {
    return undefined;
  }

  static refresh(safe?: boolean) {
    ScrollTrigger.refresh(safe);
  }

  scrollTo() {
    // No-op
  }

  effects() {
    return [];
  }

  kill() {
    // No-op
  }
}

// Export as default and named export
export { ScrollSmootherCompat as ScrollSmoother };
export default ScrollSmootherCompat; 