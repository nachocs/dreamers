//
// El <img> de un emoji, en el formato exacto que producia emojione.
//
// emojione entraba en el bundle con 355 KB de modulo (39 KB gzip) y se usaba
// para UNA sola funcion, toImage(), en tres sitios: el catalogo del selector
// (util/emojis.js) y un ':smile:' literal en las dos barras de formulario. Y
// no procesaba texto libre de usuario en ningun momento: solo convertia
// shortnames del propio catalogo, de uno en uno.
//
// El formato NO se puede cambiar. Cuando alguien elige un emoji en el selector,
// emojisModal.selectEmoji() coge el outerHTML del <img> y lo mete en el
// contenteditable, o sea que ese markup acaba GUARDADO en el backend. Los
// mensajes que ya existen lo llevan dentro. Cualquier variacion -- el orden de
// los atributos, la barra de cierre, el ?v= -- haria que lo nuevo dejase de
// casar con lo viejo.
//
// Por eso hay un test exhaustivo contra las 1820 entradas del catalogo, con la
// salida de emojione congelada en test/fixtures/emoji-golden.json antes de
// desinstalarla.

// Los emoji siguen sirviendose de jsDelivr, igual que antes: aqui NO se cambia
// de donde salen las imagenes, solo quien escribe la etiqueta. Cambiar la ruta
// romperia los mensajes ya guardados.
const RUTA_PNG = 'https://cdn.jsdelivr.net/emojione/assets/png/';

// emojione lo anadia para invalidar cache al subir de version. Se conserva tal
// cual, con su 2.2.7, porque forma parte de la URL que ya esta en la base.
const CACHE_BUST = '?v=2.2.7';

/**
 * @param {string} unicode  codepoint(s) en hexadecimal como los trae
 *   emoji_short.json: '1f604', o '1f1ea-1f1f8' para los de varios (banderas,
 *   secuencias ZWJ).
 * @param {string} shortname  con sus dos puntos, ':smile:'.
 * @returns {string} la etiqueta <img>, identica a la de emojione.toImage().
 */
export function emojiImg(unicode, shortname) {
  return `<img class="emojione" alt="${emojiAlt(unicode)}" title="${shortname}" src="${RUTA_PNG}${unicode}.png${CACHE_BUST}"/>`;
}

/**
 * El caracter emoji de verdad, que emojione ponia en el alt para que al copiar
 * el texto o leerlo un lector de pantalla saliera el emoji y no la etiqueta.
 */
export function emojiAlt(unicode) {
  return unicode
    .split('-')
    .map(punto => String.fromCodePoint(parseInt(punto, 16)))
    .join('');
}
