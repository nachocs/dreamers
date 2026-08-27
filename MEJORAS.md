# Mejoras que se pueden hacer ahora

> Documento de análisis, medido sobre **1.0.15** el 2026-08-27.
> Son mejoras independientes entre sí: cada una se puede hacer y desplegar sola.
> **Estado:** §3 y §1 hechas (2026-08-27). Quedan §2 (animaciones) y §4 (MDL).

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

198 KB gzip de JS (840 KB minificado). Peso comprimido por librería:

| Librería | gzip | Uso real en el código |
|---|---|---|
| emojione | **39 KB** | **3 llamadas**, todas a `toImage` |
| jquery | 30 KB | 187 `$()`, ~270 métodos — entretejido |
| lodash | 25 KB | 13 funciones, 43 usos; `_.template` es 19 de ellos |
| `emoji_short.json` | 23 KB | datos, se necesitan |
| autolinker | 19 KB | **1 llamada**, `link()` en `msgs/msgView.js:159` |
| mdl (js) | 11 KB | layout, drawer y contenedor de scroll |
| backbone | 8 KB | el framework |

Las librerías son el **78%** del bundle.

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

## 2. El conflicto de animaciones

Hoy hay **dos sistemas animando lo mismo a la vez**:

- `entradas/libraryView.js` → `rearrange()` usa `jQuery.animate()` a 400 ms sobre
  `top`/`left`/`width`/`height`, escribiendo estilos inline fotograma a fotograma.
- `css/main.less:311` declara `transition: all 0.5s ease-out` sobre `.container`.

O sea: una transición CSS de 500 ms intentando interpolar propiedades que jQuery ya está
reescribiendo cada 16 ms, y con distinta duración. Además `top`/`left`/`width`/`height` fuerzan
*layout* en cada fotograma, que es lo más caro que se puede animar.

**Arreglo:** quitar `jQuery.animate()` y dejar solo la transición CSS, moviendo la posición a
`transform: translate3d(x, y, 0)`, que compone en GPU y no dispara layout. Desaparece de paso el
parámetro `stop` de `rearrange(stop)`, que existe solo para decir "esta vez no vuelvas a medir".

Es el punto que más duele hoy y **no necesita React**: el plan de migración lo da como ventaja de
React, pero se puede hacer ya.

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

Se usa poco: cabecera, drawer y el contenedor de scroll `.mdl-layout__content`. Casi todas las
llamadas a `componentHandler.upgradeElement` **ya están comentadas**; queda una viva en
`entradas/formView.js:569`.

**Cuidado:** `.mdl-layout__content` no es solo estilo, es el elemento que scrollea —
`libraryView.js:180` le engancha el scroll infinito y `entradaView.js:139` lo anima. Al sustituir
el layout hay que trasladar esos dos enganches, no solo el CSS.

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

1. **§3 (`pack()` + test)** — primero, porque es la red de seguridad de todo lo demás.
2. **§1 (emojione)** — la ganancia grande y barata.
3. **§2 (animaciones)** — el dolor real del día a día.
4. **§4 (MDL)** — el más laborioso de los cuatro, y prerrequisito si luego se migra.

Después de esto tiene sentido volver a `PLAN-REACT.md` y decidir con datos: si el DOM imperativo
sigue doliendo con dos librerías menos y un arnés de tests montado, la migración parte de un sitio
mucho mejor que hoy.
