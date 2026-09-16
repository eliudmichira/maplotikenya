import { useEffect } from 'react';

const isDev = import.meta.env.DEV;

const PerformanceMonitor = () => {
  useEffect(() => {
    if (!isDev) return; // Only in development; avoid console noise in production

    // Track Core Web Vitals
    const trackWebVitals = () => {
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log('FID:', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          // Only log CLS if it degrades significantly (>0.01 is noticeable)
          if (clsValue > 0.01) console.log('CLS:', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            console.log('FCP:', entry.startTime);
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      }
    };

    // Track resource loading performance - only log truly slow resources (>2s)
    const trackResourcePerformance = () => {
      if ('PerformanceObserver' in window) {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 2000) {
              console.warn('Slow resource:', {
                name: entry.name,
                duration: Math.round(entry.duration),
                size: entry.transferSize
              });
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      }
    };

    // Track long tasks - only log tasks >200ms (typical React renders are 16-50ms)
    const trackLongTasks = () => {
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 200) {
              console.warn('Long task detected:', {
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime)
              });
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      }
    };

    trackWebVitals();
    trackResourcePerformance();
    trackLongTasks();

    window.addEventListener('load', () => {
      const t = performance.timing;
      const loadTime = t.loadEventEnd > 0 && t.navigationStart >= 0
        ? Math.max(0, t.loadEventEnd - t.navigationStart)
        : 0;
      console.log('Page load time:', loadTime + 'ms');
    });

  }, []);

  return null;
};

export default PerformanceMonitor;
