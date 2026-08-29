const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const config = {
  mode: 'development',
  target: ['web', 'browserslist'],
  devtool: 'eval-source-map',
  entry: {
    app: [
      // Reemplazo propio de material-design-lite (MEJORAS.md §4). Va PRIMERO,
      // en el mismo sitio que ocupaba el CSS de MDL: main.less sobreescribe
      // muchas de estas reglas contando con ganar por orden de aparicion.
      __dirname + '/../src/css/mdl.less',
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
    //
    // Para que esto sirva de algo, las rutas del front tienen que ser
    // RELATIVAS: con URLs absolutas el navegador va directo a dreamers.es,
    // se salta el proxy y la peticion es cross-origin. Ver src/js/app/config.js.
    proxy: [
      {
        // '/ciudad' es del motor clasico y hace falta para el logoff, que va
        // a /ciudad/panelillo/panel.cgi?logoff=1. Sin el, cerrar sesion era la
        // unica llamada que seguia saliendo cross-origin.
        context: ['/indices', '/com', '/cgi', '/ciudad'],
        target: 'https://dreamers.es',
        changeOrigin: true,
        secure: false,
        // La sesion va en cookie. dreamers.es la manda con su dominio, y el
        // navegador la RECHAZA si llega desde localhost. Esto le quita el
        // dominio para que valga como cookie del propio dev server; sin ello
        // el login responde ok y aun asi te quedas fuera a la siguiente
        // peticion. (En http://localhost las cookies Secure si se aceptan,
        // porque el navegador lo trata como contexto seguro; si entras por
        // la IP de la LAN en vez de localhost, no, y volveran a perderse.)
        cookieDomainRewrite: '',
      },
    ],
    client: {
      overlay: { errors: true, warnings: false },
    },
  },
  module: {
    rules: [
      {
        // /\.m?js$/ y no /\.js$/: la logica pura del mosaico vive en .mjs
        // (pack.mjs) para que `node --test` la cargue sin transpilador. Sin esto
        // se colaria en el bundle SIN pasar por babel, y con ella el ES moderno
        // que la browserslist del proyecto todavia transpila.
        test: /\.m?js$/,
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
      // Vacio a proposito: asi config.js deja las rutas relativas y las
      // recoge el proxy de arriba. Estaba puesto a 'dreamers.es', que era
      // justo lo que hacia absolutas las URLs y rompia el login en local.
      // Se puede forzar un dominio con ENDPOINTS_ROOT_DOMAIN=... npm start,
      // pero entonces vuelve el cross-origin y el login deja de ir.
      'process.env.ENDPOINTS_ROOT_DOMAIN': JSON.stringify(process.env.ENDPOINTS_ROOT_DOMAIN || ''),
      'process.env.VERSION': JSON.stringify(require('../package.json').version),
    }),
  ],
  resolve: {
    alias: {
      underscore: 'lodash',
    },
  },
};

module.exports = config;
