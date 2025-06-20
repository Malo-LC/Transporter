import { Options } from '@swc/core';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

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
        additionalData: '@use \'@scssVariables\' as *;',
      },
    },
  },
  resolve: {
    alias: {
      '@scssVariables': path.resolve(__dirname, 'assets/scss/variables'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@i18n': path.resolve(__dirname, 'src/i18n'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@services': path.resolve(__dirname, 'src/services'),
    },
  },
});
