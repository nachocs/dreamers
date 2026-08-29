# Mejoras que se pueden hacer ahora

> Documento de análisis, medido sobre **1.0.15** el 2026-08-27.
> Son mejoras independientes entre sí: cada una se puede hacer y desplegar sola.
> **Estado:** §3 y §1 hechas (2026-08-27), §2 hecha (2026-08-28). Queda §4 (MDL, con el
> alcance ya medido y una decisión pendiente: ver el final de esa sección).

Complementa a [`PLAN-REACT.md`](PLAN-REACT.md), que responde a *cómo* se migraría a React.
Este responde a *qué conviene hacer antes*, se migre o no.

## Por qué esto va antes que React

La cuenta del bundle, que suele ser el argumento más tangible para migrar, no sale:

```
React quita:  jquery 30 + lodash 25 + backbone 8 + mdl 11  =  74 KB
React añade:  react + react-dom                            ≈ −45 KB
──────────────────────────────────────────────────────────────────
neto:                                                        ≈ 29 KB
```

Y ese neto solo llega al final de la Fase 5. **Quitar emojione son 39 KB** — más que toda la
migración — y es una tarde de trabajo (sección 1).

Ninguna de estas mejoras se tira si algún día se migra: las secciones 3 y 4 son literalmente la
Fase 0 y parte de la Fase 5 del plan de React. Son la pista de aterrizaje, no trabajo paralelo.

## De qué está hecho el bundle

Medido antes de tocar nada: **198 KB gzip** de JS (840 KB minificado). Tras quitar emojione (§1)
son **145 KB** (548 KB minificado); el resto de la tabla sigue vigente.

| Librería | gzip | Uso real en el código |
|---|---|---|
| ~~emojione~~ | ~~**39 KB**~~ | quitada en §1; resultaron ser 53 KB |
| jquery | 30 KB | 187 `$()`, ~270 métodos — entretejido |
| lodash | 25 KB | 13 funciones, 43 usos; `_.template` es 19 de ellos |
| `emoji_short.json` | 23 KB | datos, se necesitan |
| autolinker | 19 KB | **1 llamada**, `link()` en `msgs/msgView.js:159` |
| mdl (js) | 11 KB | layout, drawer y contenedor de scroll |
| backbone | 8 KB | el framework |

Las librerías eran el **78%** del bundle de partida.

*Método:* peso gzip del `dist` de cada paquete, contrastado con el tamaño de módulo que reporta
`webpack --json`. Es una aproximación de su aportación real: webpack puede recortar algo por
tree-shaking, así que tómense como cota superior. Se reproduce con
`npx webpack --config webpack/webpack.prod.config.js --json`.

---

## 1. ~~Quitar emojione — 39 KB~~ — HECHO 2026-08-27

**La mejor relación ganancia/esfuerzo de la lista.** 355 KB de módulo (39 KB gzip) para una
sola función:

```
emojione.toImage   3 usos   (util/emojis.js, msgs/msgFormView.js, entradas/formView.js)
```

`toImage()` convierte shortnames (`:smile:`) y unicode a `<img>` de los sprites. El proyecto ya
carga `src/assets/emoji_short.json` (157 KB, 23 KB gzip) con el catálogo, así que la sustituta
es una función corta sobre datos que ya están en memoria.

**Cuidado:** hay que decidir qué hace con el texto que *no* es emoji y respetar el escapado de
HTML actual — `toImage` recibe contenido de usuario. Comparar la salida contra la de emojione
sobre un corpus de mensajes reales antes de cambiarlo, porque esto se pinta en cada mensaje.

**Resultado.** Ese "cuidado" resultó no aplicar: `toImage` **nunca** veía texto libre. Dos de los
tres usos eran la constante literal `:smile:`, y el tercero convertía shortnames del propio
catálogo de uno en uno. No había nada que escapar ni ningún corpus que revisar.

Lo que sí importaba era otra cosa, y más seria: cuando alguien elige un emoji en el selector,
`emojisModal.selectEmoji()` coge el `outerHTML` del `<img>` y lo mete en el editor, así que **ese
markup queda guardado en el backend**. Los mensajes ya escritos lo llevan dentro. El formato no se
podía tocar ni en el orden de los atributos.

