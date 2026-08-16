import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Options } from '@swc/core';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const reactPath: string = fs.realpathSync(path.dirname(require.resolve('react/package.json')));
const reactDomPath: string = fs.realpathSync(path.dirname(require.resolve('react-dom/package.json')));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      plugins: [['swc-class-decorator-plugin', {}]],
      useAtYourOwnRisk_mutateSwcOptions: (options: Options) => {
        options.jsc!.experimental!.runPluginFirst = true;
      },
    }),
  ],
  build: {
    outDir: 'build',
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/ws': {
        target: 'ws://localhost:3000', // Use ws:// for the target
        ws: true, // This is essential for WebSockets
        changeOrigin: true,
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      globalModulePaths: [/.+\.global\.module\.(css|scss)$/],
      exportGlobals: true,
    },
    preprocessorOptions: {
      scss: {
        additionalData: "@use '@scssVariables' as *;",
      },
    },
  },
  resolve: {
    // Vite 8 / Rolldown otherwise pre-bundles two React copies (react.js vs a hashed
    // chunk used by react-dom/client), which makes hooks throw "Invalid hook call".
    dedupe: ['react', 'react-dom'],
    alias: {
      // react-dom must be listed before react: a 'react' alias also matches 'react-dom'.
      'react-dom': reactDomPath,
      react: reactPath,
      '@scssVariables': path.resolve(import.meta.dirname, 'assets/scss/variables'),
      '@api': path.resolve(import.meta.dirname, 'src/api'),
      '@components': path.resolve(import.meta.dirname, 'src/components'),
      '@i18n': path.resolve(import.meta.dirname, 'src/i18n'),
      '@lib': path.resolve(import.meta.dirname, 'src/lib'),
      '@services': path.resolve(import.meta.dirname, 'src/services'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
});
