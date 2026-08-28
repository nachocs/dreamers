// De donde cuelgan los CGI del motor Indices.
//
// En DESARROLLO va vacio a proposito, o sea rutas relativas: asi las peticiones
// salen al MISMO origen que la pagina (localhost:3002) y las recoge el proxy
// del dev server, que las reenvia a dreamers.es. Sin esto el navegador iba
// directo a https://dreamers.es, se saltaba el proxy, y la peticion pasaba a
// ser cross-origin: el login la manda con withCredentials, que es el caso mas
// estricto de CORS -- exige Access-Control-Allow-Origin con el origen exacto
// (no vale '*') MAS Access-Control-Allow-Credentials: true --, y los CGI en
// Perl no mandan ninguna de las dos. De ahi que el login no funcionase en
// local aunque el proxy estuviera bien configurado.
//
// En produccion la portada se sirve desde dreamers.es, asi que estas mismas
// rutas relativas ya apuntan al sitio correcto y siguen siendo mismo-origen.
// El dominio se deja explicito solo si se define ENDPOINTS_ROOT_DOMAIN al
// construir, que es para cuando el front se sirve desde otro sitio.
const raiz = process.env.ENDPOINTS_ROOT_DOMAIN
  ? `https://${process.env.ENDPOINTS_ROOT_DOMAIN}`
  : '';

export default {
  path: `${raiz}/com/home2/`,
  loginCgi: `${raiz}/com/home2/cgi/login.cgi`,
  emailLoginCgi: `${raiz}/com/home2/cgi/emaillogin.cgi`,
  // Alta rapida en 3 campos, instalada el 2026-08-16. Escribe en el mismo
  // indice 'ciudadanos' que usa gritos.com: es UN solo sistema de cuentas.
  // El registro largo del motor clasico (/ciudad/registro/) pide ahora los
  // mismos tres campos y tampoco confirma por email: hay un solo criterio.
  registroCgi: `${raiz}/com/home2/cgi/registro.cgi`,
  // Cerrar sesion tiene que pasar por el servidor: borrar la cookie desde
  // aqui dejaba vivo el fichero de sesion (hasta 10 dias), asi que la tienda
  // te seguia viendo dentro. Esto la borra de verdad.
  logoffCgi: `${raiz}/ciudad/panelillo/panel.cgi?logoff=1&loginhead=1`,
  // Dice si un alias o un email estan libres, para avisar mientras se
  // escribe: ?indice=alias|email&value=...
  checkCgi: `${raiz}/com/home2/cgi/check.cgi`,
};
