import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const serverPort = process.env.PORT || 8081
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || ''
  let devPort = 3000
  try {
    if (frontendUrl) {
      const u = new URL(frontendUrl)
      const parsed = Number(u.port)
      if (!Number.isNaN(parsed) && parsed > 0) devPort = parsed
    }
  } catch {}

  return {
    plugins: [react(), ...(isDev ? [] : [visualizer({ filename: 'reports/bundle.html', template: 'treemap', gzipSize: true, brotliSize: true })])],

    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.(js|jsx)$/,
      exclude: /server\/|tests\/|node_modules/,
    },

    resolve: {
      alias: {
        '@ui': r('./src/design-system'),
        '@shared': r('./src/shared'),
        '@routes': r('./src/shared/lib/routes.js'),
        '@store': r('./src/shared/lib/store.js'),
        '@apps': r('./src/apps'),
        '@components': r('./src/components'),
        '@hooks': r('./src/shared/hooks'),
      }
    },

    define: {
      __DEV__: isDev,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    },

    server: {
      port: devPort,
      host: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
      // Don't set COOP/COEP headers in dev - allows HMR postMessage and OAuth popups
      proxy: {
        '/api': { target: `http://localhost:${serverPort}`, changeOrigin: true, secure: false },
        '/auth': { target: `http://localhost:${serverPort}`, changeOrigin: true, secure: false },
        '/ws': { target: `http://localhost:${serverPort}`, changeOrigin: true, secure: false, ws: true },
        '/metrics': { target: `http://localhost:${serverPort}`, changeOrigin: true, secure: false },
        '/healthz': { target: `http://localhost:${serverPort}`, changeOrigin: true, secure: false }
      }
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            ui: ['zustand', 'clsx', 'react-markdown', 'dompurify'],
            icons: ['react-icons'],
            flow: ['reactflow'],
            three: ['three'],
            mediapipe: ['@mediapipe/tasks-vision'],
            human: ['@vladmandic/human'],
            markmap: ['markmap-common', 'markmap-lib', 'markmap-view']
          }
        }
      },
      sourcemap: isDev
    },

    preview: { port: 3000, host: true },

    css: { devSourcemap: isDev },

    optimizeDeps: {
      entries: ['index.html', 'src/main.jsx'],
      include: ['react','react-dom','zustand','reactflow','react-markdown','dompurify','markmap-common','markmap-lib','markmap-view']
    }
  }
})
