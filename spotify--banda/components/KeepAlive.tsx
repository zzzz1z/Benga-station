'use client';

import { useEffect } from 'react';

const KeepAlive = () => {
  useEffect(() => {
    const ping = () => {
      fetch('/api/keepalive').catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default KeepAlive;