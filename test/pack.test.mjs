//
// Comportamiento de pack(), caso a caso.
//
// El arnes diferencial (pack-diferencial.test.mjs) demuestra que pack() hace
// LO MISMO que el original. Estos tests documentan QUE es ese mismo, para que
// al leerlos se entienda el mosaico sin reconstruir el algoritmo de cabeza, y
// para dejar fijadas las dos rarezas que el codigo de la vista daba por
// supuestas sin decirlas en ningun sitio.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pack } from '../src/js/app/entradas/pack.mjs';

const pos = r => r.posiciones.map(p => ({ id: p.id, posX: p.posX, posY: p.posY }));
const item = (id, SQancho = 1, SQalto = 1) => ({ id, SQancho, SQalto });

test('coloca de izquierda a derecha y baja de fila al llenarla', () => {
  const r = pack([item('a'), item('b'), item('c')], 2);
  assert.deepEqual(pos(r), [
    { id: 'a', posX: 0, posY: 0 },
    { id: 'b', posX: 1, posY: 0 },
    { id: 'c', posX: 0, posY: 1 },
  ]);
});

test('una entrada destacada ocupa 2x2 y empuja a las siguientes', () => {
  const r = pack([item('big', 2, 2), item('x'), item('y')], 3);
  assert.deepEqual(pos(r), [
    { id: 'big', posX: 0, posY: 0 },
    { id: 'x', posX: 2, posY: 0 },   // hueco a la derecha del destacado
    { id: 'y', posX: 2, posY: 1 },   // debajo, la unica columna libre
  ]);
});

test('first-fit: rellena huecos que dejaron entradas altas', () => {
  // 'alta' ocupa la columna 0 en las filas 0 y 1. 'b' entra a su derecha y
  // 'c' cae en el hueco de la fila 1, no en una fila nueva.
  const r = pack([item('alta', 1, 2), item('b'), item('c')], 2);
  assert.deepEqual(pos(r), [
    { id: 'alta', posX: 0, posY: 0 },
    { id: 'b', posX: 1, posY: 0 },
    { id: 'c', posX: 1, posY: 1 },
  ]);
});

test('el orden de la coleccion manda: no reordena para aprovechar mejor', () => {
  // Un 2x1 tras un 1x1 en rejilla de 2 no cabe en la fila 0 y baja entero,
  // dejando un hueco. Es first-fit, no un empaquetado optimo.
  const r = pack([item('a'), item('ancha', 2, 1)], 2);
  assert.deepEqual(pos(r), [
    { id: 'a', posX: 0, posY: 0 },
    { id: 'ancha', posX: 0, posY: 1 },
  ]);
});

test('recorta a lo ancho lo que no cabe, y lo deja CUADRADO', () => {
  // Rareza deliberada del original: comprueba solo SQancho pero pisa los dos
  // valores, asi que un 3x3 expandido en un movil de 2 columnas queda 2x2, no
  // 2x3. Sin esto el empaquetado se rompe en pantallas estrechas.
  const r = pack([item('expandida', 3, 3)], 2);
  assert.equal(r.posiciones[0].SQancho, 2);
  assert.equal(r.posiciones[0].SQalto, 2);
  assert.equal(r.posiciones[0].recortado, true);
});

test('no marca como recortado lo que si cabia', () => {
  const r = pack([item('a', 2, 2)], 2);
  assert.equal(r.posiciones[0].recortado, false);
  assert.equal(r.posiciones[0].SQalto, 2);
});

test('el recorte se mide contra columnasRecorte, no contra las columnas', () => {
  // ordenar() recortaba contra $D.SQanchoTotal y empaquetaba contra
  // calculaAncho(). Con 4 columnas pero recorte 2, un 3x3 se recorta igual.
  const r = pack([item('a', 3, 3)], 4, 2);
  assert.equal(r.posiciones[0].SQancho, 2);
  assert.equal(r.posiciones[0].recortado, true);
});

test('filas cuenta las filas ocupadas en la columna 0 (el maxLines de la vista)', () => {
  // Es lo que extenderLineas() usa para decidir si pedir mas entradas, asi que
  // cuenta la columna 0, no la fila mas baja del mosaico.
  assert.equal(pack([item('a'), item('b')], 2).filas, 1);
  assert.equal(pack([item('a'), item('b'), item('c')], 2).filas, 2);
  assert.equal(pack([item('alta', 1, 3)], 2).filas, 3);
});

test('una coleccion vacia no revienta y da cero filas', () => {
  const r = pack([], 2);
  assert.deepEqual(r.posiciones, []);
  assert.equal(r.filas, 0);
});

test('un id 0 ocupa celda de verdad (el original lo daba por libre)', () => {
  // UNICA divergencia deliberada con el original. El original comprobaba la
  // celda por veracidad -- `if (matrix[c][f])` --, asi que una entrada con id 0
  // dejaba su celda como libre y la siguiente se le colocaba encima. Los ids
  // salen del JSON del CGI, o sea que no es un caso imposible.
  const r = pack([item(0), item('b')], 2);
  assert.deepEqual(pos(r), [
    { id: 0, posX: 0, posY: 0 },
    { id: 'b', posX: 1, posY: 0 },   // a su lado, NO encima
  ]);
});

test('avisa en vez de desbordar la pila si una entrada no cabe a lo ancho', () => {
  // Solo alcanzable con columnasRecorte > columnas. El original se llamaba a si
  // mismo para siempre y se llevaba la aplicacion por delante sin decir por que.
  assert.throws(() => pack([item('gigante', 5, 1)], 3, 5), {
    name: 'RangeError',
    message: /gigante.*5 columnas.*3/,
  });
});

test('avisa si le pasan columnas invalidas, NaN incluido', () => {
  // La comparacion va negada por lo mismo que en calculaAncho(): `columnas < 1`
  // no atrapa NaN. Ese NaN dejo la portada en blanco en su dia (README, 1.0.11).
  assert.throws(() => pack([item('a')], NaN), { name: 'RangeError' });
  assert.throws(() => pack([item('a')], 0), { name: 'RangeError' });
  assert.throws(() => pack([item('a')], undefined), { name: 'RangeError' });
});

test('no toca los objetos que recibe', () => {
  // La vista se apoya en esto: aplica los cambios a los modelos ella misma,
  // comparando con lo que ya tenian para no disparar rearrange de mas.
  const entrada = item('a', 3, 3);
  const copia = { ...entrada };
  pack([entrada], 2);
  assert.deepEqual(entrada, copia);
});
