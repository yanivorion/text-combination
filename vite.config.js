import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/text-combinations-v2/',
  server: { port: 7777 },
});
