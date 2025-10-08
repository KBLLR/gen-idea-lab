// .storybook/main.js
import { mergeConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

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
        '@ui': r('../src/design-system'),
        '@shared': r('../src/shared'),
        '@routes': r('../src/shared/lib/routes.js'),
        '@store': r('../src/shared/lib/store.js'),
        '@apps': r('../src/apps'),
        '@components': r('../src/components'),
        '@hooks': r('../src/shared/hooks'),
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
