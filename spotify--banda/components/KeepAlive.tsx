'use client';

import { useEffect } from 'react';
import { BackgroundFetch } from '@transistorsoft/capacitor-background-fetch';

const KeepAlive = () => {
  useEffect(() => {
    // 1. Standard frontend interval (active when webview is awake)
    const frontendPing = () => {
      fetch('/api/keepalive', { method: 'GET' }).catch(() => {});
    };

    frontendPing();
    const interval = setInterval(frontendPing, 4 * 60 * 1000);

    // 2. Native iOS Core Fetch (fires when webview is frozen/paused)
    const initNativeBackground = async () => {
      try {
        await BackgroundFetch.configure({
          minimumFetchInterval: 15 // iOS minimum allowed interval is 15 minutes
        }, async (taskId) => {
          console.log("[BackgroundFetch] Fired:", taskId);
          
          // Execute the POST request to keep Vercel/VPS warm
          try {
            await fetch('https://benga-station.vercel.app/api/keepalive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trigger: 'ios-native-system', taskId })
            });
          } catch (err) {
            console.error("Keepalive fetch failed", err);
          }
          
          // MUST SIGNAL COMPLETION SO IOS DOES NOT KILL YOUR APP
          BackgroundFetch.finish(taskId);
        }, (status) => {
          console.log("[BackgroundFetch] Status:", status);
        });
      } catch (e) {
        console.log("Not running in a native mobile container.");
      }
    };

    initNativeBackground();

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default KeepAlive;