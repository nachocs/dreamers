const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');
// La version 6 exporta con nombre; la 0.6 exportaba el constructor directo.
const { WebpackAssetsManifest } = require('webpack-assets-manifest');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const BUILD_NUM = require('../package.json').version;
const CDN_BASE_URL = '/';

const config = {
  mode: 'production',
  // 'browserslist' en package.json manda tanto aqui como en babel y
  // autoprefixer, asi que el objetivo de navegadores se declara UNA vez.
  target: ['web', 'browserslist'],
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
    filename: 'dist/' + BUILD_NUM + '/[name].[contenthash].js',
    chunkFilename: 'dist/' + BUILD_NUM + '/[name].[contenthash].chunk.js',
    // Las fuentes y las imagenes grandes salen por asset modules (antes
    // file-loader/url-loader), asi que su ruta se declara aqui y no en
    // cada regla.
    assetModuleFilename: 'dist/' + BUILD_NUM + '/assets/[name].[hash][ext]',
    publicPath: CDN_BASE_URL,
    clean: true,
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
        // webpack 5 trae asset modules: 'asset/resource' sustituye a
        // file-loader y 'asset' al url-loader con limite (inline en base64
        // por debajo del limite, fichero aparte por encima).
        test: /\.(woff2?|ttf|eot|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'dist/' + BUILD_NUM + '/fonts/[name][ext]',
        },
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 10000 },
        },
      },
      {
        test: /\.html$/,
        // Las plantillas de Backbone se importan como cadena y se compilan
        // con _.template en tiempo de ejecucion, asi que html-loader NO
        // debe tocar sus atributos: <%= %> dentro de un src/href no es una
        // URL que webpack pueda resolver.
        use: {
          loader: 'html-loader',
          options: { sources: false, esModule: false, minimize: false },
        },
      },
    ],
  },
  optimization: {
    moduleIds: 'deterministic',
    minimize: true,
    minimizer: [
      // '...' mantiene el minificador de JS por defecto (terser) y le suma
      // el de CSS. Antes el CSS no se minificaba: extract-text-webpack-plugin
      // no lo hacia y UglifyJsPlugin solo tocaba JS.
      '...',
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'dist/' + BUILD_NUM + '/[name].[contenthash].css',
      chunkFilename: 'dist/' + BUILD_NUM + '/[id].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: __dirname + '/../src/index.ejs',
      inject: false,
      favicon: __dirname + '/../src/assets/favicon.ico',
      manifest: '/manifest.json',
      mobileIcons: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
        // collapseWhitespace por si solo dejaba TODO el html en una sola
        // linea, ilegible para depurar o para leer el fuente de la portada.
        // preserveLineBreaks mantiene un salto por etiqueta y sigue
        // colapsando los espacios redundantes. Cuesta ~6% de tamano.
        preserveLineBreaks: true,
      },
      appMountId: 'root',
      // Las tildes van como entidades HTML para no depender de que la
      // codificacion sobreviva al pipeline de webpack + html-minifier.
      // OJO: pese a la extension .ejs, html-webpack-plugin 5 renderiza la
      // plantilla con lodash/template, donde la semantica es la CONTRARIA
      // que en EJS: <%= %> interpola en crudo y <%- %> escapa HTML. Estas
      // entidades SOLO salen bien con <%= %>; con <%- %> se emite
      // &amp;oacute; y en la pestana se lee 'C&oacute;mics'. Comprobado.
      title: 'Dreamers | C&oacute;mics, cine, series, libros y videojuegos',
      description: 'C&oacute;mics, cine, series, libros, m&uacute;sica y videojuegos. '
        + 'Noticias, cr&iacute;ticas y fichas desde 1998, la comunidad de fans en espa&ntilde;ol.',
      unsupportedBrowser: false,
    }),
    new WebpackAssetsManifest({
      output: 'manifest.json',
      assets: {
        name: 'Dreamers',
        short_name: 'Dreamers',
        start_url: 'https://dreamers.es',
        theme_color: 'black',
        display: 'standalone',
        background_color: 'black',
        description: 'La red social friki!',
        version: JSON.stringify(require('../package.json').version),
        icons: [
          {
            src: '/assets/android-icon-36x36.png',
            sizes: '36x36',
            type: 'image/png',
            density: '0.75',
          },
          {
            src: '/assets/android-icon-48x48.png',
            sizes: '48x48',
            type: 'image/png',
            density: '1.0',
          },
          {
            src: '/assets/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            density: '1.5',
          },
          {
            src: '/assets/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            density: '2.0',
          },
          {
            src: '/assets/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            density: '3.0',
          },
          {
            src: '/assets/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            density: '4.0',
          },
          {
            src: '/assets/android-icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: '/assets/android-icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/assets/android-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        // Sin estas capturas Chrome no ofrece la instalacion "rica" de la PWA
        // y lo dice en DevTools > Application: hace falta AL MENOS una con
        // form_factor 'wide' (escritorio) y otra sin form_factor o con uno
        // distinto de 'wide' (movil). Son capturas reales de la portada,
        // hechas con Chrome headless a 1280x800 y 750x1334.
        screenshots: [
          {
            src: '/assets/screenshot-wide.jpg',
            sizes: '1280x800',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'Portada de Dreamers en escritorio',
          },
          {
            src: '/assets/screenshot-narrow.jpg',
            sizes: '750x1334',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Portada de Dreamers en el movil',
          },
        ],
      },
      replacer: null,
      space: 2,
      writeToDisk: true,
      fileExtRegex: /\.\w{2,4}\.(?:map|gz)$|\.\w+$/i,
      sortManifest: true,
      merge: false,
      publicPath: '',
    }),
    // En webpack 5 hay que declarar cada clave por separado: definir el
    // objeto 'process.env' entero rompe cualquier dependencia que lea otra
    // variable distinta de estas tres.
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      // Sin valor, config.js deja las rutas relativas, que es lo correcto en
      // produccion: la portada se sirve desde dreamers.es y los CGI viven en
      // ese mismo dominio. El '|| \'\'' evita que DefinePlugin inserte un
      // undefined literal cuando la variable no esta puesta.
      'process.env.ENDPOINTS_ROOT_DOMAIN': JSON.stringify(process.env.ENDPOINTS_ROOT_DOMAIN || ''),
      'process.env.VERSION': JSON.stringify(require('../package.json').version),
    }),
    ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : []),
  ],
  resolve: {
    alias: {
      // Backbone pide 'underscore'; lodash lo suple y asi va una sola
      // libreria de utilidades en el bundle.
      underscore: 'lodash',
    },
  },
};

module.exports = config;
