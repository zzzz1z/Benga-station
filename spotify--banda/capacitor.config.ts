import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zzzz1z.bengastation',
  appName: 'Benga Station',
  webDir: 'out',
  server: {
    url: 'http://46.62.149.125',
    cleartext: true,
  },
};

export default config;