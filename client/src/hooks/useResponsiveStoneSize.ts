import { useState, useEffect } from 'react';

interface StoneSize {
  width: number;
  height: number;
  fontSize: number;
  borderRadius: number;
}

export const useResponsiveStoneSize = (): StoneSize => {
  const [stoneSize, setStoneSize] = useState<StoneSize>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return getStoneSize(width);
  });

  useEffect(() => {
    const handleResize = () => {
      setStoneSize(getStoneSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    // Set initial size
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return stoneSize;
};

const getStoneSize = (width: number): StoneSize => {
  if (width < 375) {
    return { width: 24, height: 32, fontSize: 9, borderRadius: 3 };
  } else if (width < 480) {
    return { width: 28, height: 36, fontSize: 10, borderRadius: 4 };
  } else if (width < 640) {
    return { width: 32, height: 40, fontSize: 11, borderRadius: 5 };
  } else if (width < 768) {
    return { width: 36, height: 44, fontSize: 12, borderRadius: 6 };
  } else if (width < 1024) {
    return { width: 44, height: 52, fontSize: 14, borderRadius: 8 };
  } else if (width < 1280) {
    return { width: 52, height: 60, fontSize: 16, borderRadius: 10 };
  } else {
    return { width: 60, height: 68, fontSize: 18, borderRadius: 12 };
  }
};