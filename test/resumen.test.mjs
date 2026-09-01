//
// El resumen de la tarjeta de la portada, contra registros REALES del feed.
//
// fixtures/portada-registros.json son cinco registros copiados tal cual de
// json.cgi el 1 de septiembre de 2026: cuatro de 'news' sin encabezamiento
// (con imagen, con enlace, corto y uno de 7.943 caracteres) y el articulo de
// 'destacados' que si lo trae, para fijar que ese caso NO cambia.
//
// El fallo que esto vigila: entradaModel declara `encabezamiento: ''` en sus
// defaults, asi que la condicion original (typeof !== 'undefined' && !== null)
// se cumplia siempre y la rama del resumen era inalcanzable. La tarjeta
// acababa pintando el 'comments' entero, y el feed de la coleccion no pasa por
// el interprete de BBCode: se veian los '[b]' y los '[img][IMAGEN2_URL][/img]'.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Backbone from 'backbone';
import { resumen } from '../src/js/app/util/resumen.mjs';

const registros = JSON.parse(
  readFileSync(new URL('./fixtures/portada-registros.json', import.meta.url), 'utf8'),
);
const porEtiqueta = e => registros.find(r => r.etiqueta === e);

// La misma cabecera que arma entradaView.initialize().
const Modelo = Backbone.Model.extend({ defaults: { encabezamiento: '', comments: '' } });
function cabeza(registro) {
  const m = new Modelo(registro);
  const encabezamiento = m.get('encabezamiento');
  if (encabezamiento) { return encabezamiento; }
  if (m.get('comments')) { return resumen(m.get('comments')); }
  return '';
}

test('un registro sin encabezamiento ya no deja la cabecera vacia', () => {
  for (const r of registros.filter(x => !x.encabezamiento)) {
    assert.ok(cabeza(r).length > 0, `${r.indice}/${r.ID} se quedo sin resumen`);
  }
});

test('no se cuela BBCode ni HTML en la tarjeta', () => {
  for (const r of registros) {
    const c = cabeza(r);
    if (r.encabezamiento) { continue; }   // ese va tal cual, lo escribe un humano
    assert.doesNotMatch(c, /\[\/?[a-zA-Z0-9_]+(=[^\]]*)?\]/, `${r.indice}/${r.ID}: BBCode`);
    assert.doesNotMatch(c, /<[^>]+>/, `${r.indice}/${r.ID}: HTML`);
  }
});

test('cabe en la tarjeta', () => {
  for (const r of registros.filter(x => !x.encabezamiento)) {
    assert.ok(cabeza(r).length <= 241, `${r.indice}/${r.ID} mide ${cabeza(r).length}`);
  }
  // El de 7.943 caracteres es el que hacia el destrozo.
  assert.ok(porEtiqueta('muy largo').comments.length > 7000);
});

test('lo corto se queda entero y sin puntos suspensivos', () => {
  const c = cabeza(porEtiqueta('corto'));
  assert.doesNotMatch(c, /…$/);
});

test('corta por palabra entera', () => {
  const c = cabeza(porEtiqueta('muy largo'));
  assert.match(c, /…$/);
  assert.doesNotMatch(c, / …$/);            // ni espacio colgando
  assert.doesNotMatch(c, /&[a-zA-Z#0-9]*…$/); // ni entidad partida
});

test('el enlace deja su texto y se lleva la url', () => {
  const r = porEtiqueta('con enlace');
  const url = r.comments.match(/\[url=([^\]]+)\]/)[1];
  assert.doesNotMatch(cabeza(r), new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('el registro que trae encabezamiento no se toca', () => {
  const r = porEtiqueta('con encabezamiento');
  assert.equal(cabeza(r), r.encabezamiento);
});
