import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tartDynamicImport from '@tart/vite-plugin-dynamic-import';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tartDynamicImport(),
  ]
});
