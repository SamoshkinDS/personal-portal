import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Основная конфигурация для Vite
export default defineConfig({
  plugins: [react()],

  // ⚙️ Оптимизация зависимостей (ускоряет сборку)
  optimizeDeps: {
    include: ['framer-motion'],
  },

  // ⚙️ Игнорируем ворнинги вида "use client" из framer-motion
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.message &&
          warning.message.includes('"use client"')
        ) {
          return
        }
        warn(warning)
      },
    },
  },
})
