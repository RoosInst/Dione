const merge = require('webpack-merge');
const baseConfig = require('./base.config.js');
const path = require('path');
const StyleLintPlugin = require('stylelint-webpack-plugin');

const prjRoot = path.join(__dirname, '..');

const styleLintPluginConfig = new StyleLintPlugin({
  syntax: 'scss',
  emitErrors: true
});

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            emitWarning: true
          }
        }
      }
    ]
  },

  devServer: {
    historyApiFallback: true,
    contentBase: path.join(prjRoot, 'public'),
    compress: true,
    stats: 'minimal'
  },

  plugins: [styleLintPluginConfig]
});
