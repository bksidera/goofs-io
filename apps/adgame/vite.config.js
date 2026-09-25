import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// adgame.goofs.io — endless runner. Standalone app.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, host: true },
  preview: { port: 5174 },
});
