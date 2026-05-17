import { useState, useEffect } from 'react';

const KEY = 'benga:crossfade';

export const useCrossfade = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem(KEY) === '1');
  }, []);

  const toggle = () => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(KEY, next ? '1' : '0');
      return next;
    });
  };

  return { enabled, toggle };
};