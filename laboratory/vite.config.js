import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'
import { developmentSourcePlugin } from './scripts/development-source.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), developmentSourcePlugin(loadEnv(mode, process.cwd(), 'ADAMS_').ADAMS_DEV_DATA)],
  base: './',
}))
