import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         regular multi-file build in dist/ (used for GitHub Pages)
// `npm run build:single`  one self-contained dist/index.html that also opens with a double click
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: { target: 'es2020' },
}));
