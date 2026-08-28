/*jslint browser: true*/
import $D from './global';
import Backbone from 'backbone';
import $ from 'jquery';
import config from './config';

export default Backbone.Router.extend({
  routes: {
    '': 'home',
    'home': 'home',
    'blank': 'blank',
    'indices/': 'home',
    'indices/:indice(/:entrada)': 'indices',
  },
  initialize(options) {
    this.collection = options.collection;
  },
  home() {
    //      $container.empty();
    this.posInicial(true);
    this.collection.reset();
    this.collection.fetch({
      indice: '',
      beforeSend() {
        $D.Loading = true;
        $D.Uroboro.open();
      },
      complete() {
        $D.Loading = false;
        $D.Uroboro.close();
      },
      // ,success: function (){
      //  var $container = $('#container');
      //  $container.html(self.libraryView.render().el);
      //  self.inicializado = true;
      // }
    });
  },
  blank() {
    $('#container').empty();
    $('#container').text('blank');
  },
  // Con ':entrada' esto es el enlace permanente a UN articulo, que es lo que
  // necesita un aviso por correo o una notificacion para llevarte al sitio
  // exacto. Sin ella se comporta como siempre: el indice entero.
  //
  // Aqui habia un intento anterior (la llamada comentada a
  // 'libraryView.saltointerior'), que traia la pagina del motor clasico con
  // '?ajax=1' y la incrustaba en un panel lateral. No se recupera: montaba un
  // segundo sitio dentro del primero, sin comentarios ni formulario.
  indices(indice, entrada) {
    // El indice viaja con '::' en la ruta porque muchos llevan barra dentro
    // ('tienda/productos'), y si no partirian la ruta en dos.
    indice = indice.replace(/\:\:/ig, '\/');

    if (!entrada) {
      this.cargarIndice(indice, null);
      return;
    }
    // Un enlace con una entrada que no existe NO puede llegar a la
    // coleccion: json.cgi baja de uno en uno desde 'empieza' buscando
    // registros validos, asi que un numero fuera de rango lo pone a leer
    // ficheros a lo tonto. Medido contra el servidor: 'empieza=1000000' en
    // un indice de 4.371 entradas son 12 segundos de CGI, y 'empieza' de
    // cien millones no contesta en un minuto. Y estos enlaces van a venir
    // de avisos por correo, o sea viejos y a veces ya rotos.
    // Asi que primero se comprueba, y si no existe se cae al indice.
    const self = this;
    this.comprobarEntrada(indice, entrada).then(existe => {
      self.cargarIndice(indice, existe ? entrada : null);
    });
  },
  // Dice si la entrada existe. json.cgi con 'indice'+'entrada' hace una
  // lectura directa del registro (~0,6s, que es el coste de arrancar el CGI,
  // no del tamano del indice) y cuando no existe devuelve un objeto con todo
  // a null y, lo que importa, SIN 'ID'.
  comprobarEntrada(indice, entrada) {
    return $.ajax({
      url: config.path + 'cgi/json.cgi?indice=' + encodeURIComponent(indice) +
        '&entrada=' + encodeURIComponent(entrada),
      dataType: 'json',
      beforeSend() {
        $D.Uroboro.open();
      },
      complete() {
        $D.Uroboro.close();
      },
    }).then(
      rec => !!(rec && rec.ID),
      // Si la consulta falla se sigue adelante sin abrir nada: mas vale
      // ensenar el indice que dejar la pagina en blanco.
      () => false,
    );
  },
  cargarIndice(indice, entrada) {
    this.posInicial(true);
    this.collection.reset();
    // Que articulo hay que abrir solo al pintarse. Se guarda el indice
    // ademas del numero porque el numero de entrada NO es unico entre
    // indices, y sin el podria abrirse un articulo que no es.
    this.collection.abrirEntrada = entrada
      ? { indice, entrada: String(entrada) }
      : null;
    this.collection.fetch({
      indice,
      empieza: this.empiezaEn(entrada),
      beforeSend() {
        $D.Loading = true;
        $D.Uroboro.open();
      },
      complete() {
        $D.Loading = false;
        $D.Uroboro.close();
      },
    });
    this.inicializado = true;
  },
  // Cursor con el que arranca la coleccion para que 'entrada' salga la
  // primera y detras vayan los siguientes del indice.
  //
  // El +1 no es un apano: json.cgi devuelve desde 'empieza - 1' hacia atras
  // (su bucle es 'for ($id = $numeroentrada-1; $id; $id--)'), asi que para
  // que el articulo E encabece la lista hay que pedirle E+1. Y dentro de un
  // indice concreto 'num', 'entrada' e 'ID' son el mismo numero, comprobado
  // contra el CGI.
  //
  // Si la entrada no es un numero se cae a lo ultimo publicado: mejor
  // ensenar el indice que dejar la pagina en blanco.
  empiezaEn(entrada) {
    const num = parseInt(entrada, 10);
    return (entrada && !isNaN(num)) ? num + 1 : '';
  },
  posInicial(inicio) {
    // const ancho = $('#contenido').width();
    $('#container').css({
      'overflow-y': '',
      'overflow-x': '',
    });
    //          $('#container').width(ancho);
    //          $('#container').height($('#contenido').height());
    $('#resultado').hide();
    if (inicio) {
      $('#contenidodinamico').empty();
    }
  },
});
