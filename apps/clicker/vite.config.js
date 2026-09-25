import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// clicker.goofs.io — narrative clicker engine, first arc = crypto.
export default defineConfig({
  plugins: [react()],
  server: { port: 5175, host: true },
  preview: { port: 5175 },
});
