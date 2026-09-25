import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AdGame.exe — served at /adgame/ so it can be proxied through the launcher
// (goofs.io/adgame → goofs-adgame.vercel.app/adgame). Standalone
// goofs-adgame.vercel.app root redirects to /adgame/ via vercel.json.
export default defineConfig({
  base: '/adgame/',
  plugins: [react()],
  server: { port: 5174, host: true },
  preview: { port: 5174 },
});
