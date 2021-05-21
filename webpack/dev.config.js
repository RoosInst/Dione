const {merge} = require('webpack-merge');
const baseConfig = require('./base.config.js');
const path = require('path');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const prjRoot = path.join(__dirname, '..');

const styleLintPluginConfig = new StyleLintPlugin({
  syntax: 'scss',
  emitErrors: true
});

const esLintPluginConfig = new ESLintPlugin({
  formatter: require('eslint/lib/cli-engine/formatters/stylish'),
  emitWarning: true
});

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'source-map',

  /* module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint/lib/cli-engine/formatters/stylish'),
            emitWarning: true
          }
        }
      }
    ]
  },    
  ESLINT-LOADER IS DEPRECATED
  */  

  devServer: {
    historyApiFallback: true,
    contentBase: path.join(prjRoot, 'public'),
    compress: true,
    stats: 'minimal'
  },

  plugins: [styleLintPluginConfig, esLintPluginConfig]
});
