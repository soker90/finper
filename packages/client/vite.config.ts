import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: 'themes', replacement: path.resolve(__dirname, '/src/themes') },
      { find: 'hooks', replacement: path.resolve(__dirname, '/src/hooks') },
      { find: 'contexts', replacement: path.resolve(__dirname, '/src/contexts') },
      { find: 'components', replacement: path.resolve(__dirname, '/src/components') },
      { find: 'config', replacement: path.resolve(__dirname, '/src/config') },
      { find: 'utils', replacement: path.resolve(__dirname, '/src/utils') },
      { find: 'services', replacement: path.resolve(__dirname, '/src/services') }
    ]
  },
  plugins: [react()]
})
