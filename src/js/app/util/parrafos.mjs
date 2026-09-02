//
// Agrupar en parrafos el cuerpo de un articulo.
//
// El motor Perl devuelve el cuerpo como una sopa plana: en el articulo de
// Lanterns son 176 nodos sueltos -50 de texto, 104 <br>, 10 <b>, 5 <i>, 4
// <img>- y CERO elementos <p>. Los parrafos son <br><br> y ya.
//
// Sin parrafos de verdad no se puede:
//   - limitar el ancho del texto sin limitar tambien el de las fotos, que en
//     la fase 3 son justo lo que se quiere ver grande;
//   - distinguir un titulillo (un <b> que ocupa el renglon entero) de una
//     negrita dentro de una frase, que es lo que hacia que los diez
//     titulillos del articulo no se vieran como titulillos;
//   - y, el dia que se quieran columnas por zonas, no hay por donde cortar.
//
// No se toca el motor: la sopa se agrupa aqui, en el cliente, despues de
// pintar. Si esto no corriera, queda el cuerpo de siempre con sus <br><br>.

const ESPACIO = /^\s*$/;

function esSalto(n) {
  return n.nodeType === 1 && n.nodeName === 'BR';
}

function esFigura(n) {
  if (n.nodeType !== 1) { return false; }
  if (n.nodeName === 'IMG') { return true; }
  // una imagen enlazada: <a href><img></a>
  return n.nodeName === 'A' && n.children.length === 1 && n.children[0].nodeName === 'IMG';
}

function vacio(nodos) {
  return nodos.every(n => (n.nodeType === 3 && ESPACIO.test(n.data)) || esSalto(n));
}

// Un titulillo es un parrafo cuyo unico contenido con letra es un <b>.
// Asi se distingue de la negrita a mitad de frase, que no debe crecer.
function esTitulillo(nodos) {
  const conLetra = nodos.filter(n => !(n.nodeType === 3 && ESPACIO.test(n.data)) && !esSalto(n));
  if (conLetra.length !== 1) { return false; }
  const u = conLetra[0];
  return u.nodeType === 1 && (u.nodeName === 'B' || u.nodeName === 'STRONG');
}

export function agruparParrafos(contenedor) {
  if (!contenedor || contenedor.dataset.parrafos === 'si') { return 0; }

  const hijos = Array.prototype.slice.call(contenedor.childNodes);
  const bloques = [];
  let buffer = [];
  let saltos = 0;

  function cerrar() {
    if (buffer.length && !vacio(buffer)) { bloques.push({ tipo: 'p', nodos: buffer }); }
    buffer = [];
  }

  for (const n of hijos) {
    if (esSalto(n)) {
      saltos++;
      // dos saltos seguidos = cambio de parrafo; uno solo se respeta dentro
      if (saltos >= 2) { cerrar(); } else { buffer.push(n); }
      continue;
    }
    if (n.nodeType === 3 && ESPACIO.test(n.data)) { continue; }
    saltos = 0;
    if (esFigura(n)) { cerrar(); bloques.push({ tipo: 'figura', nodos: [n] }); continue; }
    buffer.push(n);
  }
  cerrar();

  if (!bloques.length) { return 0; }

  const frag = document.createDocumentFragment();
  let n = 0;
  for (const b of bloques) {
    if (b.tipo === 'figura') {
      const caja = document.createElement('div');
      caja.className = 'figura';
      caja.appendChild(b.nodos[0]);
      frag.appendChild(caja);
      continue;
    }
    const p = document.createElement('p');
    if (esTitulillo(b.nodos)) { p.className = 'titulillo'; }
    // los <br> sueltos del final de un parrafo no pintan nada
    while (b.nodos.length && esSalto(b.nodos[b.nodos.length - 1])) { b.nodos.pop(); }
    b.nodos.forEach(x => p.appendChild(x));
    frag.appendChild(p);
    n++;
  }
  contenedor.textContent = '';
  contenedor.appendChild(frag);
  contenedor.dataset.parrafos = 'si';
  return n;
}


// --------------------------------------------------------------------------
// La portada repetida de los blogs
//
// El lector de RSS (rsscron.cgi) coge la primera imagen del post y la guarda
// como IMAGEN1_URL para la vineta. Pero la deja tambien dentro del cuerpo, asi
// que al desplegar se ve DOS veces: la de basicoTemplate (.main-image) y la
// del propio texto. Medido sobre 50 entradas de blog: en las 49 que llevan
// imagen, la URL es identica byte a byte.
//
// Se quita la del cuerpo y se conserva la de arriba, que es la que usa el
// resto del sitio. Si la del cuerpo iba dentro de un enlace -Blogger enlaza a
// la version grande-, se devuelve ese href para no perder el "pinchar para
// verla grande".
export function quitarPortadaRepetida(contenedor, urlPortada) {
  if (!contenedor || !urlPortada) { return null; }

  const mismas = (a, b) => {
    if (!a || !b) { return false; }
    if (a === b) { return true; }
    // por si alguna entrada antigua cambia solo el trozo del tamano
    const hoja = u => u.replace(/[?#].*$/, '').split('/').filter(Boolean).pop();
    return hoja(a) === hoja(b);
  };

  const img = Array.prototype.slice.call(contenedor.querySelectorAll('img'))
    .find(i => mismas(i.getAttribute('src'), urlPortada) || mismas(i.src, urlPortada));
  if (!img) { return null; }

  const enlace = img.closest('a');
  const href = enlace ? enlace.getAttribute('href') : null;

  // subir mientras el padre no tenga mas contenido que esta imagen, para
  // llevarse tambien el <div class="separator"> de Blogger y no dejar un
  // hueco vacio donde estaba
  let quitar = img;
  while (quitar.parentElement
         && quitar.parentElement !== contenedor
         && !(quitar.parentElement.textContent || '').trim()
         && quitar.parentElement.querySelectorAll('img').length === 1) {
    quitar = quitar.parentElement;
  }
  quitar.remove();

  // si el parrafo que la contenia se ha quedado sin nada, fuera tambien
  Array.prototype.slice.call(contenedor.querySelectorAll('p, .figura'))
    .forEach((e) => {
      if (!(e.textContent || '').trim() && !e.querySelector('img')) { e.remove(); }
    });

  return href;
}

export default agruparParrafos;
