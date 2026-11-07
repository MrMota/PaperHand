import type { CapacitorConfig } from '@capacitor/cli';

// The Android app packages the built web app (dist/) so it runs fully offline, no server needed.
// appId is permanent once the app is uploaded to Google Play: change it before the first upload if you want another.
const config: CapacitorConfig = {
  appId: 'com.mrmota.paperhand',
  appName: 'Paperhand',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#F3F2EF',
  },
};

export default config;
