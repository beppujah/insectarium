import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` produces a single dist/index.html that also opens with a double click,
// like the original prototype. The plugin will be dropped for the PWA and app stores.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2020' },
});
