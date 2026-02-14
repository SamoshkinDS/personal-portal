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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          tiptap: [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-image',
            '@tiptap/extension-underline',
            '@tiptap/extension-color',
            '@tiptap/extension-text-style',
            '@tiptap/extension-table',
            '@tiptap/extension-table-row',
            '@tiptap/extension-table-header',
            '@tiptap/extension-table-cell',
            'prosemirror-view',
            'prosemirror-model',
            'prosemirror-transform',
            'prosemirror-state',
            'prosemirror-commands',
          ],
          recharts: ['recharts'],
        },
      },
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
