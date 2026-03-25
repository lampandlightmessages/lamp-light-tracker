// Service worker registration
// This file is loaded by index.html via a <script> tag
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}
