import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  
  useEffect(() => {
    if (!target || target <= 0) { 
      setValue(target); 
      return; 
    }
    
    const startTime = performance.now() + delay;
    
    const animate = (now: number) => {
      if (now < startTime) { 
        frameRef.current = requestAnimationFrame(animate); 
        return; 
      }
      
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, delay]);
  
  return value;
}