Sustituido por `src/js/app/util/emojiImg.mjs`, 50 líneas. Se verificó reproduciendo la salida de
emojione en **las 1820 entradas del catálogo**, no en una muestra. La referencia se congeló en
`test/fixtures/emoji-golden.json` (sha256 del catálogo entero renderizado, más 52 casos concretos
para que un fallo sea legible) generándola con el paquete instalado, justo antes de desinstalarlo.
Se comprobó que la comparación detecta diferencias: quitar el `?v=2.2.7`, cambiar el `alt`, quitar
la barra de cierre o alterar el orden de los atributos la llevan de 1820/1820 a 0/1820.

**Ganancia real: −53 KB gzip** (198 → 145 KB; 840 → 548 KB sin comprimir), más de los 39 KB
estimados, porque el módulo arrastraba además sus propias tablas de emoji.

## 2. ~~El conflicto de animaciones~~ — HECHO 2026-08-28

Había **dos sistemas animando lo mismo a la vez**:

- `rearrange()` usaba `jQuery.animate()` a 400 ms sobre `top`/`left`/`width`/`height`,
  escribiendo estilos inline fotograma a fotograma.
- `css/main.less` declaraba `transition: all 0.5s ease-out` sobre `.container`.

O sea: una transición CSS de 500 ms intentando interpolar propiedades que jQuery ya está
reescribiendo cada 16 ms, y con distinta duración. Además `top`/`left`/`width`/`height` fuerzan
*layout* en cada fotograma, que es lo más caro que se puede animar.

**Arreglo:** quitar `jQuery.animate()` y dejar solo la transición CSS, moviendo la posición a
`transform: translate3d(x, y, 0)`, que compone en GPU y no dispara layout.

**Resultado.** Hecho, pero con tres cosas que este documento no había visto y que cambian la
receta. La primera es menor: `rearrange()` **no está en `libraryView.js`**, sino en
`entradas/entradaView.js`. Las dos llamadas a `.animate()` que sí hay en `libraryView.js` son de
`mostrarComentariosEv`/`ocultarComentariosEv`, que están **muertas** — sus dos entradas de
`events` llevan comentadas desde antes, y de los comentarios al pasar el ratón ya se encarga el
CSS. Se dejan como estaban: no son parte de este conflicto.

Las otras dos sí importan:

- **`translate3d` a secas se cargaba la viñeta.** `.container` ya usaba `transform` para la
  rotación de tebeo, y no con un ángulo sino con **cuatro**: `2deg` normal, `-2deg` en las
  impares, `1deg` al expandir y `0deg` en `expandidomas`. Como `transform` no se acumula, meter
  ahí el translate habría obligado a repetirlo en los cuatro sitios, y la posición se habría
  perdido en cuanto una viñeta cambiara de estado. La posición va en `--tx`/`--ty` y la rotación
  en `--rot`, con un único `transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot))`;
  cada estado ya solo cambia su variable. Se comprobó que el minificador de producción las
  respeta: los cuatro `--rot` y el transform compuesto salen intactos en el CSS del build.
- **`.expandido` redeclaraba `transition: height, width`, sin `transform`.** Antes daba igual
  porque de mover la viñeta expandida se encargaba jQuery. Si no se añade `transform` a esa
  lista, una viñeta expandida **salta** de golpe a su sitio en vez de deslizarse. Es el tipo de
  regresión que no da error y que solo se ve mirando.

De paso, `transition: all` pasa a lista explícita (`transform, width, height`): con el destino ya
escrito una sola vez, conviene decir exactamente qué se anima.

**El parámetro `stop` sí desaparece**, como decía el plan. Sus dos llamadas, `rearrange(true)`,
estaban guardadas por otro lado: `contraer()` pone `expandido: false` y `ajustarAlto()` pone
`ajustado = true` justo después, y `ajustarAlto()` se corta con cualquiera de las dos nada más
entrar. O sea que `quietoparao` ya no hacía nada en ninguno de los dos casos.

