// El cajon lateral, sin material-design-lite (MEJORAS.md §4).
//
// Antes esto lo hacia MDL: su Layout.prototype.init inyectaba el boton y la
// capa oscura, y colgaba un objeto MaterialLayout del propio elemento, que es
// lo que llamaba menuDreamersView con
// `document.querySelector('.mdl-layout').MaterialLayout.toggleDrawer()`.
// El markup vive ahora en mainView.html y el comportamiento, aqui.
//
// Se exporta como funciones sueltas y no como metodo de una vista porque hay
// DOS vistas que necesitan cerrar el cajon: mainView (el boton y la capa) y
// menuDreamersView (al navegar a un indice desde el propio cajon).

const VISIBLE = 'is-visible';

function partes() {
  const drawer = document.querySelector('.mdl-layout__drawer');
  const capa = document.querySelector('.mdl-layout__obfuscator');
  const boton = document.querySelector('.mdl-layout__drawer-button');
  return { drawer, capa, boton };
}

export function estaAbierto() {
  const { drawer } = partes();
  return !!drawer && drawer.classList.contains(VISIBLE);
}

// `abrir` opcional: si no se pasa, alterna.
export function alternarDrawer(abrir) {
  const { drawer, capa, boton } = partes();
  // mainView se repinta entero al cambiar de indice, asi que estos nodos
  // pueden no existir todavia (o ya no existir) cuando alguien llame aqui.
  if (!drawer) {
    return false;
  }
  const destino = (typeof abrir === 'boolean') ? abrir : !drawer.classList.contains(VISIBLE);

  drawer.classList.toggle(VISIBLE, destino);
  if (capa) {
    capa.classList.toggle(VISIBLE, destino);
  }
  // Accesibilidad: lo mismo que hacia toggleDrawer() de MDL.
  drawer.setAttribute('aria-hidden', destino ? 'false' : 'true');
  if (boton) {
    boton.setAttribute('aria-expanded', destino ? 'true' : 'false');
  }
  return destino;
}

export function cerrarDrawer() {
  return alternarDrawer(false);
}

// El boton es un <div role="button">, no un <button>, para conservar el markup
// que generaba MDL y las reglas de main.less que cuelgan de el. Un div no
// responde solo a teclado, asi que hay que atender espacio e intro a mano --
// MDL hacia exactamente esto en drawerToggleHandler_.
export function manejarTeclaEnBoton(ev) {
  if (ev.key === ' ' || ev.key === 'Spacebar' || ev.key === 'Enter') {
    ev.preventDefault(); // que espacio no desplace la pagina
    alternarDrawer();
    return true;
  }
  return false;
}

// Escape cierra, que es lo que espera cualquiera con el cajon abierto.
// Se engancha una sola vez, al documento, y no a un nodo que se repinta.
let escapeEnganchado = false;
export function engancharEscape() {
  if (escapeEnganchado) {
    return;
  }
  escapeEnganchado = true;
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && estaAbierto()) {
      cerrarDrawer();
    }
  });
}
