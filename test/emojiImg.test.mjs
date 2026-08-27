//
// emojiImg() contra la salida real de emojione 2.2.7.
//
// La referencia esta congelada en fixtures/emoji-golden.json: se genero con el
// paquete instalado, justo antes de desinstalarlo, recorriendo las 1820
// entradas de emoji_short.json. Lleva dos cosas: el sha256 del catalogo entero
// renderizado -- que detecta cualquier desvio, aunque sea en un solo emoji -- y
// 52 casos concretos elegidos por tener forma distinta (banderas y secuencias
// de varios codepoints, entradas con unicode_alt, con alias ascii, y una por
// categoria) para que un fallo se pueda leer sin descifrar un hash.
//
// Esto NO es cosmetica: el markup que sale de aqui se guarda en el backend
// cuando alguien elige un emoji en el selector, asi que tiene que seguir
// casando con el de los mensajes que ya estan escritos.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { emojiImg, emojiAlt } from '../src/js/app/util/emojiImg.mjs';

const leerJson = ruta => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const golden = leerJson('./fixtures/emoji-golden.json');
const catalogo = leerJson('../src/assets/emoji_short.json');

test('el fixture describe el catalogo que hay ahora mismo', () => {
  // Si alguien anade o quita emojis de emoji_short.json sin regenerar el
  // fixture, el hash de abajo fallaria y no se sabria por que. Esto lo dice.
  assert.equal(
    Object.keys(catalogo).length, golden.entradasCatalogo,
    'emoji_short.json ha cambiado de tamano: hay que regenerar el fixture',
  );
});

test('reproduce emojione en las 1820 entradas del catalogo', () => {
  const claves = Object.keys(catalogo).sort();
  const todo = claves
    .map(k => `${k}\t${emojiImg(catalogo[k].unicode, catalogo[k].shortname)}`)
    .join('\n');
  const sha = createHash('sha256').update(todo, 'utf8').digest('hex');

  assert.equal(
    sha, golden.sha256Catalogo,
    'la salida de emojiImg() ya no coincide con la de emojione en todo el catalogo',
  );
});

test('coincide emoji a emoji en los 52 casos de la muestra', () => {
  for (const [clave, esperado] of Object.entries(golden.muestra)) {
    const entrada = catalogo[clave];
    assert.ok(entrada, `el catalogo ya no tiene '${clave}'`);
    assert.equal(
      emojiImg(entrada.unicode, entrada.shortname), esperado,
      `distinto en '${clave}'`,
    );
  }
});

test('el alt lleva el emoji de verdad, no el shortname', () => {
  // emojione ponia el caracter para que al copiar el texto, o al leerlo un
  // lector de pantalla, saliera el emoji y no '<img>' ni ':smile:'.
  assert.equal(emojiAlt('1f604'), '\u{1f604}');
  assert.equal(emojiImg('1f604', ':smile:').includes('alt="\u{1f604}"'), true);
});

test('junta los codepoints de banderas y secuencias', () => {
  // Las banderas son dos indicadores regionales; sin esto saldria el alt a
  // medias y el src con un solo codepoint, que en jsDelivr es un 404.
  assert.equal(emojiAlt('1f1ea-1f1f8'), '\u{1f1ea}\u{1f1f8}');
  assert.equal(
    emojiImg('1f1ea-1f1f8', ':es:'),
    '<img class="emojione" alt="\u{1f1ea}\u{1f1f8}" title=":es:" src="https://cdn.jsdelivr.net/emojione/assets/png/1f1ea-1f1f8.png?v=2.2.7"/>',
  );
});

test('\':smile:\' se puede buscar por shortname en el catalogo', () => {
  // Las dos barras de formulario (msgFormView y formView) piden justo este,
  // ahora via emojis.img(':smile:'), que indexa por shortname y no por la
  // clave del JSON. Si algun dia se renombra, esas dos barras se quedan sin
  // icono en silencio, porque img() devuelve cadena vacia y no falla.
  const entrada = Object.values(catalogo).find(v => v.shortname === ':smile:');
  assert.ok(entrada, 'el catalogo ya no trae \':smile:\'');
  assert.equal(emojiImg(entrada.unicode, entrada.shortname), golden.muestra.smile);
});

test('conserva el ?v=2.2.7 de la URL', () => {
  // Va en las URLs ya guardadas en la base. Quitarlo cambiaria el markup nuevo
  // respecto al viejo aunque la imagen se siguiera viendo.
  assert.match(emojiImg('1f604', ':smile:'), /\.png\?v=2\.2\.7"\/>$/);
});
