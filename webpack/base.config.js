/* eslint-disable no-unused-vars */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const cssLoaderOptions = {
  importLoaders: 1,
  modules: true,
  sourceMap: true,
  localIdentName: '[path]_[name]_[local]_[hash:base64:5]'
};

const cssGlobalLoaderOptions = {
  importLoaders: 1,
  sourceMap: true,
};

const postCSSLoaderOptions = {
  sourceMap: true
};


module.exports = {
  devServer: {
    port: 9229
  }, 
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            'presets': ['react', 'env', 'stage-0'],
            'plugins': [['react-css-modules',
              {
                'filetypes': {
                  '.scss': {'syntax': 'postcss-scss'}
                }
              }
            ]]
          }
        }
      },
      {
        test: /\.css$/,
        oneOf: [{
          resourceQuery: /global/,
          use: [
            MiniCssExtractPlugin.loader,
            {loader: 'css-loader', options: cssGlobalLoaderOptions},
            {loader: 'postcss-loader', options: postCSSLoaderOptions}
          ]

        }, {
          use: [
            MiniCssExtractPlugin.loader,
            {loader: 'css-loader', options: cssLoaderOptions},
            {loader: 'postcss-loader', options: postCSSLoaderOptions}
          ]

        }],
      },
      {
        test: /\.scss$/,
        oneOf: [{
          resourceQuery: /global/,
          use: [
            MiniCssExtractPlugin.loader,
            {loader: 'css-loader', options: cssGlobalLoaderOptions},
            {loader: 'postcss-loader', options: postCSSLoaderOptions},
            {loader: 'sass-loader', options: {sourceMap: true}}
          ]
        }, {
          use: [
            MiniCssExtractPlugin.loader,
            {loader: 'css-loader', options: cssLoaderOptions},
            {loader: 'postcss-loader', options: postCSSLoaderOptions},
            {loader: 'sass-loader', options: {sourceMap: true}}
          ]
        }]
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      }
    ]
  },

  output: {
    filename: 'bundle.[hash].min.js',
    publicPath: '/'
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'head'
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.[hash].min.css'
    })
  ],
};
