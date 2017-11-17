/*jslint browser: true*/
import $D from './global';
import Backbone from 'backbone';
import $ from 'jquery';
import LibraryView from './entradas/libraryView';
import Collection from './models/entradaCollection';
const library = new Collection();
import LogoView from './header/logoView';
import LoginView from './header/loginView';
import FormView from './entradas/formView';
import ModalView from './msgs/modalView';

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
    this.logoView = new LogoView();
    this.formView = new FormView({
      collection: library,
    });
    this.loginView = new LoginView({
      userModel,
    });
    $('#container').append(this.libraryView.render().el);
    $('#head').append(this.logoView.render().el);
    $('#head').append(this.formView.render().el);
    $('#head').append(this.loginView.render().el);
    $('.modal-view').html(ModalView.render().el);

  },
  home() {
    //      $container.empty();
    this.posInicial(true);
    this.libraryView.collection.reset();
    this.libraryView.collection.fetch({
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
      this.libraryView.collection.reset();
      this.libraryView.collection.fetch({
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
