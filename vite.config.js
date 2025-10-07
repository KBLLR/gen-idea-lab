import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Load env vars with VITE_ prefix
  const isDev = mode === 'development'
  const serverPort = process.env.PORT || 8081

  return {
    plugins: [react()],

    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.(js|jsx)$/,
      exclude: /server\/|tests\/|node_modules/,
    },

    resolve: {
      alias: {
        '@ui': '/src/design-system',
        '@shared': '/src/shared',
        '@routes': '/src/shared/lib/routes.js',
        '@store': '/src/shared/lib/store.js',
        '@apps': '/src/apps',
        '@components': '/src/components',
        '@hooks': '/src/hooks',
        '@shared/hooks': '/src/shared/hooks'
      }
    },

    // Define global constants available in client code
    define: {
      __DEV__: isDev,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    },

    server: {
      port: 3000,
      host: true, // Listen on all addresses (useful for Docker/network access)

      // Set COOP headers to allow HMR postMessage and OAuth popups
      // Note: COOP warnings in console are expected in dev mode with HMR - they're harmless
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      },

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
        '/ws': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false,
          ws: true  // Enable WebSocket proxying
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
      entries: ['index.html', 'src/main.jsx'],
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
