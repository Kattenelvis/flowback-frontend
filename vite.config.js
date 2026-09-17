import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  optimizeDeps: {
    exclude: ['chart.js']
  },
  server: {
    port: 4000,
    strictPort: true
  }
};

export default config;
