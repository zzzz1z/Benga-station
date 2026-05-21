'use client';

import { useEffect } from 'react';

const KeepAlive = () => {
  useEffect(() => {
    const ping = () => {
      fetch('/api/keepalive', { method: 'GET' }).catch(() => {});
    };

    // Run instantly on mount when app opens
    ping();

    // Loop every 4 minutes
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
};

export default KeepAlive;