**La trampa: `transitionend` NO sirve aquí.** El callback de `jQuery.animate()` era quien
disparaba `quietoparao` → `ajustarAlto()`, que mide alturas y por eso tiene que esperar a que la
viñeta esté quieta. Lo natural sería escuchar `transitionend`, y está mal: **no se emite cuando
el valor no llega a cambiar**, y "reordenar sin que esta viñeta se mueva" es el caso normal, no
el raro — medido en el navegador, un `resize` que no cambia el número de columnas deja **cero**
transiciones vivas en las 17 viñetas. Con `transitionend` ese aviso se perdería para siempre.
Va con un `setTimeout` de 500 ms, que es lo que hacía jQuery (su callback se llamaba pasara lo
que pasara). El reloj se cancela en `remove()`, cosa que jQuery daba gratis al vaciar la cola de
efectos del elemento.

**Verificación.** No hay salida de referencia contra la que comparar, así que se sondeó el
navegador. Lo que quedó probado:

- Cambiar `--tx` produce una `CSSTransition` real sobre `transform`, de 500 ms — o sea que la
  cadena variable → `transform` → transición funciona, que era la duda de fondo.
- Las 17 viñetas quedan con `top: 0; left: 0` y **cero** `top`/`left` inline: la posición es toda
  del transform. Al expandir, la matriz resultante compone bien translate y rotación.
- `quietoparao` sigue vivo. Con un `MutationObserver` sobre el atributo `style` se ve la cadena
  entera: al expandir, `width: 447.2 / height: 672.8` (2 filas) y después **el alto sube a 3
  filas sin que el ancho cambie**. Cambiar `SQalto` solo, sin tocar `SQancho`, lo hace únicamente
  `ajustarAlto()`, y a `ajustarAlto()` solo se llega por `quietoparao`.
- **El área scrollable no se resiente**, que era el riesgo real de mover la posición a
  `transform`: `#contenidodinamico` tiene alto 0 y todo su scroll sale de hijos posicionados en
  absoluto. Medido contra el código original con el mismo viewport y la misma carga: `scrollHeight`
  1415 / 1385 y fondo 1366 en **ambos**. El scroll infinito se probó de verdad (17 → 24 viñetas).

Dos avisos para quien repita las medidas:

- **Comparar con el mismo estado.** La primera medida del área scrollable dio un déficit de
  ~1000 px y parecía una regresión seria. No lo era: se estaba comparando una página con una
  viñeta expandida contra otra recién cargada. Es el mismo error de "una sola medida antes" que
  ya se pagó con el Lighthouse de la portada.
- **En una pestaña de fondo Chrome congela los temporizadores**, y `requestAnimationFrame` no
  corre. Un muestreo fotograma a fotograma se queda clavado; en una de las pruebas la cadena de
  `ajustarAlto` tardó 14 s en completarse. Eso es el estrangulamiento del navegador, no el
  código. Por eso las pruebas buenas son las que no dependen de relojes propios:
  `getAnimations()` y `MutationObserver`.

Lo que **no** se ha podido comprobar aquí es lo único que de verdad justifica el cambio: que se
vea suave. El panel del navegador estaba oculto y sin pintar. Queda para una pasada a ojo.

## 3. ~~Extraer `pack()` y ponerle el primer test~~ — HECHO 2026-08-27

`libraryView.ordenar()` (línea 72) es el *first-fit bin packing* del mosaico. **No lee ni escribe
el DOM**: solo mira `SQancho`/`SQalto` y el número de columnas. Es decir, ya es una función pura
disfrazada de método de vista.

Sacarla a su módulo y montarle el arnés diferencial descrito en `PLAN-REACT.md` §2 (generar listas
al azar, pasarlas por el `ordenar()` actual y por el `pack()` extraído, comparar posición a
posición).

**Vale la pena aunque no se migre nunca:** hoy `npm test` no existe y el proyecto no tiene ni un
test. Este es el algoritmo más delicado del código y el que más caro sale romper. Es también el
prerrequisito honesto de cualquier refactor grande posterior.

**Resultado.** `src/js/app/entradas/pack.mjs`, con `ordenar()` reducido a leer los modelos,
aplicar el resultado y avisar. 15 tests con `node --test` (`npm test`), sin una sola dependencia
nueva y sin binarios nativos —lo que descartó Vitest, cuyo Vite 8 arrastra rolldown y
lightningcss en Rust, y el despliegue hace `npm install` en el propio servidor—.

