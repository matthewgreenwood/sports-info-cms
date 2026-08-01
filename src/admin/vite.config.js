const { mergeConfig } = require('vite');

module.exports = (config) => {
  return mergeConfig(config, {
    optimizeDeps: {
      include: [
        'hoist-non-react-statics',
        'hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js',
        'fast-deep-equal',
        'fast-deep-equal/index.js',
      ],
    },
  });
};
