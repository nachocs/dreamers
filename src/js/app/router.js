/*global $D*/
/*jslint browser: true*/
import Backbone from 'backbone';

import $ from 'jquery';
import LibraryView from './libraryView';
import Collection from './entradaCollection';
const library = new Collection();
import LogoView from './logoView';
import LoginView from './loginView';
import FormView from './formView';

export default Backbone.Router.extend({
  routes: {
    '': 'home',
    'home': 'home',
    'blank': 'blank',
    'indices/': 'home',
    'indices/:indice(/:entrada)': 'indices',
  },
  initialize({userModel}) {
    this.libraryView = new LibraryView({
      collection: library,
    });
    $('#container').append(this.libraryView.render().el);
    this.logoView = new LogoView();
    $('#head').append(this.logoView.render().el);

    this.formView = new FormView({
      collection: library,
      userModel,
    });
    $('#head').append(this.formView.render().el);

    this.loginView = new LoginView({
      userModel,
    });
    $('#head').append(this.loginView.render().el);

  },
  home() {
    $D.indice = '';
    $D.empieza = '';
    //      $container.empty();
    this.posInicial(true);
    this.libraryView.collection.reset();
    this.libraryView.collection.fetch({
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

    if ((indice !== $D.indice && !entrada) || !this.inicializado) {
      //  $('#contenidodinamico').empty();

      $D.empieza = '';
      $D.indice = indice;
      this.posInicial(true);
      this.libraryView.collection.reset();
      this.libraryView.collection.fetch({
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
    } else if (indice === $D.indice && !entrada) {
      this.posInicial(false);
    }
    //          $container.html(this.libraryView.render().el);
    if (entrada) {
      $D.App.libraryView.saltointerior(indice, entrada);
    }
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
