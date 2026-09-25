import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// goofs.io launcher — apex domain. Tiles link out to game subdomains.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  preview: { port: 5173 },
});
