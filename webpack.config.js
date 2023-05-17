const { resolve } = require('node:path');

module.exports = function(options) {
  return {
    ...options,
    entry: './src/main.ts',
    target: 'node',
    mode: 'development',
    output: {
      path: resolve(__dirname, 'dist'),
      filename: 'bundle.js',
    },

  };
};