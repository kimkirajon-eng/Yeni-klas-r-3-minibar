import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hotel.minibar.personel',
  appName: 'Personel Minibar',
  webDir: 'dist',
  server: {
    url: process.env.VITE_API_URL || 'http://localhost:3001',
    cleartext: true,
  },
};

export default config;
