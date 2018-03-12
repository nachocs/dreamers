import Backbone from 'backbone';
import _ from 'lodash';
import template from './mainView.html';
import LibraryView from './entradas/libraryView';
import LoginView from './header/loginView';
import FormView from './entradas/formView';
import ModalView from './msgs/modalView';
import MenuDreamers from './header/menuDreamersView';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(options) {
    this.router = options.router;
    this.libraryView = new LibraryView({
      collection: this.collection,
      router: this.router,
    });
    this.formView = new FormView({
      collection: this.collection,
    });
    this.loginView = new LoginView();
    this.menuDreamers = new MenuDreamers({ router: this.router });
    this.model = new Backbone.Model();
    this.model.set('Titulo', 'dreamers');
    // logodreamers50x50
    this.images = {
      logo: require('../../img/logodreamers50x50.jpg'),
    };
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.$('#container').html(this.libraryView.render().el);
    // this.$('#head').append(this.logoView.render().el);
    this.$('.form-view').html(this.formView.render().el);
    this.$('.login-view').html(this.loginView.render().el);
    this.$('.modal-view').html(ModalView.render().el);
    this.$('.resumen-collection').html(this.menuDreamers.render().el);
    return this;
  },
  serializer() {
    return Object.assign({},
      this.model.toJSON(), {
        imgLogo: this.images.logo,
      });
  },
});