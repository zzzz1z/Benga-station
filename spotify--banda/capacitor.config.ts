import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zzzz1z.bengastation',
  appName: 'Benga Station',
  webDir: 'out',
  server: {
    url: 'https://benga-station.vercel.app',
    cleartext: false,
  },
};

export default config;