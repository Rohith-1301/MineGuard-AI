import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/sensor-proxy': {
        target: 'http://10.234.213.131',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sensor-proxy/, ''),
        timeout: 2500,
        proxyTimeout: 2500,
      },
      '/rover-sensor-proxy': {
        target: 'http://10.234.213.131',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rover-sensor-proxy/, ''),
        timeout: 2500,
        proxyTimeout: 2500,
      },
      '/env-sensor-proxy': {
        target: 'http://10.234.213.174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/env-sensor-proxy/, ''),
        timeout: 2500,
        proxyTimeout: 2500,
      },
      '/camera-stream': {
        target: 'http://192.168.43.84:81',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream/, '/stream'),
        timeout: 5000,
        proxyTimeout: 5000,
      },
      '/camera-stream-p80': {
        target: 'http://192.168.43.84',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream-p80/, '/stream'),
        timeout: 5000,
        proxyTimeout: 5000,
      },
      '/camera-stream-raw': {
        target: 'http://192.168.43.84',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream-raw/, '/'),
        timeout: 5000,
        proxyTimeout: 5000,
      }
    }
  },
  preview: {
    port: 3000,
    host: true,
    proxy: {
      '/sensor-proxy': {
        target: 'http://10.234.213.131',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sensor-proxy/, ''),
        timeout: 2500,
        proxyTimeout: 2500,
      },
      '/rover-sensor-proxy': {
        target: 'http://10.234.213.131',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rover-sensor-proxy/, ''),
        timeout: 2500,
        proxyTimeout: 2500,
      },
      '/env-sensor-proxy': {
        target: 'http://10.234.213.174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/env-sensor-proxy/, ''),
        timeout: 2500,
        proxyTimeout: 2500,
      },
      '/camera-stream': {
        target: 'http://192.168.43.84:81',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream/, '/stream'),
        timeout: 5000,
        proxyTimeout: 5000,
      },
      '/camera-stream-p80': {
        target: 'http://192.168.43.84',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream-p80/, '/stream'),
        timeout: 5000,
        proxyTimeout: 5000,
      },
      '/camera-stream-raw': {
        target: 'http://192.168.43.84',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/camera-stream-raw/, '/'),
        timeout: 5000,
        proxyTimeout: 5000,
      }
    }
  }
});
