const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const config = {
  mode: 'development',
  target: ['web', 'browserslist'],
  devtool: 'eval-source-map',
  entry: {
    app: [
      // Self-hosted: the storage.googleapis.com/code.getmdl.io CDN Google used to serve
      // this from was permanently shut down (~June 2026). See README "Known issues".
      'material-design-lite/dist/material.light_green-red.min.css',
      'material-design-lite/dist/material.min.js',
      __dirname + '/../src/js/app/index.js',
      __dirname + '/../src/css/main.less',
    ],
  },
  output: {
    path: __dirname + '/../dist',
    filename: '[name].js',
    chunkFilename: '[id].js',
    assetModuleFilename: 'assets/[name][ext]',
    publicPath: '/',
  },
  devServer: {
    port: 3002,
    host: '0.0.0.0',
    hot: true,
    open: false,
    historyApiFallback: true,
    // El motor Indices vive en dreamers.es; sin este proxy el dev server
    // pediria los CGI a localhost:3002 y todo saldria 404.
    proxy: [
      {
        context: ['/indices', '/com', '/cgi'],
        target: 'https://dreamers.es',
        changeOrigin: true,
        secure: false,
      },
    ],
    client: {
      overlay: { errors: true, warnings: false },
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // Los presets se leen de babel.config.json, para que webpack y
        // eslint compartan exactamente la misma configuracion de Babel.
        use: 'babel-loader',
      },
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader'],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff2?|ttf|eot|svg)$/,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name][ext]' },
      },
      { test: /\.(png|jpe?g|gif)$/, type: 'asset/resource' },
      {
        // Ver la nota en webpack.prod.config.js: las plantillas llevan
        // <%= %> dentro de atributos y html-loader no debe intentar
        // resolverlos como URLs.
        test: /\.html$/,
        use: {
          loader: 'html-loader',
          options: { sources: false, esModule: false, minimize: false },
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'bundle.css' }),
    new HtmlWebpackPlugin({
      template: __dirname + '/../src/index.ejs',
      inject: false,
      favicon: __dirname + '/../src/assets/favicon.ico',
      minify: false,
      appMountId: 'root',
      title: 'The Dreamers',
      description: 'Dreamers en desarrollo',
      unsupportedBrowser: false,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      // Permite apuntar el front a otro dominio durante el desarrollo. En
      // produccion queda indefinido y el dominio se deduce del actual.
      'process.env.ENDPOINTS_ROOT_DOMAIN': JSON.stringify('dreamers.es'),
      'process.env.VERSION': JSON.stringify(require('../package.json').version),
    }),
    new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /^\.\/(en|es)$/),
  ],
  resolve: {
    alias: {
      underscore: 'lodash',
    },
  },
};

module.exports = config;
