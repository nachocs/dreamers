// Ya no se carga babel-polyfill (core-js 2, sin mantenimiento desde 2019):
// el objetivo de navegadores declarado en 'browserslist' trae Promise,
// Object.assign y fetch de serie, asi que solo anadia peso.
import App from './app';

// Aqui se cargaba el SDK de Facebook y se hacia FB.init() con la Graph API
// v2.11, que Meta retiro hacia enero de 2020: el boton de "facebook log in"
// llevaba anos sin funcionar, y encima era el elemento mas llamativo del
// desplegable de acceso, o sea que se llevaba los clics de justo la gente
// que venia a darse de alta y los dejaba en un callejon sin salida.
//
// No se reactiva porque Meta exige hoy vincular la app a un portfolio de
// negocio VERIFICADO (documentacion de una sociedad real), y la SL ya no
// existe. No es que falte un tramite: no se cumple el supuesto.
//
// Se retira solo la parte del navegador. En el servidor, emaillogin.cgi se
// deja intacto a proposito, por si algun dia se puede recuperar. Y OJO:
// hay ciudadanos que se dieron de alta solo por Facebook y que llevan
// tiempo sin poder entrar; ver la nota en el README antes de tocar nada
// de eso.

// El service worker (src/assets/sw.js, se copia tal cual a la raiz del
// sitio; no pasa por webpack). Va dentro de 'load' a proposito: registrarlo
// antes compite por red y CPU con el primer pintado, que es justo lo que se
// acaba de optimizar. Y el registro solo se hace desde aqui, o sea desde el
// bundle de la portada: las paginas del motor Perl no lo cargan y por tanto
// no lo registran.
//
// OJO al ambito: el fichero esta en la raiz, asi que el ambito es '/' y el
// worker ve TODO el dominio, incluido el sitio clasico. La cabecera de
// sw.js explica por que solo intercepta la portada y /dist//assets/.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      // Si falla el registro no pasa nada: el sitio funciona igual sin el.
    });
  });
}

export default App;
