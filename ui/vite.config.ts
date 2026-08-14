import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import * as os from 'os';

export default defineConfig({
  plugins: [react()],
  // Store Vite dependency cache in OS temp directory to avoid Dropbox file sync locks
  cacheDir: path.join(os.tmpdir(), 'git-music-vite-cache'),
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
