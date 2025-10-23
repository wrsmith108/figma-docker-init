export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: false, // Keep ES modules for Jest
      },
    ],
  ],
};