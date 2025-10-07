// .storybook/main.js
import { mergeConfig } from 'vite';
import path from 'node:path';

/** @type { import('@storybook/react-vite').StorybookConfig } */
export default {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  docs: { autodocs: 'tag' },
  viteFinal: async (config) => mergeConfig(config, {
    server: {
      ...(config.server || {}),
      headers: {
        ...((config.server && config.server.headers) || {}),
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
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
        '@shared/hooks': '/src/shared/hooks',
      },
    },
    esbuild: {
      loader: 'jsx',
      include: [/src\/.*\.(js|jsx)$/, /.storybook\/.*\.(js|jsx)$/],
    },
    define: {
      'import.meta.env.VITE_DEFAULT_APP': JSON.stringify('idealab'),
    },
    optimizeDeps: {
      entries: ['src/design-system/**/*.{js,jsx}', 'src/**/*.stories.@(js|jsx|ts|tsx)'],
    },
  }),
};
