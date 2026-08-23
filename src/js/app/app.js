// /*global $D*/
/*jslint browser: true*/

import Backbone from 'backbone';
import MainView from './mainView';
import EntradaCollection from './models/entradaCollection';
import $ from 'jquery';
import Router from './router';

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
      router: this.router,
    });
    $('#root').html(this.mainView.render().el);
    Backbone.history.start();

  },
});


export default new App();
