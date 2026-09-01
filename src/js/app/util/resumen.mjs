//
// Resumen de texto para la tarjeta de la portada.
//
// La tarjeta pinta 'encabezamiento' cuando el registro lo trae. Cuando no lo
// trae -- el 55% de lo que sirve json.cgi, medido sobre 183 registros -- caia
// en el 'comments' entero y en crudo: el feed de la coleccion NO pasa por el
// interprete de BBCode, asi que se veian literalmente los '[b]', los
// '[img][IMAGEN2_URL][/img]' y hasta 7.943 caracteres de articulo dentro de un
// hueco de dos lineas.
//
// Aqui no se interpreta el BBCode a proposito: el interprete vive en Perl
// (sub BBCode de index.cgi) y una tarjeta es un resumen, no el articulo. Lo
// que se quiere es texto plano legible, y de paso se queda mas seguro que
// antes, porque la plantilla usa '<%=' y hasta ahora cualquier etiqueta del
// registro llegaba viva al DOM.
const TOPE = 240;

export function resumen(texto, tope = TOPE) {
  if (!texto) { return ''; }
  let t = String(texto);

  // Lo que no deja texto util: imagenes y videos van con su contenido dentro.
  t = t.replace(/\[img\][\s\S]*?\[\/img\]/gi, ' ');
  t = t.replace(/\[video\][\s\S]*?\[\/video\]/gi, ' ');

  // [url=...]esto si se queda[/url]
  t = t.replace(/\[url(?:=[^\]]*)?\]([\s\S]*?)\[\/url\]/gi, '$1');

  // El resto de marcas ([b], [i], [u]) y los huecos sueltos tipo
  // [IMAGEN2_URL] que quedan cuando la imagen no llego a existir.
  t = t.replace(/\[\/?[a-zA-Z0-9_]+(?:=[^\]]*)?\]/g, ' ');

  // <BR> es lo unico que el motor guarda ya como HTML; lo demas no deberia
  // estar, pero si esta se quita: esto acaba en un '<%=' sin escapar.
  t = t.replace(/<br\s*\/?>/gi, ' ');
  t = t.replace(/<[^>]*>/g, ' ');

  t = t.replace(/\s+/g, ' ').trim();
  if (t.length <= tope) { return t; }

  // Cortar por la ultima palabra entera, y nunca por la mitad de una entidad
  // (&quot;) que si no se quedaria como '&qu' a la vista.
  let corte = t.slice(0, tope);
  const espacio = corte.lastIndexOf(' ');
  if (espacio > tope * 0.6) { corte = corte.slice(0, espacio); }
  corte = corte.replace(/&[a-zA-Z#0-9]*$/, '');

  return corte.replace(/[\s.,;:]+$/, '') + '…';
}

export default resumen;
