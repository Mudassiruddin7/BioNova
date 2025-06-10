/*!
 * ScrollSmoother compatibility module
 * This file provides a fallback for code that tries to import ScrollSmoother directly
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Create a compatibility class that provides the basic ScrollSmoother API
class ScrollSmoother {
  static version = "3.12.7";
  
  constructor() {
    console.warn("ScrollSmoother: Using compatibility shim. The actual ScrollSmoother plugin is not available.");
    this.scrollTop = 0;
    this.progress = 0;
  }
  
  static create(vars) {
    console.warn("ScrollSmoother: Using compatibility shim. The actual ScrollSmoother plugin is not available.");
    return new ScrollSmoother();
  }
  
  static get() {
    return ScrollSmoother._instance || (ScrollSmoother._instance = new ScrollSmoother());
  }
  
  static refresh(safe) {
    ScrollTrigger.refresh(safe);
  }
  
  content(element) {
    if (element) return this;
    return document.documentElement;
  }
  
  effects() {
    return [];
  }
  
  getVelocity() {
    return 0;
  }
  
  kill() {
    ScrollSmoother._instance = null;
  }
  
  offset(target, position, ignoreSpeed) {
    return 0;
  }
  
  paused(value) {
    if (value !== undefined) return this;
    return false;
  }
  
  refresh(soft, force) {
    ScrollTrigger.refresh(soft);
  }
  
  scrollTo(target, smooth, position) {
    if (typeof target === "number") {
      window.scrollTo(0, target);
    } else if (target && typeof target === "string") {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
    }
  }
  
  scrollTop(position) {
    if (position !== undefined) {
      window.scrollTo(0, position);
      return this;
    }
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }
  
  wrapper(element) {
    if (element) return this;
    return document.documentElement;
  }
}

// Export both default and named export for maximum compatibility
export { ScrollSmoother };
export default ScrollSmoother; 