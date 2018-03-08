const merge = require('webpack-merge');
const baseConfig = require('./base.config.js');
const path = require('path');
const StyleLintPlugin = require('stylelint-webpack-plugin');

const prjRoot = path.join(__dirname, '..');

// const styleLintPluginConfig = new StyleLintPlugin({
//   failOnError: false,
//   syntax: 'scss',
//   quiet: false
// });

module.exports = merge(baseConfig, {

  devtool: 'source-map',
  // plugins: [styleLintPluginConfig],

  devServer: {
    historyApiFallback: true,
    contentBase: [path.join(prjRoot, 'public'), path.join(prjRoot, 'node_modules')],
    compress: true
  },
});
