// /*global $D*/
/*jslint browser: true*/

import Backbone from 'backbone';
import moment from 'moment';
import MainView from './mainView';
import EntradaCollection from './models/entradaCollection';
import $ from 'jquery';
import Router from './router';

moment.locale('es');

// const App = new DHome({
//   userModel,
// });
// $('.titular').click(ev => {
//   $D.App.libraryView.muestraIndice(ev);
// });


const App = Backbone.View.extend({
  initialize() {
    this.collection = new EntradaCollection();
    this.router = new Router({collection: this.collection});
    this.mainView = new MainView({
      collection: this.collection,
    });
    $('#root').html(this.mainView.render().el);
    Backbone.history.start();

  },
});


export default new App();
