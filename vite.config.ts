import { defineConfig } from 'vite';

export default defineConfig({
  // Simplified configuration with zero external plugins to bypass install errors
  build: {
    outDir: 'dist'
  }
});
