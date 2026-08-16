# Plan de migración a React

> Documento de análisis. **Nada de esto está ejecutado.**
> Estado del código al escribirlo: v1.0.11, Backbone 1.6 + jQuery 3.7 + webpack 5.

## Veredicto

Sí se puede, y **el sistema de posicionamiento no es el problema**. Es, de hecho, la parte
más fácil de todo el proyecto: el algoritmo de colocación ya está escrito como una función
pura, solo que disfrazada de método de una vista de Backbone. No toca el DOM ni una sola vez.

El lío está en otro sitio: en el **editor de contenteditable** (`Wysiwyg.js` +
`msgFormView.js`, 685 líneas de `Range`/`Selection`/`execCommand`) y en **Material Design
Lite**, que es una librería imperativa de 2016 que mete mano en el DOM por su cuenta. Esos
dos son los que hay que planificar con cuidado; el mosaico se porta casi mecánicamente.

---

## 1. Qué es exactamente el sistema de posicionamiento

Son cuatro capas, y conviene tenerlas separadas en la cabeza porque se migran de forma
muy distinta:

**1. Las medidas globales** — [`global.js`](src/js/app/global.js)
Un singleton `$D` con el tamaño de una celda en píxeles (`ancho` 213.6, `alto` 326.4,
`espaciado` 20) y la matriz de ocupación. En pantallas estrechas recalcula `ancho` a la
mitad del ancho de documento.

**2. El tamaño de cada entrada en celdas** — [`entradaModel.js`](src/js/app/models/entradaModel.js)
Cada entrada tiene `SQancho`/`SQalto` medidos **en celdas**, no en píxeles: 1×1 normal,
2×2 si es `destacado`, 3×3 al expandir, y `SQanchoTotal`×N al "expandir más". El método
`bindings()` (línea 44) convierte celdas a píxeles (`top`/`left`/`ancho`/`alto`) en cada
`change`. Esta separación celdas/píxeles es lo que hace que todo esto sea portable.

**3. El empaquetado** — [`libraryView.ordenar()`](src/js/app/entradas/libraryView.js:72)
Un *first-fit bin packing*: construye `matrix[columna][fila]`, y para cada entrada recorre
las columnas de izquierda a derecha en la fila `k` probando si cabe su huella `ancho×alto`
(`checkMatrix`); si no cabe en ninguna, baja a la fila `k+1` y reintenta (`populateMatrix`,
recursiva). Escribe `posX`/`posY` en el modelo y dispara `rearrange`.

**4. El ajuste por medición** — [`entradaView.ajustarAlto()`](src/js/app/entradas/entradaView.js:99)
Después de expandir, mide el DOM ya pintado (la altura de `.content` más la de cada hijo de
`.basico-container`), lo convierte a filas de rejilla con `Math.ceil(innerHeight / $D.alto)`,
lo limita a 3 filas (10 si es "expandido más") y, si cambió, vuelve a lanzar `ordenar()`.

---

## 2. Por qué el mosaico se porta bien

`ordenar()` **no lee ni escribe el DOM**. Solo lee `SQancho`/`SQalto` de cada modelo y el
número de columnas, y devuelve posiciones. Su firma real, quitando el ruido de Backbone, es:

```js
pack(items /* [{id, SQancho, SQalto}] */, columnas) -> [{id, posX, posY}]
```

Eso es una función pura y determinista. En React el mosaico queda así:

```jsx
const columnas = useColumnas();               // window.innerWidth / (ancho + espaciado)
const posiciones = useMemo(
  () => pack(entradas, columnas),             // el MISMO algoritmo, copiado tal cual
  [entradas, columnas]
);
// cada <Entrada> recibe {x, y, w, h} como props y se pinta en position:absolute
```

El posicionamiento absoluto se queda igual que ahora. El aspecto visual (los bordes de
cómic, las rotaciones de `main.less:296-431`) es **CSS puro y no se toca**.

**Cómo asegurarse de que no cambia el orden.** Hoy no hay ni un test. Antes de migrar nada,
sacar `pack()` a su propio módulo y montarle un arnés diferencial: generar N listas de
entradas al azar con sus `SQancho`/`SQalto`, pasarlas por el `ordenar()` actual y por el
`pack()` extraído, y comparar las posiciones una a una. Es la misma técnica que se usó para
validar el port de Indices a JS, y aquí es más fácil todavía porque no hay que pinchar el
reloj ni forkear procesos.

---

## 3. Dónde sí hay lío

