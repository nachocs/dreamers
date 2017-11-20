/*jslint browser: true*/
import $D from './global';
import Backbone from 'backbone';
import $ from 'jquery';

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
  indices(indice, entrada) {
    //      var $container = $('#container');
    //      $container.empty();
    indice = indice.replace(/\:\:/ig, '\/');

    if (!entrada || !this.inicializado) {
      //  $('#contenidodinamico').empty();

      this.posInicial(true);
      this.collection.reset();
      this.collection.fetch({
        indice,
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
    } else if (!entrada) {
      this.posInicial(false);
    }
    //          $container.html(this.libraryView.render().el);
    // if (entrada) {
    //   $D.App.libraryView.saltointerior(indice, entrada);
    // }
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
