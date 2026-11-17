import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// La versión vive solo en package.json: la app la muestra en el menú y Gradle la usa para el APK.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173 },
  test: { environment: 'node' }
});
