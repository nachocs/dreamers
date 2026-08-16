export default {
  path: 'https://dreamers.es/com/home2/',
  loginCgi: 'https://dreamers.es/com/home2/cgi/login.cgi',
  emailLoginCgi: 'https://dreamers.es/com/home2/cgi/emaillogin.cgi',
  // Alta rapida en 3 campos, instalada el 2026-08-16. Escribe en el mismo
  // indice 'ciudadanos' que usa gritos.com: es UN solo sistema de cuentas.
  // El registro largo del motor clasico (/ciudad/registro/) sigue existiendo
  // y pide muchos mas datos y confirmacion por email; este no.
  registroCgi: 'https://dreamers.es/com/home2/cgi/registro.cgi',
  // Dice si un alias o un email estan libres, para avisar mientras se
  // escribe: ?indice=alias|email&value=...
  checkCgi: 'https://dreamers.es/com/home2/cgi/check.cgi',
};
