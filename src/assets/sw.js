/* Service worker de dreamers.es
   ==============================

   ⚠️ LEE ESTO ANTES DE AMPLIARLO.

   En enero de 2020 se intento poner 'offline-plugin' aqui y se retiro el
   mismo dia con el mensaje "No puedo poner el offline plugin aqui, destroza
   todo el web" (commit ad5edbe). El motivo es que dreamers.es NO es solo la
   SPA: bajo el MISMO dominio vive todo el sitio clasico de Perl -- las
   secciones (/peliculas/, /comics/, /series/...), los foros, la ciudad, los
   contadores, los CGI del motor Indices. Un service worker tiene ambito de
   origen entero, asi que por defecto se pone en medio de TODO eso, y
   cualquier estrategia cache-first sirve paginas viejas de medio sitio.

   De ahi el principio de este fichero: NO INTERCEPTAR NADA QUE NO SEA
   NUESTRO. Solo se tocan dos cosas:

     1. la navegacion a la portada '/' (la SPA, un unico index.html)
     2. los estaticos del build: /dist/... y /assets/...

   Cualquier otra peticion se deja pasar sin respondWith, o sea que se
   comporta exactamente igual que si no hubiera service worker. Si algun dia
   hace falta cachear algo mas, que sea anadiendo un patron explicito aqui,
   nunca quitando esta restriccion.

   Estrategia: portada a RED PRIMERO (nunca cache-first: la portada lista
   novedades), estaticos a stale-while-revalidate (llevan hash en el nombre,
   asi que un cambio de contenido es siempre un nombre nuevo).

   El esqueleto viene del sw.js de tienda.dreamers.es, que lleva desde el
   2026-08-22 en produccion; alli estan documentadas en memoria las dos
   trampas que costaron una vuelta cada una (Response.text() decodifica
   siempre como UTF-8, y toda promesa de waitUntil necesita tope).
*/

var VERSION         = '1';
var CACHE_ESTATICO  = 'dm-estatico-v' + VERSION;
var CACHE_PAGINAS   = 'dm-paginas-v'  + VERSION;
var CACHES_VIGENTES = [CACHE_ESTATICO, CACHE_PAGINAS];

var MAX_ESTATICOS   = 200;
var MAX_PAGINAS     = 5;   /* aqui solo entra '/', pero por si acaso */

/* Si hay copia guardada de la portada y la red tarda mas que esto, se sirve
   la copia y la red sigue por detras refrescando. Sin copia no se corre
   carrera: no hay nada mejor que esperar. */
var ESPERA_MAX      = 4000;
var TOPE_TAREA      = 15000;

/* Testigo unico para saber quien gano la carrera; un objeto vacio no se
   puede confundir jamas con una Response. */
var TARDE = {};

/* Lo NUESTRO, lo unico que este worker puede tocar. */
var MIO_ESTATICO = /^\/(?:dist|assets)\//i;
var ESTATICO     = /\.(?:css|js|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot)$/i;

/* Cinturon y tirantes: aunque el filtro de arriba ya los deja fuera, estas
   rutas no se tocan nunca. /counter/ es especialmente importante: si una
   imagen de contador se sirviera de cache, el CGI no llega a ejecutarse y la
   visita NO se cuenta. */
var NUNCA = [
  /\.cgi(\/|\?|$)/i,
  /^\/counter\//i,
  /^\/com\/home2\//i,
  /^\/ciudad/i,
  /^\/ciudadano/i,
  /^\/chat/i,
  /^\/ajaxchat/i,
  /^\/foros/i,
  /^\/postales/i,
  /^\/admin/i,
  /^\/webmin/i
];

function esIntocable(url) {
  for (var i = 0; i < NUNCA.length; i++) {
    if (NUNCA[i].test(url.pathname)) return true;
  }
  return false;
}

/* -------------------------------------------------------------------------
   Tope para todo lo que se le pase a waitUntil().

   Un evento cuya promesa de waitUntil no se resuelve NUNCA deja el worker
   imposible de terminar, actualizar o desregistrar. Y ojo: fetch() NO falla
   cuando el servidor acepta la conexion y luego se atasca, la promesa se
   queda pendiente para siempre. Guardar en cache es un extra, no una
   obligacion, asi que nada que dependa de la red entra sin tope.
   ------------------------------------------------------------------------- */
function conTope(promesa, ms) {
  return Promise.race([
    Promise.resolve(promesa).catch(function () { return null; }),
    new Promise(function (suelta) {
      setTimeout(function () { suelta(null); }, ms || TOPE_TAREA);
    })
  ]);
}

