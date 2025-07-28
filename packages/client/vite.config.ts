/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from 'path'

export default defineConfig({
  resolve: {
    alias: [
      { find: 'assets', replacement: path.resolve(__dirname, '/src/assets') },
      { find: 'components', replacement: path.resolve(__dirname, '/src/components') },
      { find: 'config', replacement: path.resolve(__dirname, '/src/config') },
      { find: 'constants', replacement: path.resolve(__dirname, '/src/constants') },
      { find: 'contexts', replacement: path.resolve(__dirname, '/src/contexts') },
      { find: 'guards', replacement: path.resolve(__dirname, '/src/guards') },
      { find: 'hooks', replacement: path.resolve(__dirname, '/src/hooks') },
      { find: 'services', replacement: path.resolve(__dirname, '/src/services') },
      { find: 'types', replacement: path.resolve(__dirname, '/src/types') },
      { find: 'themes', replacement: path.resolve(__dirname, '/src/themes') },
      { find: 'utils', replacement: path.resolve(__dirname, '/src/utils') }
    ]
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['json', 'html'],
      exclude: ['node_modules/']
    }
  }
})
