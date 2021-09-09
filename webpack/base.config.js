/* eslint-disable no-unused-vars */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const cssLoaderOptions = {
  importLoaders: 1,
  modules: {
    localIdentName: `[path]__[name]__[local]__7`,  //CANT USE HASH HERE FOR SOME REASON .... PRODUCES DIFFERENT NUMBERS FROM SCOPED NAME
  },
  sourceMap: true,
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
          //options now just in .babelrc
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
    filename: 'bundle.[fullhash].min.js',
    publicPath: '/'
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'head'
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.[fullhash].min.css'
    }),
    new NodePolyfillPlugin()
  ],
};

