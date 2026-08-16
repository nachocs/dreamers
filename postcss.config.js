// autoprefixer lee el campo 'browserslist' de package.json, el mismo que
// usan babel y webpack, asi que el objetivo de navegadores esta declarado
// en un solo sitio. Antes vivia dentro de webpack.LoaderOptionsPlugin, que
// webpack 5 ya no usa para pasar opciones a los loaders.
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
