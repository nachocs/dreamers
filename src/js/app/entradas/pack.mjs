//
// Empaquetado del mosaico: first-fit bin packing.
//
// Extraido de libraryView.ordenar() sin cambiar el algoritmo. Era ya una
// funcion pura disfrazada de metodo de vista -- no leia ni escribia el DOM,
// solo miraba SQancho/SQalto de cada modelo y el numero de columnas -- pero
// al vivir dentro de la vista no habia forma de probarlo.
//
// Va en .mjs a proposito: asi Node lo carga tal cual con `node --test`, sin
// runner ni transpilador de por medio. El bundle lo procesa igual, porque la
// regla de babel-loader cubre /\.m?js$/.
//
// NO tiene estado: cada llamada construye su propia matriz. La de antes se
// guardaba en $D.matrix entre llamadas, pero solo la leia ordenar() y ademas
// reseteaba las columnas 0..columnas-1 en cada pasada, asi que lo que
// sobrevivia nunca llegaba a leerse.

// Marca de celda ocupada. Se guarda el id para poder inspeccionar la matriz
// al depurar, pero la ocupacion se comprueba con !== undefined, NO por
// veracidad como hacia el original.
//
// El original hacia `if (matrix[c][f])`, y eso trata como LIBRE una celda
// ocupada por una entrada cuyo id sea 0 o cadena vacia -- los ids vienen del
// JSON del CGI, o sea que no es imposible --, con lo que dos entradas se
// solaparian. Es el unico punto donde esta version se aparta del original a
// proposito, y solo puede evitar solapes, nunca crearlos.
const LIBRE = undefined;

/**
 * Coloca las entradas en una rejilla de `columnas` columnas.
 *
 * @param {Array<{id: *, SQancho: number, SQalto: number}>} items  en orden de coleccion.
 * @param {number} columnas  columnas de la rejilla (calculaAncho() garantiza >= 2).
 * @param {number} [columnasRecorte=columnas]  ancho maximo permitido a una entrada.
 *   Existe porque ordenar() recortaba contra $D.SQanchoTotal (el global) mientras
 *   empaquetaba contra el resultado de calculaAncho(). Normalmente coinciden, pero
 *   ordenar() puede dispararse por el evento 'ordenar' de la coleccion sin que
 *   detect_resize haya actualizado el global, y entonces NO coinciden. Se mantiene
 *   la distincion en vez de "arreglarla": cambiarla altera que entradas se recortan.
 * @returns {{posiciones: Array, filas: number, matrix: Array}}
 *   posiciones lleva, por entrada y en el mismo orden: id, posX, posY, el
 *   SQancho/SQalto efectivos (recortados o no) y `recortado`.
 *   `filas` es lo que la vista guardaba en this.maxLines: las filas ocupadas en la
 *   columna 0, que es lo que usa extenderLineas() para el scroll infinito.
 */
export function pack(items, columnas, columnasRecorte = columnas) {
  if (!(columnas >= 1)) {
    // Negado a proposito, como en calculaAncho(): `columnas < 1` no atrapa NaN.
    // Antes esto no fallaba aqui sino tres saltos mas lejos, en matrix[0].length,
    // y se llevaba por delante la aplicacion entera (ver README, 1.0.11).
    throw new RangeError(`pack: columnas debe ser un numero >= 1, recibido ${columnas}`);
  }

  const matrix = [];
  for (let j = 0; j < columnas; j++) {
    matrix[j] = [];
  }

  // Fila que se esta probando. Es de la funcion entera, no de populateMatrix:
  // la recursion la va subiendo hasta encontrar sitio, y se reinicia por entrada.
  let k = 0;

  function cabe(j, ancho, alto) {
    for (let ix = 0; ix < ancho; ix++) {
      for (let iy = 0; iy < alto; iy++) {
        if ((j + ix) >= columnas) {
          return false;
        }
        if (matrix[j + ix][k + iy] !== LIBRE) {
          return false;
        }
      }
    }
    return true;
  }

  function colocar(id, ancho, alto) {
    for (let j = 0; j < columnas; j++) {
      if (cabe(j, ancho, alto)) {
        for (let ix = 0; ix < ancho; ix++) {
          for (let iy = 0; iy < alto; iy++) {
            matrix[j + ix][k + iy] = id;
          }
        }
        return [j, k];
      }
    }
    k++;
    return colocar(id, ancho, alto);
  }

  const posiciones = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let SQancho = item.SQancho;
    let SQalto = item.SQalto;
    let recortado = false;

    // El original comprueba SOLO SQancho y luego pisa AMBOS con el mismo
    // valor: un 3x3 expandido en un movil de 2 columnas queda 2x2, no 2x3.
    if (SQancho > columnasRecorte) {
      SQancho = columnasRecorte;
      SQalto = columnasRecorte;
      recortado = true;
    }

    // Si aun asi no cabe a lo ancho, cabe() no puede devolver true en ninguna
    // columna y colocar() se llamaria a si misma para siempre. El original
    // desbordaba la pila; aqui se dice lo que pasa. Solo es alcanzable cuando
    // columnasRecorte > columnas, que es justo el caso que describe el
    // parametro: recorte contra el global y empaquetado contra la medida local.
    if (SQancho > columnas) {
      throw new RangeError(
        `pack: la entrada ${item.id} ocupa ${SQancho} columnas y la rejilla tiene ${columnas}`,
      );
    }

    k = 0;
    const [posX, posY] = colocar(item.id, SQancho, SQalto);
    posiciones.push({ id: item.id, posX, posY, SQancho, SQalto, recortado });
  }

  return { posiciones, filas: matrix[0].length, matrix };
}
