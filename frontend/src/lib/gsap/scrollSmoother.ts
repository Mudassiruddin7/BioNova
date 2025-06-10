/**
 * ScrollSmoother Compatibility Module
 * 
 * This is a minimal compatibility layer for projects that were using ScrollSmoother
 * but now need to work without it. It provides a no-op implementation that won't
 * cause import errors.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Define interface to match ScrollSmoother's API
interface EffectsVars {
  speed?: number | string | ((index: number, element: Element) => number | string);
  lag?: number | ((index: number, element: Element) => number);
  effectsPadding?: number | string | ((index: number, element: Element) => number | string);
}

interface ScrollSmootherVars {
  smooth?: boolean | number;
  effects?: boolean | gsap.DOMTarget;
  content?: gsap.DOMTarget;
  wrapper?: gsap.DOMTarget;
  normalizeScroll?: boolean | any;
  ignoreMobileResize?: boolean;
  smoothTouch?: boolean | number;
  onUpdate?: (self: ScrollSmootherCompat) => any;
  onStop?: (self: ScrollSmootherCompat) => any;
  onFocusIn?: (self: ScrollSmootherCompat, e: Event) => any;
  speed?: number;
  ease?: string | ((progress: number) => number);
  effectsPrefix?: string;
  effectsPadding?: number;
  autoResize?: boolean;
}

// Create a minimal compatibility class that matches the ScrollSmoother API
class ScrollSmootherCompat {
  static version: string = "3.12.7";
  scrollTop: number = 0;
  progress: number = 0;
  scrollTrigger: ScrollTrigger | null = null;
  private static _instance: ScrollSmootherCompat | null = null;

  constructor(vars?: ScrollSmootherVars) {
    console.warn('ScrollSmoother is not available. Using compatibility layer instead.');
    
    // Save any content/wrapper elements
    this._content = typeof vars?.content === 'string' 
      ? document.querySelector(vars.content as string) 
      : document.documentElement;
      
    this._wrapper = typeof vars?.wrapper === 'string'
      ? document.querySelector(vars.wrapper as string)
      : document.documentElement.parentElement || document.body;
  }

  private _content: Element | null = null;
  private _wrapper: Element | null = null;
  private _paused: boolean = false;

  // Static methods
  static create(vars?: ScrollSmootherVars): ScrollSmootherCompat {
    console.warn('ScrollSmoother is not available. Using compatibility layer instead.');
    return ScrollSmootherCompat._instance || (ScrollSmootherCompat._instance = new ScrollSmootherCompat(vars));
  }

  static get(): ScrollSmootherCompat | undefined {
    return ScrollSmootherCompat._instance || undefined;
  }

  static refresh(safe?: boolean): void {
    ScrollTrigger.refresh(safe);
  }

  // Instance methods
  content(element?: gsap.DOMTarget): Element | ScrollSmootherCompat {
    if (element) {
      this._content = typeof element === 'string' ? document.querySelector(element) : element as Element;
      return this;
    }
    return this._content || document.documentElement;
  }

  effects(targets?: gsap.DOMTarget, vars?: EffectsVars | null): ScrollTrigger[] {
    return [];
  }

  getVelocity(): number {
    return 0;
  }

  kill(): void {
    ScrollSmootherCompat._instance = null;
  }

  offset(target: gsap.DOMTarget, position?: string, ignoreSpeed?: boolean): number {
    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (element) {
        return element.getBoundingClientRect().top + window.scrollY;
      }
    }
    return 0;
  }

  paused(value?: boolean): boolean | ScrollSmootherCompat {
    if (value !== undefined) {
      this._paused = value;
      return this;
    }
    return this._paused;
  }

  refresh(soft?: boolean, force?: boolean): void {
    ScrollTrigger.refresh(soft);
  }

  scrollTo(target: gsap.DOMTarget | number, smooth?: boolean, position?: string): void {
    if (typeof target === 'number') {
      window.scrollTo({
        top: target,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } else if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: position?.includes('top') ? 'start' :
                 position?.includes('bottom') ? 'end' : 'center',
          inline: position?.includes('left') ? 'start' :
                 position?.includes('right') ? 'end' : 'center'
        });
      }
    }
  }

  scrollTop(position?: number): number | ScrollSmootherCompat {
    if (position !== undefined) {
      window.scrollTo({ top: position });
      this.scrollTop = position;
      return this;
    }
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  wrapper(element?: gsap.DOMTarget): Element | ScrollSmootherCompat {
    if (element) {
      this._wrapper = typeof element === 'string' ? document.querySelector(element) : element as Element;
      return this;
    }
    return this._wrapper || document.documentElement;
  }
}

// Export as default and named export
export { ScrollSmootherCompat as ScrollSmoother };
export default ScrollSmootherCompat; 