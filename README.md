# dreamers

Dreamers.es New Site

## Known issues

- **Material Design Lite CDN is dead.** The homepage used to load MDL straight from
  `storage.googleapis.com/code.getmdl.io/1.2.1/...`. Google permanently shut that bucket down
  (~June 2026, returns `403 AccessDenied`), which silently broke MDL's grid/layout CSS and made
  the homepage look broken (unstyled/pushed-down content) for about a month before anyone
  traced it back to this. Fixed by bundling `material-design-lite` from `node_modules` via the
  webpack build (`entry.app` in `webpack/webpack.prod.config.js` and `webpack.dev.config.js`)
  instead of pointing at the dead CDN.
- MDL itself has been in Google's "limited support" mode for years — development moved to
  [Material Components for the Web](https://github.com/material-components/material-components-web).
  We're only pinned to MDL 1.x because that's what the site has always used; we should plan to
  upgrade off MDL before this bites us again.
- **Bootstrap 3.4.1 shows up in `npm audit` and that's expected.** The two advisories are XSS in
  Bootstrap's *JavaScript* Popover/Tooltip components. This project never loads Bootstrap's JS —
  `src/css/main.less` imports only `variables.less`, `mixins.less`, `buttons.less` and
  `button-groups.less`. Bootstrap 4/5 dropped Less entirely, so "fixing" the audit means
  rewriting `main.less` against Sass. Not worth it until somebody rewrites the CSS anyway.
- ~~**The homepage renders nothing if `window.innerWidth` is 0 when the bundle boots.**~~
  Fixed in 1.0.11. `global.js` computed a negative tile width, `libraryView.calculaAncho()`
  returned `NaN`, the old `if (SQanchoTotal < 2)` guard didn't catch it (every comparison
  with `NaN` is false), the column loop never ran and `ordenar()` threw on `matrix[0].length`
  — taking the whole app down. Reachable in a hidden or prerendered tab. The guard is now
  written negated: `if (!(SQanchoTotal >= 2))`. **Keep it that way**; "simplifying" it back
  to `< 2` reintroduces a blank homepage.
  There was a second half to it: `global.js` sizes a tile **once**, at import time, and
  nothing ever recomputes it (`detect_resize` only recounts columns). With a measured width
  of 0 the narrow-screen branch left `ancho` at -40 and `alto` negative *permanently*, so the
  guard alone turned a blank page into a mosaic drawn with negative sizes. That branch now
  requires a usable measurement (`anchoDocumento > 0`) and otherwise keeps the defaults.
  Real narrow screens (360px and the like) behave exactly as before.

## 1.0.11
Modernizacion de dependencias, sin cambios de funcionalidad.

- Build: webpack 3 -> 5. `extract-text-webpack-plugin` -> `mini-css-extract-plugin`,
  `url-loader`/`file-loader`/`json-loader` -> asset modules, `UglifyJsPlugin` -> terser
  (de serie) + `css-minimizer-webpack-plugin` (el CSS antes no se minificaba).
  `html-webpack-plugin` 2 -> 5: ojo, `files.chunks` ya no existe y `src/index.ejs` ahora
  recorre `files.js`.
- Se retiran dependencias que no usaba nadie: `requirejs`, `request`, `socket.io(-client)`,
  `slick-carousel` (y sus dos `<link>` a un CDN de jsDelivr ya muerto), `icomoon-free-npm`,
  `core-decorators`, `classnames`, `offline-plugin`, `s3-deploy`, `babel-polyfill`, y el
  trio `mocha`/`chai`/`sinon` (no hay tests). De 1.500+ paquetes a 669.
- `babel-plugin-lodash` fuera: con `resolve.alias.underscore = 'lodash'` el lodash completo
  entra igualmente por Backbone, asi que solo duplicaba modulos (-37 KiB de bundle).
- ESLint 4 -> 9 (flat config en `eslint.config.mjs`); `npm run lint` pasa limpio.
- Babel centralizado en `babel.config.json` y objetivo de navegadores declarado una sola vez
  en el campo `browserslist` de `package.json` (lo leen babel, autoprefixer y webpack).
- `js-cookie` 2 -> 3: la 3 ya no serializa objetos sola, asi que el `JSON.stringify` va
  explicito en `fbView.js` y `loginView.js`. La cookie `city` conserva exactamente los
  mismos bytes (el juego de caracteres que ambas versiones dejan sin codificar es identico),
  que es lo que espera el CGI de login.
- Arreglado un bug latente que destapo el cambio de `browserslist`: `fbView.js` definia
  `faceb` como arrow function y `loginView` hace `new FbView()`. Las arrow functions no son
  construibles; colaba solo porque Babel las convertia a `function` al compilar para ES5.
  Con el objetivo moderno la portada entera dejaba de montarse.
- `update` (despliegue) ya no necesita `--legacy-peer-deps`: lo pedia
  `extract-text-webpack-plugin`, que ha desaparecido.
- Arreglada la portada en blanco cuando `window.innerWidth` vale 0 al arrancar: la guarda
  de `calculaAncho()` ahora va negada (`!(SQanchoTotal >= 2)`) para atrapar tambien el `NaN`,
  y `global.js` solo aplica la rama de pantalla estrecha si el ancho medido es utilizable,
  para no dejar el tamano de celda en negativo para siempre.

## 1.0.10
A?adido enlace directo a tienda y a web clasica. Mejora de enlace a blogs, cambiado feed a tienda + todo incluido blogs

## 1.0.9
Mejora de cajas cuando el contenido viene de entrada rapida. Pinchando en caja expande.

## Version 1.0.0
Todo funciona, aunque hay errores pero no puedo retrasar esto mas, que lo tenia hecho hace 7 años... :)
