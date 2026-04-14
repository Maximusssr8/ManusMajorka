import { useEffect, useState } from 'react';

/**
 * Sticky top progress bar. Fills as the user scrolls through the page.
 * Gamifies reading without being gamification — just a data viz.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (scrolled / max) * 100) : 0;
      setProgress(pct);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #10b981 100%)',
          boxShadow: '0 0 12px rgba(99,102,241,0.5)',
        }}
      />
    </div>
  );
}
