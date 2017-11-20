import Backbone from 'backbone';
import _ from 'lodash';
import template from './mainView.html';
import LibraryView from './entradas/libraryView';
import LogoView from './header/logoView';
import LoginView from './header/loginView';
import FormView from './entradas/formView';
import ModalView from './msgs/modalView';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(){
    this.libraryView = new LibraryView({
      collection: this.collection,
    });
    this.logoView = new LogoView();
    this.formView = new FormView({
      collection: this.collection,
    });
    this.loginView = new LoginView();
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    this.$('#container').append(this.libraryView.render().el);
    this.$('#head').append(this.logoView.render().el);
    this.$('#head').append(this.formView.render().el);
    this.$('#head').append(this.loginView.render().el);
    this.$('.modal-view').html(ModalView.render().el);
    return this;
  },
  serializer() {

  },
});
