// FIX: Removed the triple-slash directive for Vitest types.
// The `defineConfig` function imported from `vitest/config` already provides
// the necessary types, and the directive was causing a type resolution error.
// Changed import to 'vitest/config' to include test configuration types.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
  },
})
