import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Formato de fecha y hora de compilación (ej. 2026.11.20 23:05)
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const buildDateTime = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildDateTime)
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/vitest-setup.ts']
  }
});
