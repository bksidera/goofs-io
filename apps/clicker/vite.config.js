import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Crypto Clicker — served at /clicker/ so it can be proxied through the
// launcher (goofs.io/clicker → goofs-clicker.vercel.app/clicker). Standalone
// goofs-clicker.vercel.app root redirects to /clicker/ via vercel.json.
export default defineConfig({
  base: '/clicker/',
  plugins: [react()],
  server: { port: 5175, host: true },
  preview: { port: 5175 },
});
