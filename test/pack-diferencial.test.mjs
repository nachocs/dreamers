//
// Arnes diferencial: pack() contra el algoritmo original, entrada por entrada.
//
// La referencia de mas abajo es una transcripcion LITERAL del cuerpo de
// libraryView.ordenar() tal y como estaba en el commit 896f928, justo antes de
// extraerlo. Lo unico que cambia es de donde salen los datos: donde el original
// hacia this.collection.models[i].get('SQancho'), aqui se lee de un objeto
// plano. El algoritmo -- el orden de los bucles, el reinicio de k por entrada,
// la recursion al subir de fila, el recorte contra el global y la comprobacion
// de celda por veracidad -- se deja exactamente igual, fallos incluidos.
//
// Para verla al lado de la original:  git show 896f928:src/js/app/entradas/libraryView.js
//
// Si algun dia se toca pack(), esto es lo que avisa de que ha cambiado de
// comportamiento. NO se debe "actualizar la referencia para que pase": la
// referencia es la definicion de correcto.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pack } from '../src/js/app/entradas/pack.mjs';

// ---------------------------------------------------------------------------
// Referencia: el ordenar() original, sin Backbone
// ---------------------------------------------------------------------------
function ordenarOriginal(items, SQanchoTotal, globalSQanchoTotal) {
  let j;
  let i;
  let k = 0;
  const matrix = [];
  let posArr = [];

  for (j = 0; j < SQanchoTotal; j++) {
    matrix[j] = [];
  }

  function checkMatrix(j, k, ancho, alto) {
    let ix, iy;
    for (ix = 0; ix < ancho; ix++) {
      for (iy = 0; iy < alto; iy++) {
        if ((j + ix) >= SQanchoTotal) {
          return false;
        }
        if (matrix[j + ix][k + iy]) {
          return false;
        }
      }
    }
    return true;
  }

  function populateMatrix(modelo, ancho, alto) {
    let j, ix, iy;
    for (j = 0; j < SQanchoTotal; j++) {
      if (checkMatrix(j, k, ancho, alto)) {
        for (ix = 0; ix < ancho; ix++) {
          for (iy = 0; iy < alto; iy++) {
            matrix[j + ix][k + iy] = modelo;
          }
        }
        return [j, k];
      }
    }
    k++;
    return populateMatrix(modelo, ancho, alto);
  }

  function getMatrixPopulated(modelo, ancho, alto) {
    k = 0;
    return populateMatrix(modelo, ancho, alto);
  }

  const salida = [];
  for (i = 0; i < items.length; i++) {
    let ancho = items[i].SQancho;
    let alto = items[i].SQalto;
    if (ancho > globalSQanchoTotal) {
      ancho = globalSQanchoTotal;
      alto = globalSQanchoTotal;
    }
    posArr = getMatrixPopulated(items[i].id, ancho, alto);
    salida.push({ id: items[i].id, posX: posArr[0], posY: posArr[1] });
  }

  return { posiciones: salida, filas: matrix[0].length };
}

// ---------------------------------------------------------------------------
// Generador de casos
// ---------------------------------------------------------------------------

// PRNG con semilla (mulberry32): un fallo se reproduce con su numero de caso,
// que es justo lo que falta cuando un test aleatorio falla en el CI y no en local.
function rng(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tamanos que el modelo puede producir de verdad (entradaModel.initialize y
// entradaView.expande): 1x1 normal, 2x2 destacado, 3x3 expandido, y
// SQanchoTotal x N al expandir del todo.
function generarItems(rand, n, columnas) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const d = rand();
    let SQancho = 1, SQalto = 1;
    if (d > 0.9) {
      SQancho = columnas; SQalto = 1 + Math.floor(rand() * 10);
    } else if (d > 0.75) {
      SQancho = 3; SQalto = 3;
    } else if (d > 0.5) {
      SQancho = 2; SQalto = 2;
    }
    // ids no falsy a proposito: con id 0 el original tiene un fallo que pack()
    // no reproduce. Se comprueba aparte, en pack.test.mjs.
    items.push({ id: `e${i + 1}`, SQancho, SQalto });
  }
  return items;
}

// ---------------------------------------------------------------------------
// El test
// ---------------------------------------------------------------------------
test('pack() coincide con el ordenar() original en 2000 casos al azar', () => {
  let casos = 0;

  for (let semilla = 1; semilla <= 2000; semilla++) {
    const rand = rng(semilla);
    const columnas = 2 + Math.floor(rand() * 11);   // 2..12, como calculaAncho
    const n = Math.floor(rand() * 40);              // 0..39 entradas
    const items = generarItems(rand, n, columnas);

    const esperado = ordenarOriginal(items, columnas, columnas);
    const obtenido = pack(items, columnas, columnas);

    assert.deepEqual(
      obtenido.posiciones.map(p => ({ id: p.id, posX: p.posX, posY: p.posY })),
      esperado.posiciones,
      `posiciones distintas con semilla ${semilla} (columnas=${columnas}, n=${n})`,
    );
    assert.equal(
      obtenido.filas, esperado.filas,
      `maxLines distinto con semilla ${semilla} (columnas=${columnas}, n=${n})`,
    );
    casos++;
  }

  assert.equal(casos, 2000);
});

test('coinciden tambien cuando el recorte va contra un global distinto', () => {
  // ordenar() recortaba contra $D.SQanchoTotal y empaquetaba contra
  // calculaAncho(). Aqui se separan a proposito, con recorte <= columnas para
  // no entrar en la recursion infinita que ambos tienen.
  for (let semilla = 1; semilla <= 500; semilla++) {
    const rand = rng(semilla + 100000);
    const columnas = 3 + Math.floor(rand() * 8);
    const recorte = 2 + Math.floor(rand() * (columnas - 1));  // 2..columnas
    const items = generarItems(rand, Math.floor(rand() * 25), columnas);

    assert.deepEqual(
      pack(items, columnas, recorte).posiciones.map(p => ({ id: p.id, posX: p.posX, posY: p.posY })),
      ordenarOriginal(items, columnas, recorte).posiciones,
      `distintas con semilla ${semilla} (columnas=${columnas}, recorte=${recorte})`,
    );
  }
});
