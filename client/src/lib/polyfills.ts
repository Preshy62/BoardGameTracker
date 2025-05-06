// Polyfill for global which is used by simple-peer but not available in browsers
if (typeof window !== 'undefined' && !window.global) {
  (window as any).global = window;
}

export {};