/* Poda FIFO: cache.keys() devuelve las entradas en orden de insercion. */
function limitar(nombre, maximo) {
  return caches.open(nombre).then(function (cache) {
    return cache.keys().then(function (claves) {
      if (claves.length <= maximo) return;
      var sobran = claves.slice(0, claves.length - maximo);
      return Promise.all(sobran.map(function (k) { return cache.delete(k); }));
    });
  });
}

/* ------------------------------ la portada ------------------------------ */
function navegar(evento) {
  var req = evento.request;

  var red = fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') {
      var copia = res.clone();
      evento.waitUntil(conTope(
        caches.open(CACHE_PAGINAS).then(function (c) {
          return c.put(req, copia).then(function () {
            return limitar(CACHE_PAGINAS, MAX_PAGINAS);
          });
        })
      ));
    }
    return res;
  });

  var conRespaldo = red.catch(function () {
    return caches.match(req).then(function (guardada) {
      return guardada || new Response(
        '<!doctype html><meta charset="utf-8"><title>Sin conexion</title>' +
        '<p style="font:16px sans-serif;padding:2em">Sin conexion.</p>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    });
  });

  return caches.match(req).then(function (guardada) {
    if (!guardada) return conRespaldo;

    var reloj = new Promise(function (suelta) {
      setTimeout(function () { suelta(TARDE); }, ESPERA_MAX);
    });

    return Promise.race([conRespaldo, reloj]).then(function (ganador) {
      if (ganador !== TARDE) return ganador;
      /* Gano el reloj: se sirve la copia y la red sigue por detras. La
         portada guardada se sirve tal cual, sin tocarle el HTML: manipularlo
         obligaria a decodificar a mano (Response.text() ignora el charset) y
         no compensa el riesgo. */
      evento.waitUntil(conTope(red));
      return guardada;
    });
  });
}

/* ------------------------------- estaticos ------------------------------- */
function estatico(evento) {
  var req = evento.request;

  return caches.open(CACHE_ESTATICO).then(function (cache) {
    return cache.match(req).then(function (guardado) {
      var red = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          return cache.put(req, res.clone()).then(function () {
            return limitar(CACHE_ESTATICO, MAX_ESTATICOS);
          }).then(function () { return res; });
        }
        return res;
      }).catch(function () { return null; });

      if (guardado) {
        evento.waitUntil(conTope(red));
        return guardado;
      }
      return red.then(function (res) {
        return res || new Response('', { status: 504, statusText: 'Sin conexion' });
      });
    });
  });
}

/* --------------------------------- ciclo --------------------------------- */
self.addEventListener('install', function (e) {
  /* skipWaiting va DESPUES del tope y se ejecuta siempre: instalar no puede
     depender de que haya red. */
  e.waitUntil(
    conTope(
      caches.open(CACHE_PAGINAS).then(function (c) {
        return c.add(new Request('/', { cache: 'reload' }));
      })
    ).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    conTope(
      caches.keys().then(function (nombres) {
        return Promise.all(nombres.map(function (n) {
          /* Se borra TODA cache que no sea de esta version, no solo las
             'dm-'. Es lo que limpia de paso las que dejo el offline-plugin
             de enero de 2020 ('webpack-offline:...'), que siguen vivas en
             los navegadores que lo instalaron entonces y les sirven la
             portada de aquel ano. */
          if (CACHES_VIGENTES.indexOf(n) === -1) return caches.delete(n);
        }));
      })
    ).then(function () {
      return conTope(self.clients.claim());
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;

  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  if (url.origin !== self.location.origin) return;
  if (esIntocable(url)) return;

  if (req.mode === 'navigate') {
    /* SOLO la portada. Cualquier otra navegacion (secciones, foros, fichas
       del motor Perl...) se deja pasar intacta: ver la cabecera del fichero. */
    if (url.pathname !== '/') return;
    e.respondWith(navegar(e));
    return;
  }

  if (MIO_ESTATICO.test(url.pathname) && ESTATICO.test(url.pathname)) {
    e.respondWith(estatico(e));
  }
});

/* Interruptor por mensaje, para poder matarlo desde la consola:
   navigator.serviceWorker.controller.postMessage('desactivar-pwa') */
self.addEventListener('message', function (e) {
  if (e.data !== 'desactivar-pwa') return;
  e.waitUntil(
    conTope(
      caches.keys().then(function (nombres) {
        return Promise.all(nombres.map(function (n) { return caches.delete(n); }));
      })
    ).then(function () {
      return conTope(self.registration.unregister());
    })
  );
});
