import globals from 'globals';
import babelParser from '@babel/eslint-parser';

// ESLint 9 solo lee este formato (flat config); el .eslintrc de antes lo
// ignoraba en silencio. Las reglas son las mismas que habia alli, menos
// 'babel/object-shorthand', que venia de eslint-plugin-babel: ese plugin
// esta abandonado y su unica utilidad aqui era duplicar object-shorthand.
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/assets/**'],
  },
  {
    files: ['src/**/*.js', 'src/**/*.mjs'],
    languageOptions: {
      parser: babelParser,
      // Sin opciones propias: el parser lee babel.config.json, el mismo
      // que usa babel-loader.
      parserOptions: {},
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        componentHandler: 'readonly',
        // mainView.js carga el logo con el require() de webpack, que no
        // es el de Node ni existe en el navegador: lo resuelve el bundler.
        require: 'readonly',
        // Igual que el anterior: config.js lee process.env.ENDPOINTS_ROOT_DOMAIN,
        // que no existe en el navegador -- lo sustituye DefinePlugin al
        // construir, en los dos webpack configs.
        process: 'readonly',
      },
    },
    rules: {
      strict: 'off',
      indent: ['off', 2, { SwitchCase: 1 }],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'brace-style': ['off', 'stroustrup', { allowSingleLine: true }],
      'accessor-pairs': ['error', { getWithoutSet: false }],
      'no-underscore-dangle': 'off',
      'no-console': 'off',
      'new-cap': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'no-var': 'error',
      'constructor-super': 'error',
      'generator-star-spacing': ['error', 'before'],
      'no-this-before-super': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-const': 'error',
      'no-unused-vars': ['error', { vars: 'all', args: 'after-used' }],
      'no-undef': 'error',
    },
  },
  {
    // Los tests corren en Node con `node --test`, no en el navegador: necesitan
    // sus globals y no los de window.
    files: ['test/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'error',
      'no-console': 'off',
    },
  },
  {
    files: ['webpack/**/*.js', '*.config.js', 'postcss.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-console': 'off',
    },
  },
];
