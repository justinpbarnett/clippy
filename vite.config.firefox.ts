import { defineConfig } from 'vite';
import webExtension from '@samrum/vite-plugin-web-extension';
import manifest from './manifest.firefox.json';

export default defineConfig({
  build: { outDir: 'dist-firefox' },
  plugins: [webExtension({ manifest })],
});
