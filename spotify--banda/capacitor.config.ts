import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zzzz1z.bengastation',
  appName: 'Benga Station',
  // Next.js uses standard public asset resolution for the native runner wrapper
  webDir: 'public', 
  server: {
    url: 'https://benga-station.vercel.app',
    cleartext: false,
  },
  plugins: {
    BackgroundRunner: {
      label: 'com.zzzz1z.bengastation.refresh',
      src: 'background.js', // Points directly to public/background.js
      event: 'backgroundFetch',
      repeat: true,
      interval: 15
    }
  }
};

export default config;