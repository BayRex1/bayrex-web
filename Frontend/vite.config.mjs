import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          react_vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-redux',
            'react-device-detect',
            '@reduxjs/toolkit',
            'zustand',
          ],
          lang: [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
          ],
          utils: [
            'lodash',
            'classnames',
            'dayjs',
            'events',
            '@uidotdev/usehooks'
          ],
          storage: ['dexie'],
          captcha: ['@hcaptcha/react-hcaptcha'],
          data: ['@msgpack/msgpack', 'crypto-js', 'music-metadata'],
          ui: ['framer-motion', 'lottie-react', 'ldrs'],
          code: ['prism-react-renderer', 'react-code-block'],
        },
      },
    },
  },
});
