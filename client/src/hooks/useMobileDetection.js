import { useState, useEffect } from 'react';
import { MOBILE_UI_ENABLED } from '../config/features';

export const useMobileDetection = (breakpoint = 1024) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // With the mobile UI disabled every viewport is treated as desktop,
      // so the responsive desktop site renders on phones too.
      setIsMobile(MOBILE_UI_ENABLED && window.innerWidth <= breakpoint);
    };

    // Check on mount
    checkMobile();
    setIsMounted(true);

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return { isMobile, isMounted };
};
