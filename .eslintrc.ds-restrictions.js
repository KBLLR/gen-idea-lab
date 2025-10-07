module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '**/src/components/ui/**',
            ],
            message: 'Use @ui (design-system) instead of importing from src/components/ui/**',
          },
        ],
      },
    ],
  },
};
