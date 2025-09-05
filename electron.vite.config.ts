import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwind from "@tailwindcss/vite"

export default defineConfig({
  main: {
    build:{
      rollupOptions: {external:["electron"]}
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build:{
      rollupOptions: {external:["electron"]}
    },
  }, 
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@main': resolve('src/main'),
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwind()]
  }
})
