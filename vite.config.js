import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Load env vars with VITE_ prefix
  const isDev = mode === 'development'
  const serverPort = process.env.PORT || 8081

  return {
    plugins: [react()],

    // Define global constants available in client code
    define: {
      __DEV__: isDev,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    },

    server: {
      port: 3000,
      host: true, // Listen on all addresses (useful for Docker/network access)

      // Proxy API calls to Express server
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false
        },
        '/metrics': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false
        },
        '/healthz': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    },

    build: {
      // Optimize bundle
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            react: ['react', 'react-dom'],
            ui: ['zustand', 'clsx', 'react-markdown', 'dompurify'],
            icons: ['react-icons'],
            flow: ['reactflow']
          }
        }
      },
      // Generate source maps in development
      sourcemap: isDev
    },

    preview: {
      port: 3000,
      host: true
    },

    // CSS preprocessing
    css: {
      devSourcemap: isDev
    },

    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'reactflow',
        'react-markdown',
        'dompurify'
      ]
    }
  }
})