### 3.1 El bucle medir → redimensionar → recolocar

**Este es el punto delicado del mosaico**, y es donde un port ingenuo se convierte en un
bucle infinito de renders.

Hoy se resuelve a lo bruto: `setTimeout(..., 1000)` más un flag `this.ajustado` para que no
se repita. En React es un `useLayoutEffect` con un `ResizeObserver` que guarda la altura
medida en estado, y ese estado realimenta `pack()`.

Lo que hace que el bucle **converja** ya está en el código actual, y hay que conservarlo:
la altura medida se cuantiza a filas de rejilla (`Math.ceil(innerHeight / $D.alto)`) **antes**
de guardarla. Es decir, solo se re-coloca cuando cambia el número de *filas*, no cada vez que
cambia un píxel. Si se guarda la altura en píxeles crudos, medir → colocar → medir no para
nunca. Conviene dejarlo escrito en un comentario en el código nuevo, porque no es evidente
y es exactamente el error que se comete al portarlo.

### 3.2 La animación

Ahora mismo hay **dos animaciones peleándose**: `rearrange()` usa `jQuery.animate()` a 400 ms
sobre `top/left/width/height` (escribiendo estilos inline fotograma a fotograma), mientras
`main.less:311` declara `transition: all 0.5s ease-out` sobre `.container`.

Al migrar esto se simplifica, no se complica: se quita jQuery y se deja solo la transición
CSS, moviendo la posición a `transform: translate3d(x, y, 0)` (que compone en GPU) y dejando
`width`/`height` como están. Desaparece de paso el parámetro `stop` de `rearrange(stop)`, que
hoy existe solo para decir "esta vez no vuelvas a medir".

### 3.3 Material Design Lite

MDL "actualiza" elementos del DOM por su cuenta vía `componentHandler` — justo el DOM que
React quiere gobernar. Cohabitan mal. Google la dejó en soporte limitado hace años (ya está
anotado en el README).

Por suerte se usa poco: la cabecera, el *drawer*, y un par de `mdl-js-textfield`/`mdl-button`
(casi todas las llamadas a `componentHandler.upgradeElement` están comentadas; queda una viva
en [`formView.js:569`](src/js/app/entradas/formView.js:569)). **Recomendación:** sustituir el
layout/drawer de MDL por CSS propio durante la migración, en vez de intentar que React y MDL
convivan. Son 126 KiB de CSS que se van.

### 3.4 El editor — el riesgo de verdad

[`Wysiwyg.js`](src/js/app/util/Wysiwyg.js) (147 líneas) y
[`msgFormView.js`](src/js/app/msgs/msgFormView.js) (538) son un editor `contenteditable`
hecho a mano: `window.getSelection()`, `document.createRange()`, `execCommand`, inserción de
emojis en la posición del cursor, interceptación del pegado, incrustación de imágenes y URLs.

React y `contenteditable` son un mal matrimonio clásico: el navegador muta el DOM por su
cuenta y el DOM virtual de React se desincroniza. Dos salidas:

- **(a) Isla no-React.** Un `<div ref>` que React monta y **nunca vuelve a renderizar**, con
  el editor actual funcionando dentro tal cual. Es lo más barato y lo que recomiendo para no
  bloquear el resto de la migración.
- **(b) Reescribirlo** sobre un editor mantenido (Lexical, TipTap). Mejor a largo plazo, pero
  es rehacer el comportamiento de emojis, spoilers e imágenes **y** garantizar que sigue
  produciendo exactamente el mismo marcado que guarda el backend en Perl.

En cualquier caso: **esto no se migra en el mismo paso que el mosaico.**

---

## 4. Inventario

| Pieza | Destino | Dificultad |
|---|---|---|
| `ordenar()` / `checkMatrix` / `populateMatrix` | `pack()` puro + `useMemo` | **Baja** — copiar y testear |
| `entradaModel.bindings()` (celdas → px) | función pura | Baja |
| `libraryView` (render, scroll infinito) | `<Mosaico>` + `IntersectionObserver` | Baja/Media |
| `ajustarAlto()` | `useLayoutEffect` + `ResizeObserver` | **Media** — ver 3.1 |
| `rearrange()` (jQuery.animate) | transición CSS sobre `transform` | Baja (se simplifica) |
| `entradaCollection` (`fetch`, `parse`, `firstEntry`) | fetch + estado, o TanStack Query | Baja |
| `router.js` (Backbone.history) | React Router | Baja |
| `loginView` / `fbView` / `menuDreamers` | componentes | Baja |
| Plantillas `.html` con `<%= %>` | JSX | Media (mecánico, pero son 14 ficheros) |
| MDL (`componentHandler`, layout, drawer) | CSS propio | **Media** — ver 3.3 |
| `Wysiwyg.js` + `msgFormView.js` | isla o reescritura | **Alta** — ver 3.4 |
| `main.less` (bordes de cómic, rotaciones) | **no se toca** | — |

