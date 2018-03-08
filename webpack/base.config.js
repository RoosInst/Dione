const webpack = require('webpack');
const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
//const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const defineAPIURL = new webpack.DefinePlugin({
  'API_URL': JSON.stringify(process.env.API_URL)
});

const htmlWebpackPluginConfig = new HTMLWebpackPlugin({
  template: './src/index.html',
  filename: 'index.html'
  // inject: 'head'
});

// const scriptExtHtmlWebpackPluginConfig = new ScriptExtHtmlWebpackPlugin({
//   defaultAttribute: 'defer'
// });

const extractStyle = new ExtractTextPlugin({
  filename: 'styles.[hash].min.css'
});

const cssLoaderOptions = {
  importLoaders: 1,
  modules: true,
  sourceMap: true,
  localIdentName: '[path]___[name]__[local]___[hash:base64:5]'
};

const cssGlobalLoaderOptions = {
  importLoaders: 1,
  sourceMap: true,
};

const postCSSLoaderOptions = {
  sourceMap: true,
  plugins: [require('autoprefixer')()]
};


module.exports = {

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
          use: extractStyle.extract({
            fallback: 'style-loader',
            use: [
              {loader: 'css-loader', options: cssGlobalLoaderOptions},
              {loader: 'postcss-loader', options: postCSSLoaderOptions}
            ]
          })
        }, {
          use: extractStyle.extract({
            fallback: 'style-loader',
            use: [
              {loader: 'css-loader', options: cssLoaderOptions},
              {loader: 'postcss-loader', options: postCSSLoaderOptions}
            ]
          })
        }],
      },
      {
        test: /\.scss$/,
        oneOf: [{
          resourceQuery: /global/,
          use: extractStyle.extract({
            fallback: 'style-loader',
            use: [
              {loader: 'css-loader', options: cssGlobalLoaderOptions},
              {loader: 'postcss-loader', options: postCSSLoaderOptions},
              {loader: 'sass-loader', options: {sourceMap: true}}
            ]
          })
        }, {
          use: extractStyle.extract({
            fallback: 'style-loader',
            use: [
              {loader: 'css-loader', options: cssLoaderOptions},
              {loader: 'postcss-loader', options: postCSSLoaderOptions},
              {loader: 'sass-loader', options: {sourceMap: true}}
            ]
          })
        }]
      }
    ]
  },

  output: {
    filename: 'bundle.[hash].min.js',
    path: path.join(__dirname, '..', 'build'),
    publicPath: '/'
  },

  plugins: [
    defineAPIURL, htmlWebpackPluginConfig, //scriptExtHtmlWebpackPluginConfig,
    extractStyle,
  ],
};
