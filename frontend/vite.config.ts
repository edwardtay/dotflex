import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util']
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    include: [
      'bn.js',
      '@polkadot/api',
      '@polkadot/util',
      '@polkadot/util-crypto'
    ]
  },
  define: {
    global: 'globalThis'
  }
})