El arnés diferencial (`test/pack-diferencial.test.mjs`) lleva una transcripción literal del
`ordenar()` de 896f928 y compara ambos en 2.500 casos generados con semilla. Se comprobó que el
arnés **detecta** diferencias, mutando `pack()` a propósito (recorrer las columnas al revés, no
reiniciar `k` entre entradas): las dos mutaciones lo hacen fallar, y al restaurar vuelve a pasar.
Un arnés que no se ha visto fallar nunca no prueba nada.

Dos divergencias deliberadas, ambas documentadas y con test propio:
- Las celdas se comprueban con `!== undefined` en vez de por veracidad. El original daba por
  **libre** la celda de una entrada con `id` 0 o cadena vacía, y le colocaba otra encima. Los ids
  vienen del JSON del CGI.
- Si una entrada no cabe a lo ancho, lanza `RangeError` en vez de recursión infinita. Solo es
  alcanzable cuando el recorte va contra un `$D.SQanchoTotal` mayor que las columnas medidas;
  el original desbordaba la pila sin decir por qué.

## 4. MDL → CSS propio — 11 KB JS + 126 KB CSS

Ya está anotado en el README como problema conocido: Google la dejó en soporte limitado, tumbó su
CDN en junio de 2026 y la cabecera usa clases `mdl-*` directamente, así que entra en la primera
pintura de todas las páginas.

> **Medido el 2026-08-28, y NO se usa poco.** Esta sección decía antes «se usa poco: cabecera,
> drawer y un par de textfields», copiando la estimación de `PLAN-REACT.md` §3.3. Es falso, y por
> eso la §4 se pospuso: no es la mejora mecánica que parecía. Lo que sigue son mediciones, no
> estimaciones.

### Cuánto se usa de verdad

**38 clases `mdl-*` distintas, ~200 apariciones en 15 ficheros.** Las más frecuentes:

```
mdl-js-textfield              18      mdl-card                10
mdl-textfield__input/__label  17      mdl-button               9
mdl-textfield                 16      mdl-shadow--4dp          4
mdl-textfield--floating-label 15      mdl-layout__content      4
mdl-navigation__link          14      mdl-badge                3
```

Reparto por fichero (los cinco primeros): `entradas/formView.html` 67, `header/loginView.html` 32,
`css/main.less` 25, `mainView.html` 13, `header/menuDreamersView.html` 10.

Es decir: toca **todos los formularios de la aplicación** — registro, mensajes y entradas —, no
solo la cabecera.

### Qué está vivo y qué está muerto (sonda en navegador)

Importa porque decide si hay que reescribir comportamiento o solo CSS. Se levantó el build con un
servidor local y se sondeó con Chromium headless, leyendo el DOM ya arrancado:

| | en el DOM | actualizados por MDL |
|---|---|---|
| `.mdl-layout` | 1 | **1** |
| `.mdl-js-textfield` | 2 | **2** |
| `.mdl-js-button` | 2 | **0** |
| `.mdl-js-ripple-effect` | 1 | **0** |

Ninguna plantilla `mdl-*` está en `index.ejs`: todo el markup lo pinta Backbone. Lo que pasa es
que el bundle arranca y pinta **antes** de `DOMContentLoaded`, así que la pasada automática de
`componentHandler` alcanza lo que existe en ese instante — el layout y los dos campos del login —
y nada más. Todo lo que se pinta después (los otros 16 textfields, los botones, el ripple) **no se
actualiza nunca**: hoy ya solo tienen el CSS de MDL, sin comportamiento.

Para reproducir la sonda: `npm run build`, servir `dist/`, y en la página inyectar
`document.querySelectorAll('.is-upgraded')` tras el `load`.

### Lo que hay que replicar sí o sí

- **El drawer depende de la API JS de MDL.** `header/menuDreamersView.js:23` hace
  `document.querySelector('.mdl-layout').MaterialLayout.toggleDrawer()`. Esa propiedad solo existe
  porque MDL actualizó el elemento. Al quitar MDL hay que sustituir la llamada, no solo el estilo.
