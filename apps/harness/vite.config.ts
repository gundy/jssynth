import { defineConfig } from 'vite'

export default defineConfig({
  // Resolve workspace packages to their TS source for a fast dev loop (no rebuild
  // of the libs needed while iterating on the harness).
  resolve: {
    alias: {
      '@gundy/jssynth-core': new URL('../../packages/core/src/index.ts', import.meta.url).pathname,
      '@gundy/jssynth-tracker': new URL('../../packages/tracker/src/index.ts', import.meta.url).pathname,
      '@gundy/jssynth-web-audio': new URL('../../packages/web-audio/src/index.ts', import.meta.url).pathname,
    },
  },
})
