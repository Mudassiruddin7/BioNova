declare module 'gsap/ScrollTrigger' {
  export const ScrollTrigger: any;
}

declare module 'gsap' {
  export const gsap: any;
}

declare module '@studio-freight/lenis' {
  export default class Lenis {
    constructor(options: any);
    on(event: string, callback: any): void;
    raf(time: number): void;
    destroy(): void;
  }
} 