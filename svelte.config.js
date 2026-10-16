import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({
    postcss: false,
  }),

  kit: {
    adapter: adapter(),
    csrf: {
      checkOrigin: false
    },
    // The auth token lives in localStorage, so the main goal is that injected scripts can't run.
    // connect-src stays wide open because the API and websocket URLs are only known at runtime
    // (PUBLIC_API_URL / PUBLIC_WEBSOCKET_API), while this config is read at build time.
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:', 'http:', 'https:'],
        'media-src': ['self', 'blob:', 'http:', 'https:'],
        'font-src': ['self', 'data:'],
        'connect-src': ['self', 'blob:', 'http:', 'https:', 'ws:', 'wss:'],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self']
      }
    }
  },
  vitePlugin: {
    inspector: true
  }
};

export default config;
