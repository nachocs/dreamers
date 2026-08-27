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
- **MDL (61 KB JS + 126 KB CSS) can't be lazy-loaded behind a route split**: `mainView.js` and
  `header/menuDreamersView.js` — the always-visible header — use `mdl-*` classes directly, so it's
  part of the initial paint on every page including the homepage. Checked 2026-08-23 while chasing
  Lighthouse performance; not a quick win.
- ~~**moment.js (177 KB) is loaded eagerly in `app.js` just to call `moment.locale('es')`**~~
  Removed 2026-08-23. It had exactly one real caller (`msgs/msgView.js`'s `.fromNow()`), so it's
  replaced with `Util.hace()` (`util/util.js`) — a ~20-line function using moment's own default
  thresholds (`ss:44, s:45, m:45, h:22, d:26, M:11`) and the `es.js` locale strings, verified
  against a table of reference timestamps before shipping. No more `moment.locale('es')` call to
  order-of-load around, since nothing formats a date anywhere else in the app.
- ~~**Font Awesome 4.7 ships every format (woff2/woff/ttf/eot/svg, ~1.1 MB total in the build) for
  only 17 icon glyphs used across the whole app**~~ Removed 2026-08-23. The dependency is gone
  entirely (`font-awesome.less` import, npm package, all five font files) and the 17 glyphs
  (`angle-down`, `ban`, `caret-down`, `caret-up`, `chevron-circle-right`, `ellipsis-v`, `expand`,
  `heart`, `heart-o`, `pencil`, `refresh`, `thumbs-down`, `thumbs-o-down`, `thumbs-up`,
  `thumbs-o-up`, `times-circle`, `trash-o`) are now inline SVG across the 6 templates that used
  them, with the paths extracted directly from this build's actual `fontawesome-webfont.ttf` via
  `fontTools` (not redrawn from a different FA version) and verified glyph-by-glyph against the
  live font before shipping. `main.less` keeps a small `.fa`/`.fa-lg`/`.fa-2x`/`.fa-fw`/`.fa-spin`
  ruleset (only the modifiers this app actually uses) so the markup and class names didn't need to
  change beyond swapping the tag. One real bug caught in the process: `molaView.js` delegated
  clicks with `'click i'` — a bare tag selector — which would have silently stopped the
  like/mola/nomola buttons from working the moment `<i>` became `<svg>`; fixed to `'click .fa'`.
  Also removed the dead `.fa-facebook-official`/`.fa-twitter-square` share-button handlers in
  `msgs/msgView.js` (and `Util.bookmarkthis`, which only they called) — the Facebook feature they
  belonged to had already been removed, and no template rendered those classes anymore.
- ~~**Bootstrap 3.4.1 shows up in `npm audit` and that's expected.**~~ Removed 2026-08-27, and
  with it both advisories (GHSA-q58r-hwc8-rm9j and GHSA-vxmc-5x29-h64v — XSS in Bootstrap's
  *JavaScript* Popover/Tooltip components, which this project never loaded: there was not a single
  reference to bootstrap in the built bundle). The dependency turned out to be carrying about 220
  generated selectors to serve **three classes used in one place** — `.btn`, `.btn-default` and
  `.btn-group`, on the two footer buttons of `msgs/modalView-t.html`. `main.less` used none of its
  variables or mixins, confirmed by compiling with the imports removed. The rules that actually
  apply are now vendored in `src/css/buttons.less` with the default variables already resolved.
  Bootstrap 3 is EOL (3.4.1 is its last release, so no patched version exists in the 3.x line) and
  4/5 dropped Less entirely, so upgrading would have broken the build instead of fixing anything.
  Verified with no visual change: the computed styles of both buttons in Chromium (geometry, corner
  radii, colors, border overlap) are identical before and after — checked against a control render
  with no CSS at all, because a first screenshot comparison came back "identical" on three blank
  images and proved nothing. `npm audit` is now clean.
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

## 1.0.15
Limite de altas por IP, y margenes en el formulario de registro.

- **Limite por IP** (en el servidor, no en este repo): `ratelimit.pl` en el
  `cgi/` de cada sitio, mas la llamada desde `registro.cgi`. **5 altas por hora
  y 15 por dia**. El contador es `/home/dreamers/datos/ratelimit`, y es **el
  mismo para dreamers.es y gritos.com** a proposito: los dos corren sus CGI como
  `nobody` (no hay suexec) y comparten cuentas, asi que alternar de sitio no da
  el doble de cupo. Se apunta **solo cuando se crea una cuenta**, nunca los
  intentos fallidos, para que quien se equivoque escribiendo no se quede fuera.
  Si el contador no fuese escribible el limite no existiria, asi que ese caso
  escribe un `warn` en el `error_log` en vez de fallar en silencio.
  **`check.cgi` NO lleva limite a proposito**: el formulario lo llama varias
  veces mientras se escribe, asi que un tope por IP romperia el alta a los
  usuarios de verdad. Si algun dia se quiere frenar la enumeracion de emails,
  hay que hacerlo de otra forma.
- **Margen del formulario**: `.modal-body` no trae relleno ninguno y el alta
  salia pegada a los cuatro bordes. El `padding` va en `.sign-up-form`, no en
  `.modal-body`, para no descolocar los otros dos modales que comparten ese
  contenedor (borrar entrada y editar mensaje).
- Arreglado de paso un fallo que venia de 1.0.14: el modelo de `ModalView` es un
  singleton, asi que la bandera `sinBotones` del registro se quedaba pegada y
  **habria dejado sin pie de OK/Cancelar al siguiente modal de borrar entrada**.
  Ahora `update()` la pone a false por defecto a quien no la pida.

## 1.0.14
Alta rapida en la portada, en un modal de 3 campos.

Hasta ahora el unico registro era el formulario largo del motor clasico
(`/ciudad/registro/`), con region, ciudad, fecha de nacimiento y confirmacion
por email en una semana. Ahora se puede crear la cuenta sin salir de la portada
con alias, email y clave, y **sin confirmacion**: se entra en el sitio. El
formulario largo sigue existiendo y esta enlazado desde dentro del modal.

Lado servidor (instalado a mano, NO esta en este repo):
`com/home2/cgi/registro.cgi`, `check.cgi` y `common.pl`, copiados y adaptados de
`jsgritos/api/` de gritos. **Los dos sitios comparten el mismo sistema de
cuentas**: aquel `registro.cgi` ya hacia `require` de
`/home/dreamers/datos/indices/admin/` y escribia en el indice `ciudadanos`, o
sea que no hay base de datos nueva. Diferencias a proposito respecto al de
gritos: solo acepta POST (el suyo tambien responde a GET, y una URL con
`?alias=..&password=..` crea una cuenta), valida largos en el servidor, y trae
puesta la guarda de POSTDATA. Su `common.pl` deja fuera `prepare_secure`, que
reescribe URLs a gritos.com.

Lado cliente: `signUpView.js`/`.html`, enganchado al `ModalView` que ya existia
mediante una opcion `signUp`, mas `sinBotones` en la plantilla del modal para
ocultar el pie generico de OK/Cancelar (el alta trae su propio boton, que solo
se activa con los tres campos validos). Los tres sitios que invitan a
participar (`js-registro`) abren el mismo modal.

**Cuidado si se toca `signUpView`:** la primera version repintaba la vista
entera en cada tecla y restauraba foco y cursor a mano. Pasaba las pruebas por
programa y al escribir de verdad **perdia el foco y se comia el texto**.
Reemplazar el nodo que hay bajo el cursor pelea con el navegador y esa pelea no
se gana. Ahora el formulario se pinta una vez y `actualizar()` solo toca los
avisos y el boton; los `<input>` no se tocan nunca.

Pendiente: los dos endpoints crean cuentas y **no tienen limite por IP ni
CAPTCHA**. Mientras estuvieron rotos daba igual; ahora no. Y `check.cgi` permite
preguntar si un email esta registrado (se dejo asi porque el mismo oraculo ya
era publico en gritos contra esta misma base, pero si se cierra hay que cerrarlo
en los dos sitios).

## 1.0.13
Retirado el acceso con Facebook.

El boton declaraba `version: 'v2.11'`, una version de la Graph API que Meta
retiro hacia enero de 2020: **llevaba unos seis anos sin funcionar**. Y era el
elemento mas grande del desplegable de acceso, o sea que se llevaba los clics de
justo la gente que venia a darse de alta y los dejaba en un callejon sin salida.

No se reactiva porque Meta exige hoy vincular la app a un portfolio de negocio
**verificado** (documentacion de una sociedad real) y la SL ya no existe. No es
que falte un tramite: no se cumple el supuesto.

- Fuera `fbView.js`, `fb.js` (este ya estaba huerfano), el `loadFBSDK`/`FB.init`
  de `index.js`, el boton `.fb-login`, el `<div id="fb-root">` y la dependencia
  `facebook-sdk-promise`.
- `logOut()` llamaba a `FB.logout()`. Sin SDK, `FB` no existe y eso reventaba el
  cierre de sesion; retirada la llamada.
- De paso se van `menuLoginView.js`/`.html`, que eran codigo huerfano (no los
  importaba nadie) y contenian un SEGUNDO boton de login con Facebook.
- El registro pasa a ser la accion destacada del desplegable.

**NO se ha tocado nada del servidor**: `emaillogin.cgi` se deja intacto a
proposito, por si algun dia se puede recuperar.

**Pendiente, y es una deuda con usuarios reales:** hay ciudadanos que se dieron
de alta *solo* por Facebook. Llevan tiempo sin poder entrar (y nadie se ha
quejado, que dice bastante). Antes de darlo por cerrado hay que mirar que hacia
`emaillogin.cgi`: si solo **emparejaba** por email con un ciudadano existente, esa
gente puede entrar con `recordar.cgi` y no hay nada que hacer; pero si **creaba
ciudadanos nuevos sin clave**, esos registros no tienen contrasena que recuperar
y hay que mandarles un correo para que se pongan una.

Ojo tambien: lo que NO es login es el **compartir en Facebook** de `util.js` /
`msgView.js` (`sharer.php`), que sigue funcionando y no se toca. Y la clase
`.fa-facebook-official` sigue en uso por eso mismo.

## 1.0.12
Hacer alcanzable el registro y visible la participacion.

El registro de ciudadanos existe desde siempre en el motor clasico
(`/ciudad/registro/`), pero **no se enlazaba desde ningun sitio de la portada**.
El desplegable de login solo ofrecia alias/clave y el boton de Facebook, asi que
quien no tuviera ya una cuenta no tenia por donde conseguirla, y quien hubiera
olvidado la clave tampoco. Ademas, sin sesion no se renderiza nada del formulario
(cuelga entero de `alias_principal`) ni de los comentarios, o sea que un visitante
veia un mosaico de contenido y ninguna senal de que esto lo escribe la gente.

- `loginView.html`: enlaces a **Registrate** (`/ciudad/registro/`) y a
  **Olvidaste la clave?** (`/ciudad/panelillo/recordar.cgi`).
- `formView.html`: donde antes solo salia el logotipo, ahora hay una invitacion
  a entrar o registrarse.
- `basicoTemplate.html`: misma invitacion al pie de cada ficha expandida, que es
  el momento de mas intencion (acabas de leerte la entrada entera).
- El enlace "Entra" reutiliza el desplegable de la cabecera via un manejador
  delegado en `mainView`, en vez de duplicar el formulario de login.

Ojo con el color de `.invitacion`: en la portada cae justo debajo de la barra
negra de la cabecera, pero **la barra la pinta otro elemento** y el fondo efectivo
ahi es el blanco del `body` (toda la cadena de padres es transparente). Con texto
claro no se lee nada; va en `#333` a proposito.

Pendiente, que no depende de este repo: `/ciudad/panelillo/` (el directorio)
devuelve el PHP en crudo en vez de redirigir -- Apache no ejecuta PHP ahi -- y
encima apunta a `dreamerscity.com`. Por eso se enlaza `panel.cgi` y `recordar.cgi`
directos, que si funcionan. La pagina de registro sigue enlazando al directorio
roto.

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
- `js-cookie` se RETIRO el 2026-08-16: la cookie de sesion la pone y la lee ahora el
  servidor, y el JS no la toca. Mientras se uso, el salto de la 2 a la 3 obligo a poner
  el `JSON.stringify`
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
