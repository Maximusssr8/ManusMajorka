export function measureRender(label: string) {
  if (import.meta.env.MODE !== 'development') return () => {};
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) {
      console.warn(`[PERF] ${label} took ${duration.toFixed(1)}ms`);
    }
  };
}
