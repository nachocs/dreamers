export default {
  path: 'https://dreamers.es/com/home2/',
  loginCgi: 'https://dreamers.es/com/home2/cgi/login.cgi',
  emailLoginCgi: 'https://dreamers.es/com/home2/cgi/emaillogin.cgi',
  // Alta rapida en 3 campos, instalada el 2026-08-16. Escribe en el mismo
  // indice 'ciudadanos' que usa gritos.com: es UN solo sistema de cuentas.
  // El registro largo del motor clasico (/ciudad/registro/) pide ahora los
  // mismos tres campos y tampoco confirma por email: hay un solo criterio.
  registroCgi: 'https://dreamers.es/com/home2/cgi/registro.cgi',
  // Cerrar sesion tiene que pasar por el servidor: borrar la cookie desde
  // aqui dejaba vivo el fichero de sesion (hasta 10 dias), asi que la tienda
  // te seguia viendo dentro. Esto la borra de verdad.
  logoffCgi: 'https://dreamers.es/ciudad/panelillo/panel.cgi?logoff=1&loginhead=1',
  // Dice si un alias o un email estan libres, para avisar mientras se
  // escribe: ?indice=alias|email&value=...
  checkCgi: 'https://dreamers.es/com/home2/cgi/check.cgi',
};