Son ~3.500 líneas de JS en total. La mitad del riesgo está en dos ficheros.

---

## 5. Orden propuesto (incremental, nunca big bang)

**Fase 0 — Sin React todavía.** Extraer `pack()` a su propio módulo, montarle el arnés
diferencial de la sección 2 y desplegarlo con Backbone usándolo. Riesgo cero, y a partir de
aquí el algoritmo está blindado con tests.

**Fase 1 — Raíz de React dentro de Backbone.** `mainView` monta un `<Mosaico>` de React
dentro de `#container`. Backbone conserva el router, el login y el editor. Conviven sin
problema mientras cada uno mande en nodos distintos del DOM. Aquí se valida lo difícil (el
bucle de medición) con el resto de la aplicación intacta.

**Fase 2 — Datos.** Sustituir `entradaCollection` por fetch + estado. Ojo con `firstEntry`,
que es lo que pagina (`?empieza=`).

**Fase 3 — Cabecera, login y router.** React Router sustituye a `Backbone.history`.

**Fase 4 — Editor.** Isla o reescritura, según se decida en 3.4.

**Fase 5 — Limpieza.** Fuera jQuery, Backbone, lodash-como-underscore y MDL. Aquí es donde
se recupera de verdad el tamaño del bundle (hoy 882 KiB de JS, de los cuales ~530 son lodash
entero que entra por el alias `underscore` que necesita Backbone).

---

## 6. Decisiones que hay que tomar antes de empezar

**Bundler: seguir en webpack 5 o pasar a Vite.** Recomiendo **seguir en webpack 5** durante
la migración y dejar Vite para después, por dos razones. Una, acabamos de dejarlo funcionando
y sin ninguna dependencia nativa (0 binarios `.node` en el árbol), que es justo lo que hace
falta en un servidor con glibc 2.28. Y dos, Vite arrastra rollup, y rollup ≥ 4.62.1 exige
glibc 2.34: en AlmaLinux 8 hay que pinchar la versión con `overrides` o construir fuera del
servidor. Es un problema resoluble, pero no conviene mezclarlo con la migración a React.

**TypeScript sí o no.** Si se va a tocar `pack()` y las medidas celdas/píxeles, tipar al
menos ese módulo sale muy rentable: es donde un `undefined` se convierte en `NaN` y la
portada se queda en blanco (ver el fallo anotado en el README).

**Qué se conserva del aspecto.** Los bordes de cómic y las rotaciones son CSS y sobreviven
sin tocarlos. Merece la pena decidirlo explícitamente antes, para que nadie los "limpie".

---

## 7. Lo que no se toca

- Los CGI del motor Indices y sus URLs (`cgi/json.cgi`, `cgi/index.cgi`, `cgi/login.cgi`).
- El formato de la cookie `city`: es JSON percent-codificado y **lo lee el Perl**.
- El `<noscript>` de `index.ejs` con la navegación: es la única vía de rastreo que tiene la
  portada y le costó llegar ahí.
- `src/assets/` y el copiado que hace el script `update`.

## 8. Lo que se puede romper en silencio

- **El recorte de anchura en pantallas estrechas**
  ([`libraryView.js:122`](src/js/app/entradas/libraryView.js:122)): si `SQancho` supera el
  número de columnas se fuerza a `SQanchoTotal`. Sin esto, una entrada `destacado` 2×2 en un
  móvil de 2 columnas rompe el empaquetado.
- **El `-0`**: `calculaAncho()` puede devolver `-0` y `-0 === 0` es cierto. El código actual
  depende de eso sin saberlo. En el port, hacerlo explícito.
- **La paginación** (`firstEntry` / `?empieza=`): se calcula en `parse()` con el mínimo de
  `num`, no con un contador. Si se cambia por un offset, salen entradas repetidas.
- **El SEO**: `<title>`, `description` y `og:image` los inyecta html-webpack-plugin desde la
  config, no la aplicación. Cualquier bundler nuevo tiene que seguir generándolos.