- **`.mdl-layout__content` es el elemento que scrollea**, no un contenedor decorativo:
  `libraryView.js:180` le engancha el scroll infinito, `libraryView.js:184` lo lee y
  `entradaView.js:139` lo anima. Hay que trasladar esos tres enganches.
- **Las etiquetas flotantes de los dos campos del login sí funcionan** (MDL les pone
  `is-dirty`/`is-focused`/`is-invalid`). Si se quitan sin reemplazo, esos dos campos se degradan.
- La única llamada viva a `componentHandler` es `formView.materialDesignUpdate()`
  (`entradas/formView.js:557` y `:569`); las otras cuatro están comentadas.

### Decisión pendiente antes de empezar

Los **16 textfields que nunca se actualizan tienen la etiqueta flotante muerta**. Al escribir el
CSS propio hay que elegir, y es una decisión de producto, no técnica:

- **(a)** dejarlos como están, fieles al comportamiento actual aunque esté algo roto; o
- **(b)** hacer que funcionen en todos, que es mejor pero es un cambio visible que nadie pidió.

### Cómo abordarlo

En **tres commits**, no en uno:

1. Textfields, botones, cards, badges y sombras → CSS propio. Es la parte grande y es solo CSS,
   porque esos componentes ya no tienen JS.
2. Layout, drawer y `.mdl-layout__content` → aquí está el comportamiento real: el toggle del
   drawer y los tres enganches de scroll.
3. Quitar `material-design-lite` del `package.json` y de las dos entradas de webpack.

**Esta mejora no se puede verificar de forma exhaustiva**, a diferencia de §1 y §3: no hay salida
de referencia contra la que comparar. La validación es revisión de código y mirarlo en el
navegador, formulario por formulario. Por eso conviene que vaya sola en su rama y no mezclada con
nada más.

## 5. Candidatos menores

**autolinker (19 KB gzip, 1 llamada).** Tentador por la proporción, pero es el caso donde una
librería se gana el peso: detectar URLs, emails y menciones en texto libre sin falsos positivos
tiene muchísimos casos borde, y aquí se aplica a contenido de usuario. **No lo recomiendo** salvo
que se acote a un patrón muy concreto y se valide contra mensajes reales.

**lodash (25 KB gzip).** De las 13 funciones usadas, la mayoría son nativas hoy (`map`, `forEach`,
`join`, `extend`→`Object.assign`, `isNaN`→`Number.isNaN`) o helpers de cinco líneas (`throttle`,
`uniq`, `defer`, `defaults`). El bloqueo real es `_.template`, con 19 usos, que es el motor de
plantillas de las vistas de Backbone, y `underscore: 'lodash'` es un alias de webpack que Backbone
necesita. Se puede recortar mucho, pero **no del todo mientras siga Backbone**, así que esta sí
depende de la decisión sobre React.

---

## Orden sugerido

1. ~~**§3 (`pack()` + test)**~~ — hecha. Era la red de seguridad de todo lo demás.
2. ~~**§1 (emojione)**~~ — hecha. La ganancia grande y barata: −53 KB gzip.
3. ~~**§2 (animaciones)**~~ — hecha. El dolor real del día a día.
4. **§4 (MDL)** — con diferencia la más laboriosa, bastante más de lo que se estimó al escribir
   este documento (ver las mediciones en su sección). Va la última a propósito, sola en su rama,
   y con la decisión sobre las etiquetas flotantes tomada antes de empezar.

El aviso que llevaba aquí sobre §2 —que era la primera que no se podía cerrar con un test— se
quedó a medias. Es verdad que no hay salida de referencia como en §1 y §3, pero **sí se pudo
comprobar bastante más que "leyendo el diff"**: sondeando el navegador con `getAnimations()` y un
`MutationObserver` se prueban la transición, la posición y la cadena de eventos enteras. Lo único
que de verdad queda para el ojo es que se vea suave. Merece la pena tenerlo en cuenta para §4,
donde la sección también da por imposible verificar: probablemente tampoco lo sea del todo.

Después de esto tiene sentido volver a `PLAN-REACT.md` y decidir con datos: si el DOM imperativo
sigue doliendo con dos librerías menos y un arnés de tests montado, la migración parte de un sitio
mucho mejor que hoy.
