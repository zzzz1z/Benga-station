import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zzzz1z.bengastation',
  appName: 'Benga Station',
  webDir: 'out',
  ios: {
    handleApplicationNotifications: true,
    allowsLinkPreview: false,
  },
};

export default config;