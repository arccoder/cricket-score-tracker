import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is the critical line: it ensures paths are relative to your repo name
  base: '/cricket-score-tracker/',
})